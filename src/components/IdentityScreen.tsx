import React from 'react';
import { motion } from 'motion/react';
import { Globe } from 'lucide-react';

interface IdentityScreenProps {
  onJoin: (e: React.FormEvent) => void;
}

export function IdentityScreen({ onJoin }: IdentityScreenProps) {
  return (
    <div className="h-full flex items-center justify-center bg-[#0a0a0a] p-4 relative overflow-y-auto">
      <div className="scanline" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md border-2 border-[#00ff41] bg-[#0a0a0a] p-6 sm:p-8 shadow-[0_0_30px_rgba(0,255,65,0.2)]"
      >
        <pre className="hidden sm:block text-[7px] leading-[1.1] mb-8 text-[#00ff41] font-bold tracking-tighter overflow-x-hidden terminal-glow animate-pulse">
{`  _   _  _____  _    _  _   _  _____  _____ 
 | \\ | ||  _  || |  | || \\ | ||  ___||_   _|
 |  \\| || | | || |  | ||  \\| || |__    | |  
 | . \` || | | || |/\\| || . \` ||  __|   | |  
 | |\\  |\\ \\_/ /\\  /\\  /| |\\  || |___   | |  
 \\_| \\_/ \\___/  \\/  \\/ \\_| \\_/\\____/   \\_/  
                                     
      >> NETWORK ACCESS TERMINAL v2.0 <<`}
        </pre>
        <div className="sm:hidden text-center mb-8">
          <pre className="text-[10px] leading-[1.1] mb-4 text-[#00ff41] font-bold inline-block text-left terminal-glow animate-pulse">
{`  _   _ 
 | \\ | |
 |  \\| |
 | . \` |
 |_| \\_|
  _____ 
 |  _  |
 | | | |
 | \\___/ 
  _    _ 
 | |  | |
 | |/\\| |
 |  /\\  |
  \\/  \\/ 
  _   _ 
 | \\ | |
 |  \\| |
 | . \` |
 |_| \\_|
  _____ 
 |  ___|
 | |__  
 |  __| 
 | |___ 
 \\____/ 
  _____ 
 |_   _|
   | |  
   |_|  `}
          </pre>
          <div className="text-[10px] opacity-60 mt-2 uppercase tracking-[0.2em]">NETWORK ACCESS TERMINAL v2.0</div>
        </div>
        <form onSubmit={onJoin} className="space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-block p-4 border border-[#00ff41]/20 bg-[#00ff41]/5 rounded-full animate-pulse">
              <Globe className="w-12 h-12 text-[#00ff41]" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.4em] mb-2 opacity-60">System_Initialization</label>
              <div className="w-full bg-black border-2 border-[#00ff41]/30 p-4 text-center text-xl tracking-[0.2em] font-black text-[#00ff41] shadow-[inset_0_0_10px_rgba(0,255,65,0.1)]">
                READY_FOR_UPLINK
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <button
              type="submit"
              className="w-full bg-[#00ff41] text-black py-4 font-black transition-all uppercase tracking-[0.3em] active:scale-95 shadow-[0_0_20px_rgba(0,255,65,0.3)] hover:shadow-[0_0_30px_rgba(0,255,65,0.5)]"
            >
              Initialize Session
            </button>
            <div className="text-[8px] text-center opacity-30 uppercase tracking-widest">
              By connecting, you agree to the decentralized protocol standards.
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
