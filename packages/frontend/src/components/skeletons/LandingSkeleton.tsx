import { Skeleton } from '../ui/Skeleton';
import '../ui/Skeleton';

export default function LandingSkeleton() {
  return (
    <div className="landing-container">
      <section className="landing-section hero-section" style={{ paddingTop: 100 }}>
        <div className="hero-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Skeleton width="80%" height={48} borderRadius={8} />
            <Skeleton width="55%" height={48} borderRadius={8} />
            <Skeleton className="skeleton-block" width="25%" height={4} borderRadius={2} style={{ marginTop: 4 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <Skeleton className="skeleton-block" width="100%" height={14} />
              <Skeleton className="skeleton-block" width="100%" height={14} />
              <Skeleton className="skeleton-block" width="70%" height={14} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <Skeleton width={160} height={46} borderRadius={50} />
              <Skeleton width={150} height={46} borderRadius={50} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Skeleton width={340} height={280} borderRadius="var(--radius-lg)" />
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Skeleton className="skeleton-block" width={100} height={12} borderRadius={4} />
            <Skeleton className="skeleton-block" width={260} height={28} borderRadius={6} />
            <Skeleton className="skeleton-block" width={48} height={3} borderRadius={2} />
            <Skeleton className="skeleton-block" width={360} height={14} borderRadius={4} />
          </div>
          <div className="steps-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="step-card" style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Skeleton className="skeleton-circle" width={52} height={52} />
                <Skeleton className="skeleton-block" width={100} height={18} borderRadius={4} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}>
                  <Skeleton className="skeleton-block" width="85%" height={12} />
                  <Skeleton className="skeleton-block" width="70%" height={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Skeleton className="skeleton-block" width={120} height={12} borderRadius={4} />
            <Skeleton className="skeleton-block" width={380} height={28} borderRadius={6} />
          </div>
          <div className="features-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`feature-card ${i === 1 || i === 4 ? 'feature-wide' : ''}`}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Skeleton className="skeleton-circle" width={36} height={36} />
                <Skeleton className="skeleton-block" width="60%" height={16} borderRadius={4} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton className="skeleton-block" width="100%" height={11} />
                  <Skeleton className="skeleton-block" width="80%" height={11} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 5%', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          maxWidth: 800, width: '100%', borderRadius: 'var(--radius-lg)',
          padding: 'clamp(40px, 8vw, 64px) clamp(24px, 5vw, 48px)',
          background: 'var(--bg-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        }}>
          <Skeleton className="skeleton-block" width="60%" height={28} borderRadius={6} />
          <Skeleton className="skeleton-block" width="45%" height={14} borderRadius={4} />
          <Skeleton width={180} height={48} borderRadius={50} style={{ marginTop: 8 }} />
        </div>
      </section>

      <div className="site-footer" style={{ padding: '64px 5%' }}>
        <div className="footer-inner">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton width={140} height={24} borderRadius={6} />
            <Skeleton className="skeleton-block" width="80%" height={12} />
            <Skeleton className="skeleton-block" width="60%" height={12} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton width={80} height={14} borderRadius={4} />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="skeleton-block" width={90} height={12} />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton width={80} height={14} borderRadius={4} />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="skeleton-block" width={90} height={12} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
