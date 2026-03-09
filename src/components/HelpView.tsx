import React from 'react';
import { motion } from 'motion/react';
import { HelpCircle, Shield, Globe, Radio, AlertCircle } from 'lucide-react';

export function HelpView() {
  return (
    <motion.div 
      key="help" 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      className="h-full overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-[#00ff41]/20"
    >
      <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div className="border-b border-[#00ff41]/30 pb-4">
        <h2 className="text-2xl font-bold flex items-center gap-3 uppercase tracking-tighter">
          <HelpCircle className="w-6 h-6 text-[#00ff41]" /> SYSTEM_MANUAL
        </h2>
        <p className="text-[10px] opacity-50 uppercase tracking-[0.2em] mt-1">Version 1.0.4 // Proximity Protocol</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 uppercase tracking-tight text-[#00ff41]">
          <Shield className="w-5 h-5" /> How to Find Friends Nearby
        </h3>
        <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-6 space-y-4 leading-relaxed">
          <p className="text-sm">
            Imagine you are in a big, crowded park. You want to find your friend, but you don't have a map. Instead, you both agree to meet at the <span className="text-[#00ff41] font-bold">Big Oak Tree</span>. If you are both standing at that tree, you know you are close to each other!
          </p>
          <p className="text-sm">
            In this app, we use Bluetooth devices like "trees." Here is how it works:
          </p>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-[#00ff41] font-bold">1.</span>
              <p className="text-sm"><span className="font-bold uppercase text-[11px]">Pick a Gadget:</span> Find a Bluetooth device in the room, like a speaker, a TV, or a pair of headphones.</p>
            </li>
            <li className="flex gap-3">
              <span className="text-[#00ff41] font-bold">2.</span>
              <p className="text-sm"><span className="font-bold uppercase text-[11px]">Drop an Anchor:</span> Click <span className="text-[#00ff41] font-bold">"SET_ANCHOR"</span> in the app and pick that device. This tells the app, "I am standing next to this gadget."</p>
            </li>
            <li className="flex gap-3">
              <span className="text-[#00ff41] font-bold">3.</span>
              <p className="text-sm"><span className="font-bold uppercase text-[11px]">The Match:</span> If your friend picks the same gadget, the app sees that you both chose the same one.</p>
            </li>
            <li className="flex gap-3">
              <span className="text-[#00ff41] font-bold">4.</span>
              <p className="text-sm"><span className="font-bold uppercase text-[11px]">Radar:</span> Since you are both near the same thing, the app knows you are in the same room. Your friend will now show up on your <span className="text-[#00ff41] font-bold">"RADAR"</span> screen!</p>
            </li>
          </ul>
          <div className="pt-4 border-t border-[#00ff41]/10 mt-4">
            <p className="text-[11px] opacity-70 italic">
              It is a private way to show you are nearby without using your GPS or sharing your exact location on a map.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 uppercase tracking-tight text-[#00ff41]">
          <Globe className="w-5 h-5" /> The Global Relay
        </h3>
        <div className="border border-[#00ff41]/10 p-6 space-y-3">
          <p className="text-sm opacity-80">
            Even if you aren't anchored to a device, you can still see everyone on the <span className="font-bold">RELAY_STATION</span>. This is a global chat room where all nodes can communicate.
          </p>
          <p className="text-sm opacity-80">
            Messages from nodes that are physically near you (sharing your anchor) will be highlighted with a <span className="text-[#00ff41] font-bold">Green Glow</span>.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 uppercase tracking-tight text-[#00ff41]">
          <Radio className="w-5 h-5" /> Noticeboards
        </h3>
        <div className="border border-[#00ff41]/10 p-6 space-y-3">
          <p className="text-sm opacity-80">
            Noticeboards are for long-form messages. They are organized by topic. 
          </p>
          <p className="text-sm font-bold text-red-500 uppercase tracking-widest text-[10px]">
            Warning: All noticeboards are wiped clean every 24 hours at 12:00 UTC.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 uppercase tracking-tight text-red-500">
          <AlertCircle className="w-5 h-5" /> Communication Rules
        </h3>
        <div className="border border-red-500/20 bg-red-500/5 p-6 space-y-3">
          <p className="text-sm opacity-80">
            To keep the network fast and safe, some things are not allowed:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="text-red-500 font-bold">×</span>
              <span><span className="font-bold uppercase text-[11px]">No Web Links:</span> You cannot share website addresses. They will be removed automatically.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-500 font-bold">×</span>
              <span><span className="font-bold uppercase text-[11px]">No Images:</span> This is a text-only network. You cannot share pictures.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-500 font-bold">×</span>
              <span><span className="font-bold uppercase text-[11px]">No Emojis:</span> Please use only letters, numbers, and standard symbols.</span>
            </li>
          </ul>
        </div>
      </section>
      </div>
    </motion.div>
  );
}
