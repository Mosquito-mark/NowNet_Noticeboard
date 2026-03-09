import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { BookOpen, MessageSquare, HelpCircle } from 'lucide-react';

import { View, Group } from './types';
import { useMicronet } from './hooks/useMicronet';
import { useChat } from './hooks/useChat';
import { useNoticeboard } from './hooks/useNoticeboard';

import { IdentityScreen } from './components/IdentityScreen';
import { Header } from './components/Header';
import { NoticeboardView } from './components/NoticeboardView';
import { ChatView } from './components/ChatView';
import { HelpView } from './components/HelpView';

export default function App() {
  const [view, setView] = useState<View>('groups');
  const [userId, setUserId] = useState<string>(() => localStorage.getItem('nownet_userId') || '');
  const [isJoined, setIsJoined] = useState(false);
  const [countdown, setCountdown] = useState<string>('');
  const [isMicronetActive, setIsMicronetActive] = useState(() => localStorage.getItem('nownet_micronetActive') === 'true');
  const [micronetDevice, setMicronetDevice] = useState<string | null>(() => localStorage.getItem('nownet_micronetDevice'));

  const {
    groups, threads, posts, selectedGroup, selectedThread,
    setSelectedGroup, fetchGroups, fetchThreads, fetchPosts, createThread, createPost
  } = useNoticeboard();

  const {
    socket, chatMessages, chatInput, setChatInput, whisperTo, setWhisperTo,
    joinRoom, sendMessage
  } = useChat(userId, isMicronetActive, micronetDevice);

  const micronet = useMicronet(socket, userId, {
    isMicronetActive, setIsMicronetActive,
    micronetDevice, setMicronetDevice
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextWipe = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0, 0));
      if (now >= nextWipe) nextWipe.setUTCDate(nextWipe.getUTCDate() + 1);
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
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('identity_assigned', (data: { userId: string }) => {
        setUserId(data.userId);
        localStorage.setItem('nownet_userId', data.userId);
      });
    }
  }, [socket]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoined(true);
    joinRoom('lobby');
  };

  const onSelectGroup = (group: Group) => {
    setSelectedGroup(group);
    fetchThreads(group.id);
    setView('threads');
  };

  const onSelectThread = (threadId: number) => {
    fetchPosts(threadId);
    setView('post');
  };

  if (!isJoined) {
    return <IdentityScreen onJoin={handleJoin} />;
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-[#0a0a0a] text-[#00ff41] font-mono relative overflow-hidden">
      <div className="scanline" />
      
      <Header 
        view={view} 
        setView={setView} 
        userId={userId} 
        isMicronetActive={micronet.isMicronetActive} 
        micronetDevice={micronet.micronetDevice} 
      />

      <main className="flex-1 min-h-0 z-10 pb-20 sm:pb-0">
        <AnimatePresence mode="wait">
          {(view === 'groups' || view === 'threads' || view === 'post') && (
            <NoticeboardView 
              view={view}
              setView={setView}
              groups={groups}
              threads={threads}
              posts={posts}
              selectedGroup={selectedGroup}
              selectedThread={selectedThread}
              onSelectGroup={onSelectGroup}
              onSelectThread={onSelectThread}
              onCreateThread={(title, content) => createThread(selectedGroup!.id, userId, title, content)}
              onCreatePost={(content) => createPost(selectedThread!.id, userId, content)}
              countdown={countdown}
              nearbyUsers={micronet.nearbyUsers}
              allNodes={micronet.allNodes}
            />
          )}

          {view === 'chat' && (
            <ChatView 
              userId={userId}
              chatMessages={chatMessages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              whisperTo={whisperTo}
              setWhisperTo={setWhisperTo}
              onSendMessage={sendMessage}
              isMicronetActive={micronet.isMicronetActive}
              micronetDevice={micronet.micronetDevice}
              onPair={micronet.handlePairing}
              onClearAnchor={micronet.clearAnchor}
              onDiscovery={micronet.handleDiscovery}
              isScanning={micronet.isScanning}
              nearbyUsers={micronet.nearbyUsers}
              allNodes={micronet.allNodes}
              setView={setView}
            />
          )}

          {view === 'help' && (
            <HelpView />
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 border-t-2 border-[#00ff41] bg-black z-30 flex justify-around items-stretch h-16 shadow-[0_-4px_20px_rgba(0,255,65,0.15)]">
        <button 
          onClick={() => setView('groups')} 
          className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all active:scale-95 ${view === 'groups' || view === 'threads' || view === 'post' ? 'text-black bg-[#00ff41]' : 'text-[#00ff41]'}`}
        >
          <BookOpen className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase tracking-widest">BOARDS</span>
        </button>
        <div className="w-[2px] bg-[#00ff41]/20" />
        <button 
          onClick={() => setView('chat')} 
          className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all active:scale-95 ${view === 'chat' ? 'text-black bg-[#00ff41]' : 'text-[#00ff41]'}`}
        >
          <MessageSquare className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase tracking-widest">RELAY</span>
        </button>
        <div className="w-[2px] bg-[#00ff41]/20" />
        <button 
          onClick={() => setView('help')} 
          className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all active:scale-95 ${view === 'help' ? 'text-black bg-[#00ff41]' : 'text-[#00ff41]'}`}
        >
          <HelpCircle className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase tracking-widest">HELP</span>
        </button>
      </nav>

      <footer className="hidden sm:flex p-2 bg-[#00ff41] text-black text-[10px] justify-between uppercase font-bold tracking-[0.2em] z-20">
        <span>System: Online</span>
        <span>Encrypted: AES-256</span>
        <span>{new Date().toLocaleTimeString()}</span>
      </footer>
    </div>
  );
}
