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
    FOREIGN KEY(group_id) REFERENCES groups(id)
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER,
    author TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
  app.use(express.json());
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
    const info = db.prepare("INSERT INTO threads (group_id, title, author) VALUES (?, ?, ?)").run(req.params.id, title, author);
    db.prepare("INSERT INTO posts (thread_id, author, content) VALUES (?, ?, ?)").run(info.lastInsertRowid, author, content);
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/threads/:id/posts", (req, res) => {
    const { author, content } = req.body;
    db.prepare("INSERT INTO posts (thread_id, author, content) VALUES (?, ?, ?)").run(req.params.id, author, content);
    res.json({ success: true });
  });

  // Micronet Node Tracking
  const micronetNodes = new Map<string, { userId: string; deviceName: string; handle?: string; signalStrength: number }>();
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

    socket.on("join", (data: { room: string; isMicronet: boolean; deviceName?: string; userId?: string; handle?: string }) => {
      const { room, isMicronet, deviceName, userId, handle } = data;
      socketUserId = userId || Math.random().toString(36).substring(2, 8).toUpperCase();
      if (handle) socketHandle = handle;
      
      // Track socket counts
      userSocketCounts.set(socketUserId, (userSocketCounts.get(socketUserId) || 0) + 1);
      
      socket.join(room);
      
      const identity = isMicronet && deviceName ? deviceName : "UNANCHORED";
      
      if (isMicronet && deviceName) {
        micronetNodes.set(socket.id, { userId: socketUserId, deviceName, handle: socketHandle, signalStrength: getSignalStrength(socketUserId) });
        io.emit("micronet_node_update", Array.from(micronetNodes.values()));
      }

      socket.to(room).emit("message", {
        id: Date.now().toString(),
        userId: socketUserId, // Subject userId for filtering
        text: `NODE_${socketUserId} ${socketHandle ? `(${socketHandle})` : ''} [${identity}] has entered the terminal.`,
        timestamp: new Date().toISOString(),
        type: "system"
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
      micronetNodes.set(socket.id, { userId: socketUserId, deviceName: data.deviceName, handle: data.handle || socketHandle, signalStrength: getSignalStrength(socketUserId) });
      io.emit("micronet_node_update", Array.from(micronetNodes.values()));
    });

    socket.on("whisper", (data: { toUserId: string; text: string }) => {
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
      io.to(room).emit("message", {
        id: Date.now().toString(),
        userId: socketUserId,
        deviceName: isMicronet ? deviceName : "UNANCHORED",
        text,
        timestamp: new Date().toISOString(),
        type: "user",
        isMicronet
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
