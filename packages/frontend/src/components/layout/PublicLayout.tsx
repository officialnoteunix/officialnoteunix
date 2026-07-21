import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import AdMarquee from '../ad/AdMarquee';
import ScrollToTop from '../ui/ScrollToTop';
import BackToTop from '../ui/BackToTop';

export default function PublicLayout() {
  const { pathname } = useLocation();
  const isLanding = pathname === '/';
  const hideFooter = pathname === '/notes' || pathname.startsWith('/notes/') || pathname.startsWith('/subjects/');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ScrollToTop />
      <Header />
      {isLanding && <AdMarquee />}
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
      {!isLanding && !hideFooter && <Footer />}
      <MobileBottomNav />
      <BackToTop />
    </div>
  );
}
