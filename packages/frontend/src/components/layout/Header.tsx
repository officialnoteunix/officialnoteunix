import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Search, Menu, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from '../notification/NotificationBell';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
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
          <Link to="/contact" className={`nav-link ${isActive('/contact')}`} aria-current={pathname === '/contact' ? 'page' : undefined}>Contact</Link>
      </div>
      <div className="nav-actions">
        <Link to="/search" style={linkBtnStyle} aria-label="Search">
          <Search size={16} />
        </Link>
        <NotificationBell />
        <button
          onClick={toggleTheme}
          style={linkBtnStyle}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
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
      <button
        className="show-mobile nav-mobile-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-main)', padding: 4,
        }}
        aria-label="Toggle menu"
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      {menuOpen && (
        <div className="nav-mobile-drawer">
          <Link to="/" className={`nav-link ${isActive('/')}`} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/notes" className={`nav-link ${isActive('/notes')}`} onClick={() => setMenuOpen(false)}>Browse</Link>
          <Link to="/contact" className={`nav-link ${isActive('/contact')}`} onClick={() => setMenuOpen(false)}>Contact</Link>
          <div className="nav-actions">
            <Link to="/search" style={linkBtnStyle} aria-label="Search">
              <Search size={16} />
            </Link>
            <NotificationBell />
            <button
              onClick={toggleTheme}
              style={linkBtnStyle}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {user ? (
              <Link to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} className="btn-rounded btn-primary" style={{ padding: '8px 20px', fontSize: 13 }} onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
            ) : (
              <Link to="/register" className="btn-rounded btn-primary" style={{ padding: '8px 20px', fontSize: 13 }} onClick={() => setMenuOpen(false)}>
                Get Started
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}