import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLocalStorage, useLocalStorageNum } from '../../utils/useLocalStorage';
import { useStatsRefresh } from '../../utils/statsRefresh';
import {
  LayoutDashboard, BookOpen, FileText, Flag,
  LogOut, Sun, Moon, ChevronLeft, ChevronRight,
  Megaphone, MessageSquare, Menu, X, BarChart3, MessageCircle, Shield, UserCog,
} from 'lucide-react';
import LogoutModal from '../ui/LogoutModal';

interface MaintainerLink {
  to: string;
  label: string;
  icon: any;
  category: string;
  perm: string;
  badge?: number | undefined;
}

export const MAINTAINER_LINKS: MaintainerLink[] = [
  { to: '/maintainer/notes', label: 'Notes', icon: FileText, category: 'Moderation', perm: 'note:moderate' },
  { to: '/maintainer/comments', label: 'Comments', icon: MessageCircle, category: 'Moderation', perm: 'comment:moderate' },
  { to: '/maintainer/reports', label: 'Reports', icon: Flag, category: 'Moderation', perm: 'report:manage' },
  { to: '/maintainer/messages', label: 'Messages', icon: MessageSquare, category: 'Moderation', perm: 'contact:manage' },
  { to: '/maintainer/ads', label: 'Ads', icon: Megaphone, category: 'Content', perm: 'ad:manage' },
  { to: '/maintainer/content', label: 'Taxonomy', icon: BookOpen, category: 'Content', perm: 'taxonomy:edit' },
  { to: '/maintainer/analytics', label: 'Analytics', icon: BarChart3, category: 'Insights', perm: 'analytics:view' },
];

export function firstMaintainerPath(permissions: string[] | undefined, role: string | undefined): string {
  const isAdmin = role === 'admin';
  const link = MAINTAINER_LINKS.find(l => isAdmin || (permissions || []).includes(l.perm));
  return link ? link.to : '/maintainer/notes';
}

export default function MaintainerLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [stats, setStats] = useLocalStorage<Record<string, number>>('maintainerStats', {});
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();

  const isAdmin = user?.role === 'admin';
  const perms = user?.permissions || [];

  const refreshStats = useCallback(() => {
    if (isAdmin) {
      import('../../api/admin').then(({ adminApi }) =>
        adminApi.stats().then(r => setStats(r.data.data)).catch(() => {})
      );
    }
  }, [isAdmin, setStats]);

  useEffect(() => { refreshStats(); }, [refreshStats]);
  useStatsRefresh(refreshStats);

  const [seenNotes, setSeenNotes] = useLocalStorageNum('seen_/maintainer/notes');
  const [seenReports, setSeenReports] = useLocalStorageNum('seen_/maintainer/reports');
  const [seenMessages, setSeenMessages] = useLocalStorageNum('seen_/maintainer/messages');

  useEffect(() => {
    if (pathname === '/maintainer/notes' && stats.pendingNotes != null) setSeenNotes(stats.pendingNotes);
    if (pathname === '/maintainer/reports' && stats.pendingReports != null) setSeenReports(stats.pendingReports);
  }, [pathname, stats.pendingNotes, stats.pendingReports, setSeenNotes, setSeenReports]);

  useEffect(() => {
    if (pathname === '/maintainer/messages' && (stats.unreadContactMessages ?? 0) > 0) {
      import('../../api/admin').then(({ adminApi }) =>
        adminApi.markAllContactRead().then(() => setSeenMessages(0)).catch(() => {})
      );
    }
  }, [pathname, setSeenMessages]);

  const badgeNew = (current: number | undefined, seen: number): number | undefined => {
    if (!current || current <= 0) return undefined;
    return current > seen ? current - seen : undefined;
  };

  const has = (key: string) => isAdmin || perms.includes(key);

  const allLinks = MAINTAINER_LINKS.map(l => ({
    ...l,
    badge: l.perm === 'note:moderate' ? badgeNew(stats.pendingNotes, seenNotes)
      : l.perm === 'report:manage' ? badgeNew(stats.pendingReports, seenReports)
      : l.perm === 'contact:manage' ? badgeNew(stats.unreadContactMessages, seenMessages)
      : undefined,
  }));

  const links = allLinks.filter(l => has(l.perm));
  const seenCategories = new Set<string>();
  const currentPage = links.find(l => pathname.startsWith(l.to))?.label || 'Moderation';
  const defaultPath = links[0]?.to || '/maintainer/notes';

  return (
    <div className="dashboard-container">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''} ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          {!collapsed ? (
            <Link to={defaultPath} className="logo-container">
              <span style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: 17 }}>Note</span>
              <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 17 }}>UniX</span>
            </Link>
          ) : (
            <Link to={defaultPath} style={{ textDecoration: 'none' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 900, fontSize: 18 }}>N</span>
            </Link>
          )}
          <button className="sidebar-toggle-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <nav className="sidebar-nav">
          {links.length === 0 && !collapsed && (
            <div className="sidebar-section">No access</div>
          )}
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
                  {link.badge ? <span className="sidebar-badge">{link.badge}</span> : null}
                </NavLink>
              </div>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="user-avatar" style={user?.avatar ? { background: `url(${user.avatar}) center/cover`, color: 'transparent' } : {}}>
            {user?.avatar ? '' : (user?.fullname?.charAt(0).toUpperCase() || 'M')}
          </div>
          {!collapsed && (
            <div className="user-info">
              <span className="user-name">{user?.fullname || 'Maintainer'}</span>
              <span className="user-role">{user?.role === 'admin' ? 'Administrator' : 'Maintainer'}</span>
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
              <Link to={defaultPath} className="breadcrumb-item">Maintainer</Link>
              <ChevronRight size={14} className="breadcrumb-separator" />
              <span className="breadcrumb-current">{currentPage}</span>
            </nav>
          </div>
          <div className="topbar-actions">
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
