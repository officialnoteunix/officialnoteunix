import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

export default function RateLimitBanner() {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { retryAfter: number };
      setCountdown(detail.retryAfter);
      setVisible(true);
    };
    window.addEventListener('rate-limited', handler);
    return () => window.removeEventListener('rate-limited', handler);
  }, []);

  useEffect(() => {
    if (!visible) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [visible]);

  if (!visible) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'var(--warning)', color: '#fff',
      padding: '10px 16px', fontSize: 13, fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      <Clock size={16} />
      Too many requests. Retry in {minutes > 0 ? `${minutes}m ` : ''}{seconds}s
    </div>
  );
}
