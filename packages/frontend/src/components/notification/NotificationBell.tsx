import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2 } from 'lucide-react';
import { notificationApi } from '../../api/notification';
import { useAuth } from '../../context/AuthContext';
import { useNotificationCount } from '../../context/NotificationContext';

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

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { unreadCount, refreshCount, decrementCount } = useNotificationCount();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  };

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

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 380, background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000, overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color)',
          }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications {unreadCount > 0 && <span style={{ color: 'var(--danger)', fontSize: 12 }}>({unreadCount})</span>}</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--primary)', fontSize: 12, fontWeight: 600,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No notifications yet
            </div>
          ) : (
            <>
              {notifications.map(n => {
                const isUnread = !n.read;
                return (
                  <div
                    key={n._id}
                    style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      background: isUnread ? 'var(--primary-light)' : 'transparent',
                      transition: 'background 0.2s',
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--bg-subtle)';
                      const actions = e.currentTarget.querySelector('.notif-actions') as HTMLElement;
                      if (actions) actions.style.display = 'flex';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = isUnread ? 'var(--primary-light)' : 'transparent';
                      const actions = e.currentTarget.querySelector('.notif-actions') as HTMLElement;
                      if (actions) actions.style.display = 'none';
                    }}
                  >
                    <div onClick={() => handleNotificationClick(n)}>
                      <div style={{ fontWeight: isUnread ? 700 : 400, fontSize: 13, marginBottom: 2, paddingRight: 40 }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
                        {getTimeAgo(n.createdAt)}
                      </div>
                    </div>
                    <div
                      className="notif-actions"
                      style={{
                        display: 'none', position: 'absolute', top: 8, right: 8,
                        gap: 2, alignItems: 'center',
                      }}
                    >
                      {isUnread && (
                        <button
                          onClick={(e) => handleMarkRead(e, n._id)}
                          title="Mark as read"
                          style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            width: 24, height: 24,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--secondary)', padding: 0,
                          }}
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(e, n._id)}
                        title="Dismiss"
                        style={{
                          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          width: 24, height: 24,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--text-muted)', padding: 0,
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
              <div
                onClick={() => { setOpen(false); navigate('/notifications'); }}
                style={{
                  padding: '10px 16px', textAlign: 'center',
                  color: 'var(--primary)', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                View all notifications
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
