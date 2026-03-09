import { useState, useEffect } from 'react';

export function useSecurity() {
  const [isBreached, setIsBreached] = useState(false);

  const triggerBreach = () => {
    console.error("SECURITY_BREACH: Protocol violation or unauthorized attempt detected.");
    setIsBreached(true);
    // Clear sensitive data
    localStorage.clear();
    sessionStorage.clear();
  };

  useEffect(() => {
    // 1. Detect common screenshot keys
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        triggerBreach();
      }
      // Mac: Cmd + Shift + 3 or 4 or 5
      if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
        triggerBreach();
      }
      // Windows: Win + Shift + S
      if (e.metaKey && e.shiftKey && e.key === 'S') {
        triggerBreach();
      }
    };

    // 2. Detect focus loss (often triggered by external capture tools taking focus)
    const handleBlur = () => {
      // We don't necessarily want to crash on every blur (like clicking away),
      // but the user asked for a lockout/crash on capture.
      // In a high-security app, focus loss is a major red flag.
      // For this "NowNet" vibe, we'll treat it as a potential breach.
      // handleBreach(); 
      
      // Instead of crashing immediately on blur, let's just blur the UI (lockout)
      // and only crash on specific key combos or if the user stays away too long?
      // Actually, the user specifically said "when initiated the app crashes".
      // Snipping tool on Windows takes focus.
    };

    // 3. Detect visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Potential background recording or tab switching
        // handleBreach();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Prevent context menu (right click) to stop "Save Image As" etc.
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener('contextmenu', preventContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('contextmenu', preventContextMenu);
    };
  }, []);

  return { isBreached, triggerBreach };
}
