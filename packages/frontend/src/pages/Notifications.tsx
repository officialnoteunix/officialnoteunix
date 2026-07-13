import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, MessageCircle, Shield, UserPlus, FileText, Lock,
} from 'lucide-react';
import { notificationApi } from '../api/notification';
import { useAuth } from '../context/AuthContext';
import { useNotificationCount } from '../context/NotificationContext';
import Pagination from '../components/ui/Pagination';

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
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { unreadCount, refreshCount } = useNotificationCount();

  const fetchNotifications = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await notificationApi.list({ page: p, limit: 20 });
      const items = res.data.data.items || res.data.data;
      setNotifications(items);
      setTotalPages(res.data.data.totalPages || 1);
      setTotal(res.data.data.total || items.length);
      setPage(p);
      refreshCount();
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [refreshCount]);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user, fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      refreshCount();
    } catch { /* ignore */ }
  };

  const handleClick = async (notification: any) => {
    if (!notification.read) {
      try {
        await notificationApi.markRead(notification._id);
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
        );
        refreshCount();
      } catch { /* ignore */ }
    }
    if (notification.link) navigate(notification.link);
  };

  if (!user) {
    return (
      <div style={{ padding: '100px 5% 60px', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Notifications</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Please log in to view notifications.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '100px 5% 60px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Notifications</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            className="btn-rounded btn-ghost"
            style={{ padding: '8px 16px', fontSize: 13 }}
            onClick={handleMarkAllRead}
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 300 }}>
          <div className="spinner" />
        </div>
      ) : notifications.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)', padding: 60, textAlign: 'center',
        }}>
          <CheckCircle size={40} style={{ color: 'var(--text-light)', marginBottom: 16 }} />
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>No notifications</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            You'll see updates about your notes and account here.
          </p>
        </div>
      ) : (
        <>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
          }}>
            {notifications.map((n, i) => {
              const Icon = TYPE_ICONS[n.type] || FileText;
              const iconColor = TYPE_COLORS[n.type] || 'var(--text-muted)';
              return (
                <div
                  key={n._id}
                  onClick={() => handleClick(n)}
                  style={{
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                    padding: '14px 20px',
                    borderBottom: i < notifications.length - 1 ? '1px solid var(--border-color)' : 'none',
                    cursor: n.link ? 'pointer' : 'default',
                    background: n.read ? 'transparent' : 'var(--primary-light)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                  onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'var(--primary-light)')}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, color: iconColor,
                  }}>
                    <Icon size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.read ? 400 : 700, fontSize: 14, marginBottom: 2 }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
                      {getTimeAgo(n.createdAt)}
                    </div>
                  </div>
                  {!n.read && (
                    <div style={{
                      width: 8, height: 8, borderRadius: 'var(--radius-full)',
                      background: 'var(--primary)', flexShrink: 0, marginTop: 6,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 20 }}>
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={fetchNotifications} />
          </div>
        </>
      )}
    </div>
  );
}
