import { Link } from 'react-router-dom';
import { ChevronRight, BookOpen, Search, BookmarkPlus, Moon, Layers, ShieldCheck } from 'lucide-react';
import Footer from '../components/layout/Footer';
import HeroIllustration from '../components/ui/HeroIllustration';
import AdSlot from '../components/ad/AdSlot';
import SEO from '../components/seo/SEO';

const features = [
  {
    icon: <Layers />,
    title: 'University Hierarchy',
    desc: 'Notes organized by university → course → semester → subject. Always know where you are.',
  },
  {
    icon: <ShieldCheck />,
    title: 'Approval System',
    desc: 'Admins review notes before publication. Quality assured content, no spam.',
  },
  {
    icon: <BookmarkPlus />,
    title: 'Bookmarks',
    desc: 'Save notes for later. Build your personal study library.',
  },
  {
    icon: <Moon />,
    title: 'Dark Mode',
    desc: 'Late night studying? Toggle dark mode for comfortable reading.',
  },
];

export default function Landing() {
  return (
    <div className="landing-container">
      <SEO title="Home" description="Share and download study notes for university courses in Nepal. Browse notes by university, course, semester, and subject." />
      <section className="landing-section hero-section" style={{ paddingTop: 40 }}>
        <div className="hero-grid">
          <div>
            <h1 style={{ fontSize: 'clamp(36px, 5vw, 54px)', lineHeight: 1.15, fontWeight: 900, marginBottom: 16 }}>
              Share & Discover <br />
              <span style={{ color: 'var(--primary)' }}>Academic Notes</span>
            </h1>
            <div style={{ width: 60, height: 4, backgroundColor: 'var(--primary)', borderRadius: 2, marginBottom: 20 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
              Browse thousands of notes organized by university, course, semester, and subject. Upload your own, bookmark favorites, and help fellow students succeed.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/register" className="btn-rounded btn-primary" style={{ padding: '14px 32px', fontSize: 14 }}>
                Start Sharing <ChevronRight size={16} />
              </Link>
              <Link to="/notes" className="btn-rounded btn-outline" style={{ padding: '14px 32px', fontSize: 14, border: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                Browse Notes
              </Link>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <HeroIllustration />
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              color: 'var(--text-muted)', fontSize: 12, fontWeight: 600,
              letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16,
            }}>
              How It Works
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>
              Three simple <span style={{ color: 'var(--primary)' }}>steps</span>
            </h2>
            <div style={{ width: 48, height: 3, backgroundColor: 'var(--primary)', borderRadius: 2, margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
              From finding notes to sharing your own — it's that easy.
            </p>
          </div>
          <div className="steps-grid">
            {[
              { step: '1', icon: <Search />, title: 'Browse', text: 'Explore notes by university, course, semester, and subject. Find exactly what you need.' },
              { step: '2', icon: <BookOpen />, title: 'Learn', text: 'Read and download PDF notes. Bookmark your favorites for quick access later.' },
              { step: '3', icon: <BookmarkPlus />, title: 'Share', text: 'Upload your own notes to help classmates. Every contribution makes a difference.' },
            ].map((item, i) => (
              <div key={i} className="step-card">
                <span className="step-number">{item.step}</span>
                <div className="step-icon">{item.icon}</div>
                <h3 className="step-title">{item.title}</h3>
                <p className="step-text">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              color: 'var(--text-muted)', fontSize: 12, fontWeight: 600,
              letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16,
            }}>
              Why NoteUniX
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>
              Built for Nepali students, <span style={{ color: 'var(--primary)' }}>by students</span>
            </h2>
          </div>

          <div className="features-grid">
            {features.map((item, i) => (
              <div key={i} className={`feature-card ${i === 0 || i === 3 ? 'feature-wide' : ''}`}>
                <div className="feature-icon">{item.icon}</div>
                <h3 className="feature-title">{item.title}</h3>
                <p className="feature-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AdSlot slot="in_content" />

      <section style={{ padding: '80px 5%', textAlign: 'center' }}>
        <div style={{
          maxWidth: 800, margin: '0 auto',
          background: 'var(--primary)', borderRadius: 'var(--radius-lg)',
          padding: '64px 48px',
        }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
            Ready to share your notes?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.6 }}>
            Join students from TU, KU, Pokhara University and more. Share your knowledge.
          </p>
          <Link to="/register" className="btn-rounded btn-cta">
            Get Started Free <ChevronRight size={16} />
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}