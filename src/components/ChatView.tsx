import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Shield, Globe, Send, Radar, Clock, Hash } from 'lucide-react';
import { View, MicronetNode } from '../types';
import { formatUptime } from '../utils/time';
import { generateSigil } from '../utils/sigil';

interface ChatViewProps {
  userId: string;
  chatMessages: any[];
  chatInput: string;
  setChatInput: (s: string) => void;
  whisperTo: {userId: string} | null;
  setWhisperTo: (w: {userId: string} | null) => void;
  onSendMessage: (e: React.FormEvent) => void;
  isMicronetActive: boolean;
  micronetDevice: string | null;
  onPair: () => void;
  onClearAnchor: () => void;
  onDiscovery: () => void;
  isScanning: boolean;
  nearbyUsers: MicronetNode[];
  allNodes: MicronetNode[];
  setView: (v: View) => void;
}

export function ChatView({
  userId, chatMessages, chatInput, setChatInput, whisperTo, setWhisperTo,
  onSendMessage, isMicronetActive, micronetDevice, onPair, onClearAnchor,
  onDiscovery, isScanning, nearbyUsers, allNodes, setView
}: ChatViewProps) {
  const [filterMicronet, setFilterMicronet] = useState(false);
  const [showPresence, setShowPresence] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000); // Update every 30s
    return () => clearInterval(timer);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !chatInput.trim()) return;
    setIsSubmitting(true);
    onSendMessage(e);
    setTimeout(() => setIsSubmitting(false), 1000);
  };

  return (
    <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full flex flex-col lg:flex-row gap-4 lg:gap-6 max-w-6xl mx-auto relative p-4 sm:p-6 overflow-hidden">
      {/* Left Column: Chat */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex flex-col mb-4 border-b border-[#00ff41]/30 pb-3 gap-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2 uppercase tracking-tight">
              <MessageSquare className="w-5 h-5" /> RELAY_STATION
            </h2>
            <button 
              onClick={() => setShowPresence(!showPresence)}
              className="lg:hidden text-[10px] px-3 py-1 border border-[#00ff41] font-bold uppercase tracking-widest active:bg-[#00ff41] active:text-black transition-colors"
            >
              {showPresence ? 'CLOSE_RADAR' : `RADAR (${allNodes.filter(n => n.userId !== userId).length})`}
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={isMicronetActive ? onClearAnchor : onPair}
              className={`text-[9px] sm:text-[10px] px-2 py-1.5 border flex items-center gap-2 transition-all uppercase tracking-wider ${isMicronetActive ? 'bg-[#00ff41] text-black border-[#00ff41]' : 'border-[#00ff41]/40 hover:border-[#00ff41]'}`}
            >
              <Shield className="w-3 h-3" /> {isMicronetActive ? `ANCHOR: ${micronetDevice}` : 'SET_ANCHOR'}
            </button>
            <button 
              onClick={onDiscovery}
              disabled={isScanning}
              className={`text-[9px] sm:text-[10px] px-2 py-1.5 border border-[#00ff41]/40 hover:border-[#00ff41] flex items-center gap-2 transition-all uppercase tracking-wider ${isScanning ? 'opacity-50 animate-pulse' : ''}`}
            >
              <Globe className="w-3 h-3" /> {isScanning ? 'SCANNING...' : 'SCAN_NEARBY'}
            </button>
            <button 
              onClick={() => setFilterMicronet(!filterMicronet)}
              className={`text-[9px] sm:text-[10px] px-2 py-1.5 border transition-all uppercase tracking-wider ${filterMicronet ? 'bg-[#00ff41]/20 border-[#00ff41]' : 'border-[#00ff41]/20 opacity-50'}`}
            >
              {filterMicronet ? 'MICRONET_ONLY' : 'ALL_TRAFFIC'}
            </button>
            <div className="flex-1" />
            <button 
              onClick={() => setView('help')}
              className="text-[9px] opacity-40 hover:opacity-100 underline uppercase tracking-widest"
            >
              How it works?
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border border-[#00ff41]/20 p-3 mb-4 space-y-3 bg-black/30 scrollbar-thin scrollbar-thumb-[#00ff41]/20">
          {chatMessages
            .filter(msg => !filterMicronet || msg.isMicronet || msg.type === 'system' || msg.type === 'whisper')
            .map((msg, i) => {
              const isNearby = nearbyUsers.some(u => u.userId === msg.userId || u.userId === msg.fromUserId);
              const isWhisper = msg.type === 'whisper';
              const isFromMe = msg.fromUserId === userId;
              
              return (
                <div key={i} className={`break-words flex flex-col gap-1 p-3 border-l-2 ${isWhisper ? 'border-purple-500 bg-purple-500/10' : isNearby ? 'border-[#00ff41] bg-[#00ff41]/5' : 'border-[#00ff41]/10'} ${msg.type === 'system' ? 'opacity-40 italic text-[10px]' : ''}`}>
                  <div className="flex items-center gap-2 flex-wrap text-[10px] uppercase tracking-wider mb-1">
                    {msg.type === 'user' && (
                      <>
                        <span className="text-[#00ff41] font-mono opacity-60">{generateSigil(msg.userId)}</span>
                        <span className={`font-bold ${isNearby ? 'text-[#00ff41]' : 'opacity-80'}`}>NODE_{msg.userId.slice(0,6)}</span>
                        <span className="opacity-30 text-[8px]">[{msg.deviceName}]</span>
                        {msg.connectedAt && (
                          <span className="opacity-40 text-[8px] flex items-center gap-1 bg-black/40 px-1 rounded">
                            <Clock className="w-2 h-2" /> {formatUptime(msg.connectedAt)}
                          </span>
                        )}
                        {isNearby && <Globe className="w-3 h-3 text-[#00ff41]" />}
                        {msg.isMicronet && <Shield className="w-3 h-3 text-[#00ff41]" />}
                      </>
                    )}
                    {isWhisper && (
                      <>
                        <span className="text-purple-400 font-bold">[WHISPER]</span>
                        <span className="font-bold opacity-80">
                          {isFromMe ? `TO: NODE_${msg.toUserId.slice(0,6)}` : `FROM: NODE_${msg.fromUserId.slice(0,6)}`}
                        </span>
                      </>
                    )}
                  </div>
                  <span className={`text-sm leading-relaxed transition-all duration-300 blur-sm hover:blur-none select-none ${isWhisper ? 'text-purple-200' : 'opacity-90'}`}>
                    {msg.text}
                  </span>
                </div>
              );
            })}
          {chatMessages.length === 0 && (
            <div className="h-full flex items-center justify-center opacity-20 text-[10px] uppercase tracking-[0.5em]">
              Waiting for uplink...
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="flex flex-col gap-2 flex-shrink-0">
          {whisperTo && (
            <div className="flex items-center justify-between bg-purple-500/20 border border-purple-500/40 p-3 text-[10px] uppercase tracking-widest">
              <span>Whispering to: NODE_{whisperTo.userId.slice(0,6)}</span>
              <button onClick={() => setWhisperTo(null)} className="hover:text-white font-bold underline">CANCEL</button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-black border border-[#00ff41]/30 p-4 focus:outline-none focus:border-[#00ff41] text-sm"
              placeholder={whisperTo ? "PRIVATE_MESSAGE..." : "BROADCAST_MESSAGE..."}
              maxLength={200}
            />
            <button 
              type="submit" 
              disabled={isSubmitting || !chatInput.trim()}
              className={`px-6 py-4 font-bold active:scale-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${whisperTo ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-[#00ff41] text-black shadow-[0_0_15px_rgba(0,255,65,0.3)]'}`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: User List / Radar */}
      <div className={`
        fixed inset-0 z-40 bg-black/95 p-6 flex flex-col gap-6 transition-transform duration-300 overflow-y-auto lg:static lg:bg-transparent lg:p-0 lg:w-64 lg:translate-x-0 lg:overflow-visible
        ${showPresence ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex items-center justify-between lg:hidden mb-4 border-b border-[#00ff41]/30 pb-4">
          <h3 className="text-lg font-bold uppercase tracking-widest">NETWORK_RADAR</h3>
          <button onClick={() => setShowPresence(false)} className="p-2 border border-[#00ff41] text-[#00ff41]">CLOSE</button>
        </div>

        <div className="border border-[#00ff41]/30 p-4 bg-black/20 flex-1 lg:flex-none">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 border-b border-[#00ff41]/20 pb-2 flex items-center justify-between">
            Network_Presence <span className="bg-[#00ff41] text-black px-1 rounded-sm">{allNodes.filter(n => n.userId !== userId).length}</span>
          </h3>
          <div className="space-y-2 overflow-y-auto lg:max-h-[calc(100vh-12rem)]">
            {allNodes.filter(n => n.userId !== userId).length === 0 ? (
              <div className="text-[10px] opacity-40 italic leading-relaxed">No other nodes detected on the global relay.</div>
            ) : (
              [...allNodes]
                .filter(n => n.userId !== userId)
                .sort((a, b) => (b.signalStrength || -100) - (a.signalStrength || -100))
                .map(node => {
                const isNearby = nearbyUsers.some(nu => nu.userId === node.userId);
                return (
                  <button 
                    key={node.userId} 
                    onClick={() => {
                      setWhisperTo({ userId: node.userId });
                      setShowPresence(false);
                    }}
                    className={`w-full flex items-center justify-between group p-2 border transition-all ${
                      isNearby 
                        ? 'bg-[#00ff41]/10 border-[#00ff41]/30 hover:bg-[#00ff41]/20 hover:border-[#00ff41]/50' 
                        : 'border-transparent opacity-60 hover:opacity-100 hover:bg-[#00ff41]/5 hover:border-[#00ff41]/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isNearby ? (
                        <Radar className="w-4 h-4 text-[#00ff41] animate-pulse" />
                      ) : (
                        <div className="w-1.5 h-1.5 border border-[#00ff41] rounded-full ml-1" />
                      )}
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-[#00ff41] font-mono opacity-40 text-[8px]">{generateSigil(node.userId)}</span>
                          <span className={`text-xs uppercase tracking-tight ${isNearby ? 'font-bold text-[#00ff41]' : ''}`}>
                            NODE_{node.userId.slice(0,6)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] opacity-40">{node.deviceName}</span>
                          {node.connectedAt && (
                            <span className="text-[8px] opacity-40 flex items-center gap-1 bg-black/20 px-1 rounded">
                              <Clock className="w-2 h-2" /> {formatUptime(node.connectedAt)}
                            </span>
                          )}
                          {node.signalStrength && (
                            <span className="text-[8px] text-[#00ff41] opacity-60">[{node.signalStrength} dBm]</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <MessageSquare className={`w-4 h-4 opacity-30 group-hover:opacity-100 ${isNearby ? 'text-[#00ff41]' : ''}`} />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
