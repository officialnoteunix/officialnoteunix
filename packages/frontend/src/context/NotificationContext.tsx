import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { notificationApi } from '../api/notification';

interface NotificationContextValue {
  unreadCount: number;
  refreshCount: () => void;
  decrementCount: (n?: number) => void;
  setUnreadCount: (n: number) => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  refreshCount: () => {},
  decrementCount: () => {},
  setUnreadCount: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const mounted = useRef(false);

  const refreshCount = useCallback(async () => {
    if (!user) { setUnreadCount(0); return; }
    try {
      const res = await notificationApi.count();
      setUnreadCount(res.data.data.count);
    } catch { /* ignore */ }
  }, [user]);

  const decrementCount = useCallback((n = 1) => {
    setUnreadCount(prev => Math.max(0, prev - n));
  }, []);

  useEffect(() => { refreshCount(); }, [refreshCount]);

  useEffect(() => {
    const isNotificationsPage = pathname === '/notifications' || pathname.startsWith('/user/notifications');
    if (isNotificationsPage) {
      setUnreadCount(0);
      notificationApi.markAllRead().then(() => refreshCount()).catch(() => {});
    } else if (mounted.current) {
      refreshCount();
    }
    mounted.current = true;
    const interval = setInterval(refreshCount, 60000);
    return () => clearInterval(interval);
  }, [pathname, refreshCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshCount, decrementCount, setUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotificationCount = () => useContext(NotificationContext);
