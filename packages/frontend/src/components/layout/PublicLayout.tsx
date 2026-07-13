import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import AdMarquee from '../ad/AdMarquee';

export default function PublicLayout() {
  const { pathname } = useLocation();
  const isLanding = pathname === '/';
  const hideFooter = pathname === '/notes' || pathname.startsWith('/notes/');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      {isLanding && <AdMarquee />}
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
      {!isLanding && !hideFooter && <Footer />}
    </div>
  );
}