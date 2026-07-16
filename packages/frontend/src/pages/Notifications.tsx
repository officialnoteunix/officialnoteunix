import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, MessageCircle, Shield, UserPlus, FileText, Lock, Bell, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { notificationApi } from '../api/notification';
import { useAuth } from '../context/AuthContext';
import { useNotificationCount } from '../context/NotificationContext';

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
  note_approved: 'var(--primary)',
  note_rejected: 'var(--danger)',
  new_comment: 'var(--primary)',
  report_resolved: 'var(--warning)',
  welcome: 'var(--primary)',
  note_uploaded: 'var(--text-muted)',
  password_changed: 'var(--text-muted)',
};

const ITEMS_PER_PAGE = 5;

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

function getDateGroup(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (d >= today) return 'Today';
  if (d >= yesterday) return 'Yesterday';
  if (d >= weekAgo) return 'This Week';
  return 'Earlier';
}

const GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'Earlier'];

function SectionPagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="notif-pagination">
      <button className="notif-page-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft size={14} />
      </button>
      <span className="notif-page-info">{page}/{totalPages}</span>
      <button className="notif-page-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { unreadCount, refreshCount } = useNotificationCount();
  const [groupPages, setGroupPages] = useState<Record<string, number>>({});

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationApi.list({ limit: 100 });
      const items = res.data.data.items || res.data.data;
      setNotifications(items);
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
    if (notification.link) {
      const url = notification.link;
      if (url.startsWith('http')) window.open(url, '_blank');
      else navigate(url);
    }
  };

  const setGroupPage = (group: string, page: number) => {
    setGroupPages(prev => ({ ...prev, [group]: page }));
  };

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const n of notifications) {
      const group = getDateGroup(n.createdAt);
      if (!map[group]) map[group] = [];
      map[group].push(n);
    }
    return GROUP_ORDER.filter(g => map[g]).map(g => ({ label: g, items: map[g] }));
  }, [notifications]);

  const leftGroups = grouped.filter(g => g.label === 'Today');
  const rightGroups = grouped.filter(g => g.label !== 'Today');

  const renderNotification = (n: any) => {
    const Icon = TYPE_ICONS[n.type] || FileText;
    const iconColor = TYPE_COLORS[n.type] || 'var(--text-muted)';
    return (
      <div
        key={n._id}
        className={`notif-item ${!n.read ? 'notif-item--unread' : ''}`}
        onClick={() => handleClick(n)}
      >
        <div className="notif-item-icon" style={{ color: iconColor }}>
          <Icon size={16} />
        </div>
        <div className="notif-item-content">
          <div className="notif-item-text">
            <span className="notif-item-title">{n.title}</span>
            <span className="notif-item-dot">·</span>
            <span className="notif-item-message">{n.message}</span>
          </div>
          <div className="notif-item-time">{getTimeAgo(n.createdAt)}</div>
        </div>
        {!n.read && <div className="notif-item-unread" />}
      </div>
    );
  };

  const renderSection = (group: { label: string; items: any[] }) => {
    const page = groupPages[group.label] || 1;
    const totalPages = Math.max(1, Math.ceil(group.items.length / ITEMS_PER_PAGE));
    const pageItems = group.items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
      <div key={group.label} className="notif-section">
        <div className="notif-section-header">
          <span className="notif-section-label">{group.label}</span>
          <span className="notif-section-count">{group.items.length}</span>
        </div>
        <div className="notif-list">
          {pageItems.map(renderNotification)}
        </div>
        <SectionPagination page={page} totalPages={totalPages} onPageChange={(p) => setGroupPage(group.label, p)} />
      </div>
    );
  };

  if (!user) {
    return (
      <div className="notif-page">
        <h1 className="notif-title">Notifications</h1>
        <p className="notif-subtitle">Please log in to view notifications.</p>
      </div>
    );
  }

  return (
    <div className="notif-page">
      <div className="notif-header">
        <div>
          <h1 className="notif-title">Notifications</h1>
          <p className="notif-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="notif-mark-btn" onClick={handleMarkAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}>
          <div className="spinner" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="notif-empty">
          <Bell size={20} />
          <span>No notifications</span>
        </div>
      ) : (
        <div className="notif-columns">
          <div className="notif-col">
            {leftGroups.length > 0 ? leftGroups.map(renderSection) : (
              <div className="notif-empty-inline">No activity today</div>
            )}
          </div>
          <div className="notif-col">
            {rightGroups.length > 0 ? rightGroups.map(renderSection) : (
              <div className="notif-empty-inline">No older notifications</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
