import { useEffect, useState, useCallback } from 'react';
import { Lock, Timer } from 'lucide-react';
import { motion } from 'framer-motion';

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export default function InactivityGuard({ onTimeout }) {
  const [showOverlay, setShowOverlay] = useState(false);

  const resetTimer = useCallback(() => {
    setShowOverlay(false);
  }, []);

  useEffect(() => {
    let timer;

    const startTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setShowOverlay(true);
        onTimeout?.();
      }, TIMEOUT_MS);
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    const handleActivity = () => {
      setShowOverlay(false);
      startTimer();
    };

    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    startTimer();

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, handleActivity));
    };
  }, [onTimeout]);

  if (!showOverlay) return null;

  return (
    <motion.div
      className="inactivity-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="inactivity-card">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="logo-icon" style={{ width: 56, height: 56 }}>
            <Lock size={26} color="#fff" />
          </div>
        </div>
        <h2>Session Locked</h2>
        <p>
          Your screen was cleared after 5 minutes of inactivity to protect sensitive data.
        </p>
        <button
          id="unlock-session-btn"
          className="action-btn encrypt-btn"
          onClick={resetTimer}
          style={{ width: 'auto', padding: '0.7rem 2rem' }}
        >
          <Timer size={16} /> Resume Session
        </button>
      </div>
    </motion.div>
  );
}
