import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, AlertCircle, ChevronRight, ArrowLeft, Plus, Globe } from 'lucide-react';
import { Group, Thread, Post, View, MicronetNode } from '../types';

interface NoticeboardViewProps {
  view: View;
  setView: (v: View) => void;
  groups: Group[];
  threads: Thread[];
  posts: Post[];
  selectedGroup: Group | null;
  selectedThread: Thread | null;
  onSelectGroup: (g: Group) => void;
  onSelectThread: (tId: number) => void;
  onCreateThread: (title: string, content: string) => Promise<boolean>;
  onCreatePost: (content: string) => Promise<boolean>;
  countdown: string;
  nearbyUsers: MicronetNode[];
  allNodes: MicronetNode[];
}

export function NoticeboardView({
  view, setView, groups, threads, posts, selectedGroup, selectedThread,
  onSelectGroup, onSelectThread, onCreateThread, onCreatePost,
  countdown, nearbyUsers, allNodes
}: NoticeboardViewProps) {
  const [isPosting, setIsPosting] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onCreateThread(newThreadTitle, newPostContent);
    if (success) {
      setNewThreadTitle('');
      setNewPostContent('');
      setIsPosting(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onCreatePost(newPostContent);
    if (success) {
      setNewPostContent('');
    }
  };

  if (view === 'groups') {
    return (
      <motion.div 
        key="groups" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="h-full overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-[#00ff41]/20"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 border-b border-[#00ff41]/30 pb-2">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> NOTICEBOARDS
            </h2>
            <div className="text-[10px] opacity-60 flex items-center gap-1 bg-[#00ff41]/10 px-2 py-1 rounded">
              <AlertCircle className="w-3 h-3" /> WIPE: {countdown}
            </div>
          </div>
          <div className="grid gap-3">
            {groups.map(group => (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group)}
                className="flex items-center justify-between p-4 border border-[#00ff41]/30 hover:border-[#00ff41] hover:bg-[#00ff41]/5 transition-all text-left group active:bg-[#00ff41]/10"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base group-hover:terminal-glow truncate uppercase tracking-wider">{group.name}</div>
                  <div className="text-xs opacity-50 line-clamp-1 mt-1">{group.description}</div>
                </div>
                <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100 flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (view === 'threads' && selectedGroup) {
    return (
      <motion.div 
        key="threads" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="h-full overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-[#00ff41]/20"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col mb-6 border-b border-[#00ff41]/30 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('groups')} className="hover:bg-[#00ff41]/20 p-2 -ml-2 rounded-full transition-colors active:scale-90">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold truncate uppercase tracking-tight">{selectedGroup.name}</h2>
                <div className="text-[10px] opacity-40 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> NEXT_WIPE: {countdown}
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsPosting(!isPosting)}
              className={`flex items-center justify-center gap-2 border px-4 py-3 text-xs font-bold transition-all w-full tracking-widest active:scale-95 ${isPosting ? 'bg-[#00ff41] text-black border-[#00ff41]' : 'border-[#00ff41] hover:bg-[#00ff41]/10'}`}
            >
              {isPosting ? 'CANCEL_POST' : <><Plus className="w-4 h-4" /> NEW_THREAD</>}
            </button>
          </div>

          {isPosting && (
            <form onSubmit={handleCreateThread} className="mb-8 p-4 border-2 border-[#00ff41] bg-[#00ff41]/5 space-y-4 shadow-[0_0_15px_rgba(0,255,65,0.1)]">
              <div className="space-y-1">
                <label className="text-[10px] uppercase opacity-50 tracking-widest ml-1">Subject_Line</label>
                <input
                  type="text"
                  placeholder="ENTER_SUBJECT"
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  className="w-full bg-black border border-[#00ff41]/30 p-3 focus:outline-none focus:border-[#00ff41] text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase opacity-50 tracking-widest ml-1">Message_Body</label>
                <textarea
                  placeholder="TYPE_YOUR_MESSAGE"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full bg-black border border-[#00ff41]/30 p-3 h-40 focus:outline-none focus:border-[#00ff41] text-sm"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-[#00ff41] text-black py-3 font-bold text-xs tracking-[0.2em] uppercase active:scale-95">Transmit_Article</button>
            </form>
          )}

          <div className="space-y-3">
            {threads.map(thread => {
              const authorId = thread.author.replace('NODE_', '');
              const isNearby = nearbyUsers.some(u => u.userId === authorId);
              return (
                <button
                  key={thread.id}
                  onClick={() => onSelectThread(thread.id)}
                  className={`w-full flex flex-col p-4 border ${isNearby ? 'border-[#00ff41] bg-[#00ff41]/10' : 'border-[#00ff41]/20'} hover:border-[#00ff41]/50 hover:bg-[#00ff41]/5 transition-all text-left group active:bg-[#00ff41]/10`}
                >
                  <div className="font-bold text-sm sm:text-base mb-2 group-hover:terminal-glow flex items-center gap-2">
                    {isNearby && <Globe className="w-3 h-3 text-[#00ff41]" />}
                    {thread.title}
                  </div>
                  <div className="flex items-center justify-between w-full text-[10px] uppercase tracking-wider">
                    <div className={`flex items-center gap-1 ${isNearby ? 'text-[#00ff41] font-bold' : 'opacity-50'}`}>
                      BY NODE_{authorId.slice(0,6)} {isNearby && '(NEARBY)'}
                    </div>
                    <div className="opacity-40 font-mono">{thread.post_count} POSTS</div>
                  </div>
                </button>
              );
            })}
            {threads.length === 0 && !isPosting && (
              <div className="text-center py-12 border border-dashed border-[#00ff41]/20 opacity-40 text-xs uppercase tracking-widest">
                No active threads in this board.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (view === 'post' && selectedThread) {
    return (
      <motion.div 
        key="post" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="h-full overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-[#00ff41]/20"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6 border-b border-[#00ff41]/30 pb-4">
            <button onClick={() => setView('threads')} className="hover:bg-[#00ff41]/20 p-2 -ml-2 rounded-full transition-colors active:scale-90 flex-shrink-0">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate uppercase tracking-tight">{selectedThread.title}</h2>
              <div className="text-[10px] opacity-40 uppercase tracking-widest">THREAD_ID: {selectedThread.id}</div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {posts.map((post) => {
              const authorId = post.author.replace('NODE_', '');
              const isNearby = nearbyUsers.some(u => u.userId === authorId);
              return (
                <div key={post.id} className={`border ${isNearby ? 'border-[#00ff41] bg-[#00ff41]/5' : 'border-[#00ff41]/20'} p-4 relative`}>
                  <div className="flex flex-col mb-3 border-b border-[#00ff41]/10 pb-2 text-[10px] uppercase tracking-wider gap-1">
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 ${isNearby ? 'text-[#00ff41] font-bold' : 'opacity-60'}`}>
                        FROM: NODE_{authorId.slice(0,6)} 
                        {isNearby && <Globe className="w-3 h-3" />}
                      </div>
                      <div className="opacity-40">{new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed opacity-90 text-sm break-words">{post.content}</div>
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isNearby ? 'bg-[#00ff41]' : 'bg-[#00ff41]/20'}`} />
                </div>
              );
            })}
          </div>

          <div className="border-t-2 border-[#00ff41] pt-6 mb-12">
            <h3 className="text-[10px] uppercase tracking-[0.3em] mb-4 opacity-60 font-bold">Transmit_Reply</h3>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <textarea
                placeholder="YOUR_RESPONSE..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full bg-black border border-[#00ff41]/30 p-4 h-32 focus:outline-none focus:border-[#00ff41] text-sm"
                required
              />
              <button type="submit" className="w-full bg-[#00ff41] text-black py-4 font-bold uppercase tracking-[0.2em] text-xs active:scale-95 shadow-[0_0_20px_rgba(0,255,65,0.2)]">Send_Reply</button>
            </form>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}
