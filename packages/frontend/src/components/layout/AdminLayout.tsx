import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { adminApi } from '../../api/admin';
import { authApi } from '../../api/auth';
import { useLocalStorage, useLocalStorageNum } from '../../utils/useLocalStorage';
import { useStatsRefresh } from '../../utils/statsRefresh';
import {
   LayoutDashboard, BookOpen, FileText, Users, Flag,
  LogOut, Sun, Moon, ChevronLeft, ChevronRight, Megaphone,   MessageSquare, Menu, X,
  BarChart3, MessageCircle, Shield, Bell, Mail as MailIcon
} from 'lucide-react';
import NotificationBell from '../notification/NotificationBell';
import LogoutModal from '../ui/LogoutModal';
import { useNotificationCount } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../utils/constants';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [stats, setStats] = useLocalStorage<Record<string, number>>('adminStats', {});
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const { unreadCount } = useNotificationCount();
  const { showToast } = useToast();

  const refreshStats = useCallback(() => {
    adminApi.stats().then(r => setStats(r.data.data)).catch(() => {});
  }, [setStats]);

  useEffect(() => { refreshStats(); }, [refreshStats]);
  useStatsRefresh(refreshStats);

  const [seenNotes, setSeenNotes] = useLocalStorageNum('seen_/admin/notes');
  const [seenReports, setSeenReports] = useLocalStorageNum('seen_/admin/reports');
  const [seenMessages, setSeenMessages] = useLocalStorageNum('seen_/admin/messages');
  const [seenAudit, setSeenAudit] = useLocalStorageNum('seen_/admin/audit-logs');

  useEffect(() => {
    if (pathname === '/admin/notes' && stats.pendingNotes != null) setSeenNotes(stats.pendingNotes);
    if (pathname === '/admin/reports' && stats.pendingReports != null) setSeenReports(stats.pendingReports);
  }, [pathname, stats.pendingNotes, stats.pendingReports, setSeenNotes, setSeenReports]);

  useEffect(() => {
    if (pathname === '/admin/messages' && (stats.unreadContactMessages ?? 0) > 0) {
      adminApi.markAllContactRead().then(() => {
        setSeenMessages(0);
        return adminApi.stats().then(r => setStats(r.data.data));
      }).catch(() => {});
    }
    if (pathname === '/admin/audit-logs' && stats.recentAuditLogs != null) setSeenAudit(stats.recentAuditLogs);
  }, [pathname, setSeenMessages, setSeenAudit]);

  const badgeNew = (current: number | undefined, seen: number): number | undefined => {
    if (!current || current <= 0) return undefined;
    return current > seen ? current - seen : undefined;
  };

  const links = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Overview' },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, category: 'Overview' },
    { to: '/admin/content', label: 'Content', icon: BookOpen, category: 'Management' },
    { to: '/admin/notes', label: 'Notes', icon: FileText, category: 'Management', badge: badgeNew(stats.pendingNotes, seenNotes) },
    { to: '/admin/users', label: 'Users', icon: Users, category: 'Management' },
    { to: '/admin/reports', label: 'Reports', icon: Flag, category: 'Moderation', badge: badgeNew(stats.pendingReports, seenReports) },
    { to: '/admin/ads', label: 'Ads', icon: Megaphone, category: 'Moderation' },
    { to: '/admin/comments', label: 'Comments', icon: MessageCircle, category: 'Moderation' },
    { to: '/admin/messages', label: 'Messages', icon: MessageSquare, category: 'Moderation', badge: badgeNew(stats.unreadContactMessages, seenMessages) },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: Shield, category: 'Moderation', badge: badgeNew(stats.recentAuditLogs, seenAudit) },
    { to: '/admin/mail', label: 'Mail', icon: MailIcon, category: 'Support' },
    { to: '/notifications', label: 'Notifications', icon: Bell, category: 'Support', badge: unreadCount },
  ];

  const currentPage = links.find(l => l.to === pathname)?.label || 'Dashboard';
  const seenCategories = new Set<string>();

  return (
    <div className="dashboard-container">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''} ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          {!collapsed ? (
            <Link to="/admin/dashboard" className="logo-container">
              <span style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: 17 }}>Note</span>
              <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 17 }}>UniX</span>
            </Link>
          ) : (
            <Link to="/admin/dashboard" style={{ textDecoration: 'none' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 900, fontSize: 18 }}>N</span>
            </Link>
          )}
          <button className="sidebar-toggle-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <nav className="sidebar-nav">
          {links.map(link => {
            const Icon = link.icon;
            const showCategory = link.category && !seenCategories.has(link.category);
            if (link.category) seenCategories.add(link.category);
            return (
              <div key={link.to}>
                {showCategory && !collapsed && (
                  <div className="sidebar-section">{link.category}</div>
                )}
                <NavLink
                  to={link.to}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={20} />
                  {!collapsed && <span>{link.label}</span>}
                  {link.badge ? <span className="sidebar-badge" style={link.label === 'Notifications' ? { background: 'var(--danger)' } : undefined}>{link.badge}</span> : null}
                </NavLink>
              </div>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="user-avatar" style={user?.avatar ? { background: `url(${user.avatar}) center/cover`, color: 'transparent' } : {}}>
            {user?.avatar ? '' : (user?.fullname?.charAt(0).toUpperCase() || 'A')}
          </div>
          {!collapsed && (
            <div className="user-info">
              <span className="user-name">{user?.fullname || 'Admin'}</span>
              <span className="user-role">Administrator</span>
            </div>
          )}
        </div>
      </aside>

      <div className={`dashboard-main ${collapsed ? 'expanded' : ''}`}>
        <header className="dashboard-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="show-mobile mobile-hamburger"
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', padding: 4 }}
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
            <nav className="breadcrumb-nav">
              <Link to="/admin/dashboard" className="breadcrumb-item">Admin</Link>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">{currentPage}</span>
            </nav>
          </div>
          <div className="topbar-actions">
            <NotificationBell />
            <button
              onClick={toggleTheme}
              className="sidebar-toggle-btn"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setShowLogout(true)}
              className="btn-rounded btn-ghost"
              style={{ padding: '8px 16px', display: 'flex', gap: 8, fontSize: 13 }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>
        <main className="dashboard-content">
          {user && !user.emailVerified && (
            <div style={{
              background: 'var(--warning-light)', color: 'var(--warning)',
              padding: '10px 16px', fontSize: 13, borderRadius: 'var(--radius-md)',
              marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>⚠️ Please verify your email address.</span>
              <button
                onClick={() => authApi.resendVerification(user.email).then(() => showToast('success', 'Verification email sent!')).catch(err => showToast('error', getApiError(err, 'Failed to send verification email.')))}
                style={{
                  background: 'none', border: 'none', color: 'var(--warning)', fontWeight: 600,
                  cursor: 'pointer', fontSize: 13, textDecoration: 'underline', padding: 0,
                }}
              >Resend</button>
            </div>
          )}
          <Outlet />
        </main>
      </div>

      <LogoutModal open={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
}
