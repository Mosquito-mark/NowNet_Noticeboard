import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";

// Initialize Database
const db = new Database("usenet.db");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER,
    title TEXT,
    author TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    uptime_at_post INTEGER,
    FOREIGN KEY(group_id) REFERENCES groups(id)
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER,
    author TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    uptime_at_post INTEGER,
    FOREIGN KEY(thread_id) REFERENCES threads(id)
  );
`);

// Seed initial groups if empty
const groupCount = db.prepare("SELECT COUNT(*) as count FROM groups").get() as { count: number };
if (groupCount.count === 0) {
  const insertGroup = db.prepare("INSERT INTO groups (name, description) VALUES (?, ?)");
  insertGroup.run("POST_NOW", "What's happening in this exact moment. Real-time updates.");
  insertGroup.run("PLAN_SOON", "Upcoming plans, schedules, and coordination for the near future.");
  insertGroup.run("RECALL_LATER", "Memories, recaps, and reflections on past experiences.");
  insertGroup.run("DREAM_SOMEDAY", "Long-term goals, future ideas, and wishlists.");
} else {
  // Update existing groups if they have the old names
  const updateGroup = db.prepare("UPDATE groups SET name = ?, description = ? WHERE id = ?");
  updateGroup.run("POST_NOW", "What's happening in this exact moment. Real-time updates.", 1);
  updateGroup.run("PLAN_SOON", "Upcoming plans, schedules, and coordination for the near future.", 2);
  updateGroup.run("RECALL_LATER", "Memories, recaps, and reflections on past experiences.", 3);
  updateGroup.run("DREAM_SOMEDAY", "Long-term goals, future ideas, and wishlists.", 4);
}

async function startServer() {
  const app = express();
  // Protection 1: Strict Payload Size Limits
  app.use(express.json({ limit: '5kb' })); 
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = parseInt(process.env.PORT || "3000", 10);

  // Daily Wipe Logic
  function wipeNoticeboard() {
    console.log("Wiping Noticeboard (Daily Scheduled Maintenance)...");
    db.prepare("DELETE FROM posts").run();
    db.prepare("DELETE FROM threads").run();
  }

  function scheduleDailyWipe() {
    const now = new Date();
    const nextWipe = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0, 0));
    
    if (now >= nextWipe) {
      nextWipe.setUTCDate(nextWipe.getUTCDate() + 1);
    }

    const msUntilWipe = nextWipe.getTime() - now.getTime();
    console.log(`Next Noticeboard wipe scheduled for ${nextWipe.toUTCString()} (in ${Math.round(msUntilWipe/1000/60)} minutes)`);

    setTimeout(() => {
      wipeNoticeboard();
      // Schedule the next one
      setInterval(wipeNoticeboard, 24 * 60 * 60 * 1000);
    }, msUntilWipe);
  }

  scheduleDailyWipe();

  // Protection 2: In-Memory Cooldown Tracker
  const MAX_CONTENT_LENGTH = 500;
  const MAX_TITLE_LENGTH = 150;
  const MAX_CHAT_LENGTH = 200;

  interface UserSession {
    lastAction: number;
    postTimestamps: number[];
    tier2Active: boolean;
    tier2TriggeredAt: number;
    tier2PostCount: number;
    connectedAt: number;
  }
  const userSessions = new Map<string, UserSession>();

  function getSession(userId: string): UserSession {
    let session = userSessions.get(userId);
    if (!session) {
      session = { 
        lastAction: 0, 
        postTimestamps: [], 
        tier2Active: false, 
        tier2TriggeredAt: 0, 
        tier2PostCount: 0,
        connectedAt: Date.now()
      };
      userSessions.set(userId, session);
    }
    return session;
  }

  function terminateNode(userId: string, io: Server) {
    console.warn(`TERMINATING NODE_${userId} FOR SPAM VIOLATION`);
    
    // Remove all messages from BBS
    db.prepare("DELETE FROM posts WHERE author = ? OR author LIKE ?").run(userId, `NODE_${userId}%`);
    db.prepare("DELETE FROM threads WHERE author = ? OR author LIKE ?").run(userId, `NODE_${userId}%`);
    
    // Notify client and disconnect
    io.emit("security_breach", { userId, reason: "PROTOCOL_VIOLATION: SPAM_FLOOD" });
    
    // Find all sockets for this user and disconnect them
    const sockets = io.sockets.sockets;
    for (const [id, socket] of sockets) {
      if ((socket as any).userId === userId) {
        socket.disconnect(true);
      }
    }
    
    userSessions.delete(userId);
  }

  function isThrottled(userId: string, io: Server) {
    const now = Date.now();
    const session = getSession(userId);

    // Tier 1: 5s cooldown
    const cooldown = session.tier2Active ? 60000 : 5000;
    if (now - session.lastAction < cooldown) return true;

    // Track post history for Tier 2
    session.postTimestamps.push(now);
    // Keep only last 60s of posts for Tier 2 check
    session.postTimestamps = session.postTimestamps.filter(t => now - t < 60000);

    // Check for Tier 2 trigger: > 10 posts in 1 minute
    if (!session.tier2Active && session.postTimestamps.length > 10) {
      session.tier2Active = true;
      session.tier2TriggeredAt = now;
      session.tier2PostCount = 0;
      console.log(`NODE_${userId} entered Tier 2 throttling (60s cooldown)`);
    }

    // Tier 3 Check: 10 posts in < 15 mins after Tier 2 triggered
    if (session.tier2Active) {
      session.tier2PostCount++;
      const timeSinceTier2 = now - session.tier2TriggeredAt;
      
      if (timeSinceTier2 < 15 * 60 * 1000 && session.tier2PostCount >= 10) {
        terminateNode(userId, io);
        return true;
      }

      // Reset Tier 2 if 15 mins passed without violation
      if (timeSinceTier2 >= 15 * 60 * 1000) {
        session.tier2Active = false;
        session.tier2PostCount = 0;
      }
    }

    session.lastAction = now;
    return false;
  }

  // BBS API Routes
  app.get("/api/groups", (req, res) => {
    const groups = db.prepare("SELECT * FROM groups").all();
    res.json(groups);
  });

  app.get("/api/groups/:id/threads", (req, res) => {
    const threads = db.prepare(`
      SELECT t.*, (SELECT COUNT(*) FROM posts p WHERE p.thread_id = t.id) as post_count 
      FROM threads t 
      WHERE t.group_id = ? 
      ORDER BY t.created_at DESC
    `).all(req.params.id);
    res.json(threads);
  });

  app.get("/api/threads/:id", (req, res) => {
    const thread = db.prepare("SELECT * FROM threads WHERE id = ?").get(req.params.id);
    const posts = db.prepare("SELECT * FROM posts WHERE thread_id = ? ORDER BY created_at ASC").all(req.params.id);
    res.json({ thread, posts });
  });

  app.post("/api/groups/:id/threads", (req, res) => {
    const { title, author, content } = req.body;
    
    // Protection 3: Server-side validation & Throttling
    if (!title || !author || !content) return res.status(400).json({ error: "Missing fields" });
    if (content.length > MAX_CONTENT_LENGTH || title.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({ error: "Content too long" });
    }

    // Dox-Check: Prevent IP address sharing
    const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
    if (ipRegex.test(content) || ipRegex.test(title)) {
      return res.status(400).json({ error: "SECURITY_ALERT: IP_ADDRESS_DETECTED. TRANSMISSION_BLOCKED." });
    }

    const userId = author.replace('NODE_', '');
    if (isThrottled(userId, io)) return res.status(429).json({ error: "Transmission cooldown active" });

    const session = getSession(userId);
    const uptime = Math.floor((Date.now() - session.connectedAt) / 1000);

    const info = db.prepare("INSERT INTO threads (group_id, title, author, uptime_at_post) VALUES (?, ?, ?, ?)").run(req.params.id, title, author, uptime);
    db.prepare("INSERT INTO posts (thread_id, author, content, uptime_at_post) VALUES (?, ?, ?, ?)").run(info.lastInsertRowid, author, content, uptime);
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/threads/:id/posts", (req, res) => {
    const { author, content } = req.body;

    // Protection 3: Server-side validation & Throttling
    if (!author || !content) return res.status(400).json({ error: "Missing fields" });
    if (content.length > MAX_CONTENT_LENGTH) return res.status(400).json({ error: "Content too long" });

    // Dox-Check: Prevent IP address sharing
    const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
    if (ipRegex.test(content)) {
      return res.status(400).json({ error: "SECURITY_ALERT: IP_ADDRESS_DETECTED. TRANSMISSION_BLOCKED." });
    }

    const userId = author.replace('NODE_', '');
    if (isThrottled(userId, io)) return res.status(429).json({ error: "Transmission cooldown active" });

    const session = getSession(userId);
    const uptime = Math.floor((Date.now() - session.connectedAt) / 1000);

    db.prepare("INSERT INTO posts (thread_id, author, content, uptime_at_post) VALUES (?, ?, ?, ?)").run(req.params.id, author, content, uptime);
    res.json({ success: true });
  });

  // Micronet Node Tracking
  const micronetNodes = new Map<string, { userId: string; deviceName: string; handle?: string; signalStrength: number; connectedAt: number }>();
  const userSocketCounts = new Map<string, number>();

  function getSignalStrength(userId: string) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return -Math.abs(hash % 50) - 40; // -40 to -89 dBm
  }

  // Socket.io logic
  io.on("connection", (socket) => {
    let socketUserId = "";
    let socketHandle = "";

  // Protection 4: Socket Message Throttling & Privacy Guard
    const socketLastMsg = new Map<string, number>();
    const CHAT_COOLDOWN = 1000; // 1 second between chat messages

    // Privacy Guard: Strip identifying info from socket object
    (socket as any).handshake.address = "0.0.0.0";
    (socket as any).handshake.headers['x-forwarded-for'] = undefined;
    (socket as any).handshake.headers['x-real-ip'] = undefined;

    socket.on("join", (data: { room: string; isMicronet: boolean; deviceName?: string; userId?: string; handle?: string }) => {
      const { room, isMicronet, deviceName, userId, handle } = data;
      socketUserId = userId || Math.random().toString(36).substring(2, 8).toUpperCase();
      (socket as any).userId = socketUserId;
      if (handle) socketHandle = handle;
      
      const session = getSession(socketUserId);
      
      // Track socket counts
      userSocketCounts.set(socketUserId, (userSocketCounts.get(socketUserId) || 0) + 1);
      
      socket.join(room);
      
      const identity = isMicronet && deviceName ? deviceName : "UNANCHORED";
      
      if (isMicronet && deviceName) {
        micronetNodes.set(socket.id, { 
          userId: socketUserId, 
          deviceName, 
          handle: socketHandle, 
          signalStrength: getSignalStrength(socketUserId),
          connectedAt: session.connectedAt
        });
        io.emit("micronet_node_update", Array.from(micronetNodes.values()));
      }

      socket.to(room).emit("message", {
        id: Date.now().toString(),
        userId: socketUserId, // Subject userId for filtering
        text: `NODE_${socketUserId} ${socketHandle ? `(${socketHandle})` : ''} [${identity}] has entered the terminal.`,
        timestamp: new Date().toISOString(),
        type: "system",
        connectedAt: session.connectedAt
      });
      
      socket.emit("identity_assigned", { userId: socketUserId });
      socket.emit("micronet_node_update", Array.from(micronetNodes.values()));
    });

    socket.on("update_handle", (data: { handle: string }) => {
      socketHandle = data.handle;
      const node = micronetNodes.get(socket.id);
      if (node) {
        node.handle = data.handle;
        io.emit("micronet_node_update", Array.from(micronetNodes.values()));
      }
    });

    socket.on("micronet_register", (data: { deviceName: string; handle?: string }) => {
      const session = getSession(socketUserId);
      micronetNodes.set(socket.id, { 
        userId: socketUserId, 
        deviceName: data.deviceName, 
        handle: data.handle || socketHandle, 
        signalStrength: getSignalStrength(socketUserId),
        connectedAt: session.connectedAt
      });
      io.emit("micronet_node_update", Array.from(micronetNodes.values()));
    });

    socket.on("whisper", (data: { toUserId: string; text: string }) => {
      if (!data.text || data.text.length > MAX_CHAT_LENGTH) return;
      
      const now = Date.now();
      if (now - (socketLastMsg.get('whisper') || 0) < CHAT_COOLDOWN) return;
      socketLastMsg.set('whisper', now);

      const targetSocketId = Array.from(micronetNodes.entries())
        .find(([id, node]) => node.userId === data.toUserId)?.[0];
      
      if (targetSocketId) {
        const msg = {
          id: Date.now().toString(),
          fromUserId: socketUserId,
          fromHandle: socketHandle,
          toUserId: data.toUserId,
          text: data.text,
          timestamp: new Date().toISOString(),
          type: "whisper"
        };
        io.to(targetSocketId).emit("whisper", msg);
        socket.emit("whisper", msg); // Echo back to sender
      }
    });

    socket.on("micronet_lookup", (data: { deviceNames: string[] }, callback: (users: {userId: string, deviceName: string}[]) => void) => {
      const foundUsers: {userId: string, deviceName: string}[] = [];
      for (const node of micronetNodes.values()) {
        if (data.deviceNames.includes(node.deviceName)) {
          foundUsers.push(node);
        }
      }
      callback(foundUsers);
    });

    socket.on("message", (data: { room: string; text: string; isMicronet?: boolean; deviceName?: string }) => {
      const { room, text, isMicronet, deviceName } = data;
      if (!text || text.length > MAX_CHAT_LENGTH) return;

      // Dox-Check: Prevent IP address sharing
      const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
      if (ipRegex.test(text)) {
        socket.emit("message", {
          id: Date.now().toString(),
          userId: "SYSTEM",
          text: "SECURITY_ALERT: IP_ADDRESS_DETECTED. TRANSMISSION_BLOCKED_FOR_PRIVACY.",
          timestamp: new Date().toISOString(),
          type: "system"
        });
        return;
      }

      const now = Date.now();
      if (now - (socketLastMsg.get('msg') || 0) < CHAT_COOLDOWN) return;
      socketLastMsg.set('msg', now);

      const session = getSession(socketUserId);

      io.to(room).emit("message", {
        id: Date.now().toString(),
        userId: socketUserId,
        deviceName: isMicronet ? deviceName : "UNANCHORED",
        text,
        timestamp: new Date().toISOString(),
        type: "user",
        isMicronet,
        connectedAt: session.connectedAt
      });
    });

    socket.on("disconnect", () => {
      if (!socketUserId) return;

      micronetNodes.delete(socket.id);
      
      const count = (userSocketCounts.get(socketUserId) || 0) - 1;
      if (count <= 0) {
        userSocketCounts.delete(socketUserId);
        
        // Notify all clients to remove messages from this ephemeral session
        io.emit("clear_user_messages", { userId: socketUserId });
        
        socket.broadcast.emit("message", {
          id: Date.now().toString(),
          userId: socketUserId,
          text: `NODE_${socketUserId} has left the terminal. Connection lost.`,
          timestamp: new Date().toISOString(),
          type: "system"
        });
      } else {
        userSocketCounts.set(socketUserId, count);
      }
      
      io.emit("micronet_node_update", Array.from(micronetNodes.values()));
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
