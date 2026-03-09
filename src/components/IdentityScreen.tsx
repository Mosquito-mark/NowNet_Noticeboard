import React from 'react';
import { motion } from 'motion/react';
import { Globe } from 'lucide-react';

interface IdentityScreenProps {
  onJoin: (e: React.FormEvent) => void;
}

export function IdentityScreen({ onJoin }: IdentityScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 relative overflow-hidden">
      <div className="scanline" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md border-2 border-[#00ff41] bg-[#0a0a0a] p-6 sm:p-8 shadow-[0_0_30px_rgba(0,255,65,0.2)]"
      >
        <pre className="hidden sm:block text-[8px] leading-[1] mb-6 text-[#00ff41] opacity-80 overflow-x-hidden">
{`  _  _  ___  _  _  _  _  ___  ____ 
 | \| ||   || |/ \| \| || __||_  _|
 |  \ || | | || \ / ||  \|| _|   | |  
 |_|\_||___/  \_/ \_/|_|\_||___|  |_|  
                                    
  >> NETWORK ACCESS TERMINAL v2.0 <<`}
        </pre>
        <div className="sm:hidden text-center mb-6">
          <pre className="text-[10px] leading-[1.2] mb-4 text-[#00ff41] opacity-80 inline-block text-left">
{`  _  _ 
 | \| |
 |  \ |
 |_|\_|
  ___ 
 / _ \\
| (_) |
 \___/ 
  _ _ _ 
 | | | |
 | | | |
  \_/\_/ 
  _  _ 
 | \| |
 |  \ |
 |_|\_|
  ___ 
 | __|
 | _| 
 |___|
  ____ 
 |_  _|
   | | 
   |_| `}
          </pre>
          <div className="text-[10px] opacity-60 mt-2">NETWORK ACCESS TERMINAL v2.0</div>
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
