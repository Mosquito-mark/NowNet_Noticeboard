import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Shield, User, Hash, Send, AlertCircle, Info, BookOpen, MessageSquare, ChevronRight, Plus, ArrowLeft, Globe } from 'lucide-react';

interface Group {
  id: number;
  name: string;
  description: string;
}

interface Thread {
  id: number;
  group_id: number;
  title: string;
  author: string;
  created_at: string;
  post_count?: number;
}

interface Post {
  id: number;
  thread_id: number;
  author: string;
  content: string;
  created_at: string;
}

type View = 'groups' | 'threads' | 'post' | 'chat';

export default function App() {
  const [view, setView] = useState<View>('groups');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [isJoined, setIsJoined] = useState(false);
  const [isMicronetActive, setIsMicronetActive] = useState(false);
  const [micronetDevice, setMicronetDevice] = useState<string | null>(null);
  const [filterMicronet, setFilterMicronet] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<{userId: string, deviceName: string}[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  
  // Chat state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Form state
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextWipe = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0, 0));
      if (now >= nextWipe) {
        nextWipe.setUTCDate(nextWipe.getUTCDate() + 1);
      }
      const diff = nextWipe.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchGroups();
    const newSocket = io();
    setSocket(newSocket);
    newSocket.on('message', (msg: any) => setChatMessages(prev => [...prev, msg]));
    newSocket.on('identity_assigned', (data: { userId: string }) => {
      setUserId(data.userId);
    });
    newSocket.on('clear_user_messages', (data: { userId: string }) => {
      setChatMessages(prev => prev.filter(msg => msg.userId !== data.userId));
    });
    newSocket.on('micronet_node_update', (nodes: any[]) => {
      // This could be used to auto-refresh if we had a way to know which devices are physically near
      // For now, we rely on the manual SCAN to verify proximity
    });
    return () => { newSocket.close(); };
  }, []);

  const fetchGroups = async () => {
    const res = await fetch('/api/groups');
    const data = await res.json();
    setGroups(data);
  };

  const fetchThreads = async (groupId: number) => {
    const res = await fetch(`/api/groups/${groupId}/threads`);
    const data = await res.json();
    setThreads(data);
  };

  const fetchPosts = async (threadId: number) => {
    const res = await fetch(`/api/threads/${threadId}`);
    const data = await res.json();
    setPosts(data.posts);
    setSelectedThread(data.thread);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoined(true);
    socket?.emit('join', { 
      room: 'lobby', 
      isMicronet: isMicronetActive,
      deviceName: micronetDevice 
    });
  };

  const handleMicronetPairing = async () => {
    try {
      const nav = navigator as any;
      if (!nav.bluetooth) {
        alert("Bluetooth not supported in this browser/environment.");
        return;
      }

      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information']
      });

      const name = device.name || "Unknown Node";
      setMicronetDevice(name);
      setIsMicronetActive(true);
      
      if (socket) {
        socket.emit('micronet_register', { deviceName: name });
      }
      
      await device.gatt?.connect();
      
    } catch (error) {
      console.error("Bluetooth pairing failed:", error);
    }
  };

  const handleMicronetDiscovery = async () => {
    try {
      const nav = navigator as any;
      if (!nav.bluetooth) return;

      setIsScanning(true);
      
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service']
      });

      const discoveredName = device.name || "Unknown";
      
      if (socket) {
        socket.emit('micronet_lookup', { deviceNames: [discoveredName] }, (users: {userId: string, deviceName: string}[]) => {
          const newNearby = users.filter(u => u.userId !== userId);
          setNearbyUsers(prev => {
            const combined = [...prev, ...newNearby];
            const unique = Array.from(new Map(combined.map(item => [item.userId, item])).values());
            return unique;
          });
          setIsScanning(false);
          if (newNearby.length > 0) {
            alert(`MICRONET_DISCOVERY: Found ${newNearby.map(n => `NODE_${n.userId}`).join(', ')} nearby!`);
          } else {
            alert(`MICRONET_DISCOVERY: Node "${discoveredName}" is active, but no NowNet users are anchored to it.`);
          }
        });
      }
    } catch (error) {
      console.error("Discovery failed:", error);
      setIsScanning(false);
    }
  };

  const toggleMicronetFilter = () => {
    setFilterMicronet(!filterMicronet);
  };

  const createThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !newThreadTitle.trim() || !newPostContent.trim()) return;
    const res = await fetch(`/api/groups/${selectedGroup.id}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newThreadTitle, author: `NODE_${userId}`, content: newPostContent })
    });
    if (res.ok) {
      setNewThreadTitle('');
      setNewPostContent('');
      setIsPosting(false);
      fetchThreads(selectedGroup.id);
    }
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !newPostContent.trim()) return;
    const res = await fetch(`/api/threads/${selectedThread.id}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: `NODE_${userId}`, content: newPostContent })
    });
    if (res.ok) {
      setNewPostContent('');
      fetchPosts(selectedThread.id);
    }
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && socket) {
      socket.emit('message', { 
        room: 'lobby', 
        text: chatInput,
        isMicronet: isMicronetActive,
        deviceName: micronetDevice
      });
      setChatInput('');
    }
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 relative overflow-hidden">
        <div className="scanline" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md border-2 border-[#00ff41] bg-[#0a0a0a] p-6 sm:p-8 shadow-[0_0_30px_rgba(0,255,65,0.2)]"
        >
          <pre className="hidden sm:block text-[8px] leading-[1] mb-6 text-[#00ff41] opacity-80 overflow-x-hidden">
{`   _  _  ___  ___  _  _  ___  ____ 
  | |/ /| __|/ __|| || || __||_  _|
  | ' < | _| \\__ \\| || || _|   | |  
  |_|\\_\\|___||___/ \\__/ |___|  |_|  
                                    
  >> NETWORK ACCESS TERMINAL v2.0 <<`}
          </pre>
          <div className="sm:hidden text-center mb-6">
            <h1 className="text-2xl font-bold tracking-[0.3em] text-[#00ff41]">NOWNET_NOTICEBOARD</h1>
            <div className="text-[10px] opacity-60 mt-2">NETWORK ACCESS TERMINAL v2.0</div>
          </div>
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] mb-4 opacity-60">System_Initialization</label>
              <div className="w-full bg-black border-b-2 border-[#00ff41]/30 p-4 text-center text-xl tracking-widest opacity-80">
                READY_FOR_UPLINK
              </div>
            </div>
            <button
              type="submit"
              className="w-full border-2 border-[#00ff41] py-3 hover:bg-[#00ff41] hover:text-black font-bold transition-all uppercase tracking-widest active:scale-95"
            >
              Initialize Session
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-[#00ff41] font-mono relative overflow-hidden">
      <div className="scanline" />
      
      {/* Top Bar - Compact on Mobile */}
      <header className="border-b-2 border-[#00ff41] p-3 sm:p-4 flex items-center justify-between bg-black z-20">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          <span className="font-bold tracking-tighter text-base sm:text-lg truncate max-w-[180px] sm:max-w-none">NOWNET_NOTICEBOARD</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4">
            <nav className="flex gap-4 text-xs uppercase tracking-widest">
              <button onClick={() => setView('groups')} className={`px-2 py-1 border border-transparent ${view === 'groups' ? 'bg-[#00ff41] text-black' : 'hover:bg-[#00ff41]/10 border-[#00ff41]/20'}`}>[1] Noticeboards</button>
              <button onClick={() => setView('chat')} className={`px-2 py-1 border border-transparent ${view === 'chat' ? 'bg-[#00ff41] text-black' : 'hover:bg-[#00ff41]/10 border-[#00ff41]/20'}`}>[2] Chat</button>
            </nav>
            <div className="h-4 w-[1px] bg-[#00ff41]/20" />
          </div>
          <div className="text-[10px] sm:text-xs opacity-70 flex flex-col items-end">
            <span className="truncate max-w-[80px] sm:max-w-none">NODE_{userId}</span>
            <span className="hidden sm:inline opacity-40">{isMicronetActive ? `ANCHOR: ${micronetDevice}` : 'UNANCHORED'}</span>
          </div>
        </div>
      </header>

      {/* Main Content - Adjusted padding for bottom nav on mobile */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 z-10 pb-20 sm:pb-6">
        <AnimatePresence mode="wait">
          {view === 'groups' && (
            <motion.div key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto">
              <h2 className="text-lg sm:text-xl mb-6 border-b border-[#00ff41]/30 pb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" /> SELECT_NOTICEBOARD
                </div>
                <div className="text-[10px] opacity-40 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> NEXT_WIPE: {countdown}
                </div>
              </h2>
              <div className="grid gap-3 sm:gap-4">
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => { setSelectedGroup(group); fetchThreads(group.id); setView('threads'); }}
                    className="flex items-center justify-between p-3 sm:p-4 border border-[#00ff41]/30 hover:border-[#00ff41] hover:bg-[#00ff41]/5 transition-all text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base sm:text-lg group-hover:terminal-glow truncate">{group.name}</div>
                      <div className="text-xs sm:text-sm opacity-60 line-clamp-1">{group.description}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100 flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'threads' && selectedGroup && (
            <motion.div key="threads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-[#00ff41]/30 pb-2 gap-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => setView('groups')} className="hover:bg-[#00ff41]/20 p-1"><ArrowLeft className="w-5 h-5" /></button>
                  <h2 className="text-lg sm:text-xl font-bold truncate">{selectedGroup.name}</h2>
                  <div className="hidden sm:flex text-[10px] opacity-30 items-center gap-1 ml-2">
                    <AlertCircle className="w-3 h-3" /> WIPE_IN: {countdown}
                  </div>
                </div>
                <button 
                  onClick={() => setIsPosting(!isPosting)}
                  className="flex items-center justify-center gap-2 border border-[#00ff41] px-3 py-2 sm:py-1 text-xs hover:bg-[#00ff41] hover:text-black transition-all w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" /> NEW_THREAD
                </button>
              </div>

              {isPosting && (
                <form onSubmit={createThread} className="mb-8 p-4 border border-[#00ff41] bg-[#00ff41]/5 space-y-4">
                  <input
                    type="text"
                    placeholder="SUBJECT"
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                    className="w-full bg-black border border-[#00ff41]/30 p-2 focus:outline-none focus:border-[#00ff41] text-sm"
                    required
                  />
                  <textarea
                    placeholder="MESSAGE_CONTENT"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full bg-black border border-[#00ff41]/30 p-2 h-32 focus:outline-none focus:border-[#00ff41] text-sm"
                    required
                  />
                  <div className="flex justify-end gap-4">
                    <button type="button" onClick={() => setIsPosting(false)} className="text-xs opacity-60 hover:opacity-100">CANCEL</button>
                    <button type="submit" className="bg-[#00ff41] text-black px-4 py-1 font-bold text-xs">POST_ARTICLE</button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                <div className="hidden sm:grid grid-cols-12 text-[10px] uppercase opacity-40 px-4 mb-2">
                  <div className="col-span-7">Subject</div>
                  <div className="col-span-3 text-center">Author</div>
                  <div className="col-span-2 text-right">Posts</div>
                </div>
                {threads.map(thread => (
                  <button
                    key={thread.id}
                    onClick={() => { fetchPosts(thread.id); setView('post'); }}
                    className="w-full flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center p-3 border border-[#00ff41]/10 hover:border-[#00ff41]/50 hover:bg-[#00ff41]/5 transition-all text-left group gap-1 sm:gap-0"
                  >
                    <div className="sm:col-span-7 font-medium truncate w-full group-hover:terminal-glow">{thread.title}</div>
                    <div className="flex justify-between w-full sm:contents">
                      <div className="sm:col-span-3 sm:text-center text-[10px] sm:text-xs opacity-60">by {thread.author}</div>
                      <div className="sm:col-span-2 sm:text-right text-[10px] sm:text-xs font-mono">{thread.post_count} posts</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'post' && selectedThread && (
            <motion.div key="post" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-6 border-b border-[#00ff41]/30 pb-2">
                <button onClick={() => setView('threads')} className="hover:bg-[#00ff41]/20 p-1 flex-shrink-0"><ArrowLeft className="w-5 h-5" /></button>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold truncate">{selectedThread.title}</h2>
                  <div className="text-[10px] opacity-50 uppercase tracking-widest">Thread_ID: {selectedThread.id}</div>
                </div>
              </div>

              <div className="space-y-6 mb-8">
                {posts.map((post, idx) => (
                  <div key={post.id} className="border border-[#00ff41]/20 p-3 sm:p-4 relative">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 border-b border-[#00ff41]/10 pb-2 text-[10px] uppercase opacity-60 gap-1">
                      <div>From: {post.author}</div>
                      <div>Date: {new Date(post.created_at).toLocaleString()}</div>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed opacity-90 text-sm sm:text-base break-words">{post.content}</div>
                    <div className="absolute -left-1 sm:-left-2 top-4 w-1 h-8 bg-[#00ff41]/30" />
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-[#00ff41] pt-6">
                <h3 className="text-xs uppercase tracking-widest mb-4">Post_Reply</h3>
                <form onSubmit={createPost} className="space-y-4">
                  <textarea
                    placeholder="Your response..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full bg-black border border-[#00ff41]/30 p-3 sm:p-4 h-32 focus:outline-none focus:border-[#00ff41] text-sm"
                    required
                  />
                  <div className="flex justify-end">
                    <button type="submit" className="w-full sm:w-auto bg-[#00ff41] text-black px-6 py-3 sm:py-2 font-bold uppercase tracking-widest text-xs active:scale-95">Transmit_Reply</button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-[#00ff41]/30 pb-2 gap-3">
                <h2 className="text-lg sm:text-xl flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" /> REALTIME_RELAY
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={handleMicronetPairing}
                    className={`text-[10px] px-2 py-1 border flex items-center gap-2 transition-all ${isMicronetActive ? 'bg-[#00ff41] text-black border-[#00ff41]' : 'border-[#00ff41]/40 hover:border-[#00ff41]'}`}
                  >
                    <Shield className="w-3 h-3" /> {isMicronetActive ? `ANCHOR: ${micronetDevice}` : 'SET_MICRONET_ANCHOR'}
                  </button>
                  <button 
                    onClick={handleMicronetDiscovery}
                    disabled={isScanning}
                    className={`text-[10px] px-2 py-1 border border-[#00ff41]/40 hover:border-[#00ff41] flex items-center gap-2 transition-all ${isScanning ? 'opacity-50 animate-pulse' : ''}`}
                  >
                    <Globe className="w-3 h-3" /> {isScanning ? 'SCANNING...' : 'SCAN_NEARBY_USERS'}
                  </button>
                  <button 
                    onClick={toggleMicronetFilter}
                    className={`text-[10px] px-2 py-1 border transition-all ${filterMicronet ? 'bg-[#00ff41]/20 border-[#00ff41]' : 'border-[#00ff41]/20 opacity-50'}`}
                  >
                    FILTER: {filterMicronet ? 'MICRONET_ONLY' : 'ALL_TRAFFIC'}
                  </button>
                </div>
              </div>

              {nearbyUsers.length > 0 && (
                <div className="mb-4 p-2 border border-[#00ff41]/20 bg-[#00ff41]/5 text-[10px] flex items-center gap-3 overflow-x-auto">
                  <span className="opacity-50 flex-shrink-0">NEARBY_NODES:</span>
                  {nearbyUsers.map(node => (
                    <span key={node.userId} className="flex items-center gap-1 bg-[#00ff41] text-black px-2 py-0.5 font-bold rounded-sm whitespace-nowrap">
                      <User className="w-3 h-3" /> NODE_{node.userId} [{node.deviceName}]
                    </span>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto border border-[#00ff41]/20 p-3 sm:p-4 mb-4 space-y-2 bg-black/30 text-sm">
                {chatMessages
                  .filter(msg => !filterMicronet || msg.isMicronet || msg.type === 'system')
                  .map((msg, i) => (
                  <div key={i} className={`break-words flex items-start gap-2 ${msg.type === 'system' ? 'opacity-40 italic text-xs' : ''}`}>
                    {msg.type === 'user' && (
                      <span className="flex items-center gap-1">
                        <span className="font-bold">&lt;NODE_{msg.userId}&gt;</span>
                        <span className="text-[10px] opacity-50">[{msg.deviceName}]</span>
                        {msg.isMicronet && <Shield className="w-3 h-3 text-[#00ff41] inline" title="Micronet Verified" />}
                      </span>
                    )}
                    <span>{msg.text}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={sendChatMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-black border border-[#00ff41]/30 p-2 focus:outline-none focus:border-[#00ff41] text-sm"
                  placeholder={isMicronetActive ? "Transmitting via Micronet..." : "Type message..."}
                />
                <button type="submit" className="bg-[#00ff41] text-black px-4 py-2 font-bold active:scale-95"><Send className="w-5 h-5" /></button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 border-t-2 border-[#00ff41] bg-black z-30 flex justify-around items-center p-2">
        <button 
          onClick={() => setView('groups')} 
          className={`flex flex-col items-center gap-1 p-2 flex-1 transition-colors ${view === 'groups' || view === 'threads' || view === 'post' ? 'text-black bg-[#00ff41]' : 'text-[#00ff41]'}`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Noticeboards</span>
        </button>
        <button 
          onClick={() => setView('chat')} 
          className={`flex flex-col items-center gap-1 p-2 flex-1 transition-colors ${view === 'chat' ? 'text-black bg-[#00ff41]' : 'text-[#00ff41]'}`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Chat</span>
        </button>
      </nav>

      {/* Footer - Hidden on mobile to save space, or very minimal */}
      <footer className="hidden sm:flex p-2 bg-[#00ff41] text-black text-[10px] justify-between uppercase font-bold tracking-[0.2em] z-20">
        <span>System: Online</span>
        <span>Encrypted: AES-256</span>
        <span>{new Date().toLocaleTimeString()}</span>
      </footer>
    </div>
  );
}
