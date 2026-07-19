import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Search, User } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from '../notification/NotificationBell';
import { useAuth } from '../../context/AuthContext';
import SearchPopup from '../search/SearchPopup';

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => pathname === path ? 'active' : '';

  const linkBtnStyle = {
    background: 'var(--bg-subtle)', border: 'none', cursor: 'pointer',
    width: 36, height: 36, borderRadius: 'var(--radius-full)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-muted)',
  };

  return (
    <nav className="landing-nav">
      <Link to="/" className="logo-container">
        <span style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: 18 }}>Note</span>
        <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 18 }}>UniX</span>
      </Link>
      <div className="nav-center">
        <Link to="/" className={`nav-link ${isActive('/')}`} aria-current={pathname === '/' ? 'page' : undefined}>Home</Link>
        <Link to="/notes" className={`nav-link ${isActive('/notes')}`} aria-current={pathname === '/notes' ? 'page' : undefined}>Browse</Link>
        <Link to="/community" className={`nav-link ${isActive('/community')}`} aria-current={pathname.startsWith('/community') ? 'page' : undefined}>Community</Link>
        <Link to="/contact" className={`nav-link ${isActive('/contact')}`} aria-current={pathname === '/contact' ? 'page' : undefined}>Contact</Link>
      </div>
      <div className="nav-actions">
        <button onClick={() => setSearchOpen(true)} style={linkBtnStyle} aria-label="Search">
          <Search size={16} />
        </button>
        <button onClick={toggleTheme} style={linkBtnStyle} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <NotificationBell />
        {user ? (
          <Link to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} className="btn-rounded btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}>
            Dashboard
          </Link>
        ) : (
          <Link to="/register" className="btn-rounded btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}>
            Get Started
          </Link>
        )}
      </div>
      <div className="mobile-header-actions">
        <button className="mobile-theme-toggle" onClick={() => setSearchOpen(true)} aria-label="Search">
          <Search size={20} />
        </button>
        <button
          className="mobile-theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <Link
          to={user ? (user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard') : '/login'}
          className="mobile-theme-toggle"
          aria-label="Profile"
        >
          <User size={20} />
        </Link>
      </div>
      <SearchPopup open={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
}
