import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Bell, Check, Trash2, CheckCircle, XCircle, MessageCircle, Shield, UserPlus, FileText, Lock,
} from 'lucide-react';
import { notificationApi } from '../../api/notification';
import { useAuth } from '../../context/AuthContext';
import { useNotificationCount } from '../../context/NotificationContext';

const TYPE_ICONS: Record<string, typeof CheckCircle> = {
  note_approved: CheckCircle,
  note_rejected: XCircle,
  new_comment: MessageCircle,
  report_resolved: Shield,
  welcome: UserPlus,
  note_uploaded: FileText,
  password_changed: Lock,
};

const TYPE_COLORS: Record<string, string> = {
  note_approved: 'var(--secondary)',
  note_rejected: 'var(--danger)',
  new_comment: 'var(--primary)',
  report_resolved: 'var(--warning)',
  welcome: 'var(--primary)',
  note_uploaded: 'var(--text-muted)',
  password_changed: 'var(--text-muted)',
};

function getTimeAgo(date: string): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { unreadCount, refreshCount, decrementCount } = useNotificationCount();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open || !user) return;
    const fetchNotifications = async () => {
      try {
        const res = await notificationApi.list({ limit: 5 });
        setNotifications(res.data.data.items || res.data.data);
      } catch { /* ignore */ }
    };
    fetchNotifications();
  }, [open, user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      refreshCount();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  const handleMarkRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notificationApi.markRead(id);
      decrementCount();
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch { /* ignore */ }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notificationApi.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      refreshCount();
    } catch { /* ignore */ }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      try {
        await notificationApi.markRead(notification._id);
        decrementCount();
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
        );
      } catch { /* ignore */ }
    }
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const bellBtnStyle = {
    background: 'var(--bg-subtle)', border: 'none', cursor: 'pointer',
    width: 36, height: 36, borderRadius: 'var(--radius-full)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-muted)', position: 'relative' as const,
    transition: 'background 0.15s',
  };

  const dropdownContent = (
    <>
      <div className="notif-dropdown-backdrop" onClick={() => setOpen(false)} />
      <div className="dropdown-panel notification-dropdown">
        <div className="dropdown-header">
          <span>Notifications {unreadCount > 0 && <span style={{ color: 'var(--danger)', fontSize: 12 }}>({unreadCount})</span>}</span>
          {unreadCount > 0 && (
            <button className="dropdown-action" onClick={handleMarkAllRead}>
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="dropdown-empty" style={{ padding: '28px 16px' }}>
            <Bell size={24} style={{ color: 'var(--text-light)', marginBottom: 8 }} />
            <div>No notifications yet</div>
          </div>
        ) : (
          <>
            <div className="dropdown-items">
              {notifications.map(n => {
                const Icon = TYPE_ICONS[n.type] || FileText;
                const iconColor = TYPE_COLORS[n.type] || 'var(--text-muted)';
                const isUnread = !n.read;
                return (
                <div
                  key={n._id}
                  className={`dropdown-item ${isUnread ? 'dropdown-item--unread' : ''}`}
                  onClick={() => handleNotificationClick(n)}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <div
                    style={{
                      width: 30, height: 30, borderRadius: 'var(--radius-full)',
                      background: isUnread ? 'rgba(129,140,248,0.12)' : 'var(--bg-subtle)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, color: iconColor, transition: 'background 0.12s',
                    }}
                  >
                    <Icon size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: isUnread ? 700 : 500, fontSize: 13, marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.message}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {getTimeAgo(n.createdAt)}
                  </div>
                </div>
                );
              })}
            </div>
            <div
              onClick={() => { setOpen(false); navigate(user?.role === 'admin' ? '/admin/notifications' : '/user/notifications'); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, padding: '10px 16px', borderTop: '1px solid var(--border-color)',
                fontSize: 13, fontWeight: 600, color: 'var(--primary)',
                cursor: 'pointer', transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              View all notifications →
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button style={bellBtnStyle} onClick={() => setOpen(!open)} aria-label="Notifications">
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            background: 'var(--danger)', color: '#fff',
            fontSize: 10, fontWeight: 700, lineHeight: '16px',
            width: unreadCount > 9 ? 20 : 16, height: 16,
            borderRadius: 'var(--radius-full)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (isMobile ? createPortal(dropdownContent, document.body) : dropdownContent)}
    </div>
  );
}
