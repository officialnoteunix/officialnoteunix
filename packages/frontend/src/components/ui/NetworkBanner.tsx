import { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';

export default function NetworkBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  const [serverDown, setServerDown] = useState(false);

  useEffect(() => {
    const handleOnline = () => { setOnline(true); setServerDown(false); };
    const handleOffline = () => { setOnline(false); setServerDown(false); };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!online) return;
    const interval = setInterval(async () => {
      try {
        const base = import.meta.env.VITE_BACKEND_URL || '';
        const res = await fetch(`${base}/api/health`, { method: 'GET', cache: 'no-store' });
        setServerDown(!res.ok);
      } catch {
        setServerDown(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [online]);

  useEffect(() => {
    if (!online) return;
    const handler = ((e: CustomEvent) => {
      if (e.detail?.code === 'ERR_NETWORK') {
        setServerDown(true);
      } else if (e.detail?.status >= 500) {
        setServerDown(true);
      }
    }) as EventListener;
    window.addEventListener('api:error', handler);
    return () => window.removeEventListener('api:error', handler);
  }, [online]);

  if (online && !serverDown) return null;

  return (
    <div className="network-banner">
      {online && serverDown ? (
        <>
          <AlertTriangle size={16} />
          <span>Server is currently unavailable. Please try again later.</span>
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <span>No internet connection. Please check your network.</span>
        </>
      )}
    </div>
  );
}
