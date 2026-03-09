import React from 'react';
import { Globe, User, HelpCircle } from 'lucide-react';
import { View } from '../types';

interface HeaderProps {
  view: View;
  setView: (v: View) => void;
  userId: string;
  isMicronetActive: boolean;
  micronetDevice: string | null;
}

export function Header({ view, setView, userId, isMicronetActive, micronetDevice }: HeaderProps) {
  return (
    <header className="flex-shrink-0 border-b-2 border-[#00ff41] p-3 sm:p-4 flex items-center justify-between bg-black z-20 shadow-[0_2px_10px_rgba(0,255,65,0.1)]">
      <div className="flex items-center gap-2">
        <Globe className="w-5 h-5 animate-pulse" />
        <span className="font-black tracking-tighter text-base sm:text-lg truncate max-w-[140px] sm:max-w-none uppercase">NOWNET</span>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden sm:flex items-center gap-4">
          <nav className="flex gap-4 text-[10px] uppercase tracking-[0.2em] font-bold">
            <button onClick={() => setView('groups')} className={`px-3 py-1 border ${view === 'groups' || view === 'threads' || view === 'post' ? 'bg-[#00ff41] text-black border-[#00ff41]' : 'hover:bg-[#00ff41]/10 border-[#00ff41]/20'}`}>[1] BOARDS</button>
            <button onClick={() => setView('chat')} className={`px-3 py-1 border ${view === 'chat' ? 'bg-[#00ff41] text-black border-[#00ff41]' : 'hover:bg-[#00ff41]/10 border-[#00ff41]/20'}`}>[2] RELAY</button>
            <button onClick={() => setView('help')} className={`px-3 py-1 border ${view === 'help' ? 'bg-[#00ff41] text-black border-[#00ff41]' : 'hover:bg-[#00ff41]/10 border-[#00ff41]/20'}`}>[3] HELP</button>
          </nav>
          <div className="h-4 w-[1px] bg-[#00ff41]/20" />
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-bold truncate max-w-[80px] sm:max-w-none uppercase tracking-wider">NODE_{userId.slice(0,6)}</span>
            <User className="w-3 h-3 opacity-50" />
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isMicronetActive ? 'bg-[#00ff41] shadow-[0_0_5px_#00ff41]' : 'bg-red-500'}`} />
            <span className="text-[8px] uppercase opacity-40 tracking-tighter">
              {isMicronetActive ? micronetDevice : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
