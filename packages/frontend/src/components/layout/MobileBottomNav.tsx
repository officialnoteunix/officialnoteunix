import { useRef, useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, BookOpen } from 'lucide-react';

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/notes', icon: Search, label: 'Browse' },
  { to: '/contact', icon: BookOpen, label: 'Contact' },
];

const PILL_WIDTH = 64;

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const [pillLeft, setPillLeft] = useState(0);

  const activeTabs = tabs;

  const getActiveIndex = () => {
    for (let i = activeTabs.length - 1; i >= 0; i--) {
      const tab = activeTabs[i];
      if (tab.to === '/' ? pathname === '/' : pathname.startsWith(tab.to)) {
        return i;
      }
    }
    return 0;
  };

  const activeIndex = getActiveIndex();

  const updatePill = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const items = nav.querySelectorAll<HTMLElement>('.mobile-bottom-nav-item');
    const activeItem = items[activeIndex];
    if (activeItem) {
      const navRect = nav.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const iconCenter = itemRect.left + itemRect.width / 2 - navRect.left;
      setPillLeft(iconCenter - PILL_WIDTH / 2);
    }
  }, [activeIndex]);

  useEffect(() => {
    updatePill();
    window.addEventListener('resize', updatePill);
    return () => window.removeEventListener('resize', updatePill);
  }, [updatePill, pathname]);

  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-bottom-nav-inner" ref={navRef}>
        <div
          className="mobile-bottom-nav-pill"
          style={{
            transform: `translateX(${pillLeft}px)`,
            width: PILL_WIDTH,
          }}
        />
        {activeTabs.map((tab, i) => {
          const Icon = tab.icon;
          const isActive = i === activeIndex;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
