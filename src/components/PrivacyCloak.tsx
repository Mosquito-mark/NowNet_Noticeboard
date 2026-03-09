import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface PrivacyCloakProps {
  userId: string;
}

export function PrivacyCloak({ userId }: PrivacyCloakProps) {
  const [isBlurred, setIsBlurred] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isPanic, setIsPanic] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [watermarkPos, setWatermarkPos] = useState({ x: 10, y: 10 });
  const [lastEscTime, setLastEscTime] = useState(0);

  useEffect(() => {
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Panic Key: Double-tap Escape
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEscTime < 300) {
          setIsPanic(prev => !prev);
        }
        setLastEscTime(now);
      }

      // Detect common screenshot shortcuts
      const isScreenshot = 
        e.key === 'PrintScreen' || 
        ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === 's'));

      if (isScreenshot) {
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 500);
      }
    };

    const moveWatermark = () => {
      setWatermarkPos({
        x: Math.random() * 80 + 5, // 5% to 85%
        y: Math.random() * 80 + 5  // 5% to 85%
      });
    };

    const watermarkInterval = setInterval(moveWatermark, 5000);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(watermarkInterval);
    };
  }, [lastEscTime]);

  return (
    <>
      {/* Flashlight Mask: Only reveals a small area around the cursor */}
      <div 
        className="fixed inset-0 z-[80] pointer-events-none select-none"
        style={{
          background: `radial-gradient(circle 120px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, rgba(0,0,0,0.4) 100%)`
        }}
      />

      {/* Watermark: Subtle, moving Node ID to discourage sharing captures */}
      <motion.div 
        animate={{ left: `${watermarkPos.x}%`, top: `${watermarkPos.y}%` }}
        transition={{ duration: 4, ease: "linear" }}
        className="fixed pointer-events-none z-[100] opacity-[0.03] select-none font-black text-4xl whitespace-nowrap"
      >
        NODE_{userId} :: {new Date().toLocaleDateString()}
      </motion.div>

      {/* Flash Overlay: Obscures screen during potential capture */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[1000] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Panic Overlay: Full blackout triggered by double-tap Escape */}
      <AnimatePresence>
        {isPanic && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[2000] flex items-center justify-center cursor-none"
            onClick={() => setIsPanic(false)}
          >
            <div className="text-[#00ff41] text-[10px] uppercase tracking-[1em] font-black opacity-20">
              TERMINAL_LOCKED :: DOUBLE_TAP_ESC_TO_RESTORE
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blur Overlay: When tab is inactive */}
      <AnimatePresence>
        {isBlurred && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[999] flex items-center justify-center pointer-events-none"
          >
            <div className="text-[#00ff41] text-xs tracking-[0.5em] font-bold animate-pulse">
              PRIVACY_CLOAK: ACTIVE
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
