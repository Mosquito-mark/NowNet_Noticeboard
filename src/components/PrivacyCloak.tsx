import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface PrivacyCloakProps {
  userId: string;
}

export function PrivacyCloak({ userId }: PrivacyCloakProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [isPanic, setIsPanic] = useState(false);
  const [watermarkPos, setWatermarkPos] = useState({ x: 10, y: 10 });
  const [lastEscTime, setLastEscTime] = useState(0);

  useEffect(() => {
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
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(watermarkInterval);
    };
  }, [lastEscTime]);

  return (
    <>
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
    </>
  );
}
