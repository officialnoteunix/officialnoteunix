import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { userApi } from '../../api/user';
import { useLocalStorage, useLocalStorageNum } from '../../utils/useLocalStorage';
import {
  LayoutDashboard, Bookmark, FileText, Flag, Settings, Bell,
  LogOut, Sun, Moon, ChevronLeft, ChevronRight, BookOpen, Menu, X
} from 'lucide-react';
import NotificationBell from '../notification/NotificationBell';
import LogoutModal from '../ui/LogoutModal';
import { useNotificationCount } from '../../context/NotificationContext';

export default function UserLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [stats, setStats] = useLocalStorage<Record<string, number>>('userStats', {});
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const { unreadCount } = useNotificationCount();

  useEffect(() => {
    userApi.dashboardStats().then(r => setStats(r.data.data)).catch(() => {});
  }, [setStats]);

  const [seenMyNotes, setSeenMyNotes] = useLocalStorageNum('seen_/user/my-notes');

  useEffect(() => {
    if (pathname === '/user/my-notes' && stats.pendingNotes != null) setSeenMyNotes(stats.pendingNotes);
  }, [pathname, stats.pendingNotes, setSeenMyNotes]);

  const badgeNew = (current: number | undefined, seen: number): number | undefined => {
    if (!current || current <= 0) return undefined;
    return current > seen ? current - seen : undefined;
  };

  const links = [
    { to: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Overview' },
    { to: '/user/browse', label: 'Browse Notes', icon: BookOpen, category: 'Content' },
    { to: '/user/my-notes', label: 'My Notes', icon: FileText, category: 'Content', badge: badgeNew(stats.pendingNotes, seenMyNotes) },
    { to: '/user/bookmarks', label: 'Bookmarks', icon: Bookmark, category: 'Content' },
    { to: '/user/notifications', label: 'Notifications', icon: Bell, category: 'Support', badge: unreadCount },
    { to: '/user/reports', label: 'Reports', icon: Flag, category: 'Support' },
    { to: '/user/settings', label: 'Settings', icon: Settings, category: 'Support' },
  ];

  const currentPage = links.find(l => l.to === pathname)?.label || 'Dashboard';
  const seenCategories = new Set<string>();

  return (
    <div className="dashboard-container">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''} ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          {!collapsed ? (
            <Link to="/user/dashboard" className="logo-container">
              <span style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: 17 }}>Note</span>
              <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 17 }}>UniX</span>
            </Link>
          ) : (
            <Link to="/user/dashboard" style={{ textDecoration: 'none' }}>
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
        <Link to="/user/profile" className="sidebar-footer" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <div className="user-avatar" style={user?.avatar ? { background: `url(${user.avatar}) center/cover`, color: 'transparent' } : {}}>
            {user?.avatar ? '' : (user?.fullname?.charAt(0).toUpperCase() || 'U')}
          </div>
          {!collapsed && (
            <div className="user-info">
              <span className="user-name">{user?.fullname || 'User'}</span>
              <span className="user-role">{user?.role || 'Student'}</span>
            </div>
          )}
        </Link>
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
              <Link to="/user/dashboard" className="breadcrumb-item">Dashboard</Link>
              <ChevronRight size={14} className="breadcrumb-separator" />
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
          <Outlet />
        </main>
      </div>

      <LogoutModal open={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
}
