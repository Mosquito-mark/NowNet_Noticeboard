import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ShieldAlert, Terminal } from 'lucide-react';

export function SecurityBreach() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black text-[#00ff41] font-mono p-8 flex flex-col items-center justify-center overflow-hidden select-none">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full border-2 border-red-600 p-8 bg-red-950/20 relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse" />
        
        <div className="flex items-center gap-4 mb-8 text-red-500">
          <ShieldAlert className="w-12 h-12" />
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tighter">CRITICAL_SECURITY_BREACH</h1>
            <p className="text-xs opacity-70">PROTOCOL_ID: NOWNET_SENTRY_0x44</p>
          </div>
        </div>

        <div className="space-y-4 text-sm leading-relaxed">
          <div className="flex gap-3">
            <span className="text-red-500 font-bold">[!]</span>
            <p>Unauthorized screen capture or recording attempt detected.</p>
          </div>
          <div className="flex gap-3">
            <span className="text-red-500 font-bold">[!]</span>
            <p>Native OS interception protocol engaged.</p>
          </div>
          <div className="flex gap-3">
            <span className="text-red-500 font-bold">[!]</span>
            <p>Memory core purged. Node identity invalidated.</p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-red-900/50">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">System_Logs:</span>
            </div>
            <pre className="text-[10px] opacity-50 bg-black/40 p-3 overflow-hidden">
              {`> Initializing self-destruct...
> Wiping local_storage...
> Terminating socket_connection...
> Disconnecting Micronet_Anchor...
> KERNEL_PANIC: 0x0000007B
> SYSTEM_HALTED.`}
            </pre>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="w-full bg-red-900/20 h-1 overflow-hidden">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="h-full bg-red-600"
            />
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] animate-pulse text-red-500">
            Node_Locked_Permanently
          </p>
        </div>
      </motion.div>

      {/* Glitch overlays */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-red-900/5 to-transparent animate-scanline" />
    </div>
  );
}
