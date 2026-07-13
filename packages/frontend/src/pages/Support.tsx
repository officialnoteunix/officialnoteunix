import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft, ChevronRight, FileText, Flag, BookOpen, User, Shield } from 'lucide-react';

const faqs = [
  {
    q: 'How do I upload notes?',
    a: 'Log in, go to your dashboard, and click "Upload" in the sidebar. Fill in title, description, select hierarchy, and attach your PDF. An admin will review it before publication.',
    icon: <FileText size={18} />,
  },
  {
    q: 'How long does approval take?',
    a: 'Admins typically review notes within 24–48 hours. You\'ll be notified once approved or if changes are requested.',
    icon: <Flag size={18} />,
  },
  {
    q: 'Can I edit or delete notes?',
    a: 'Yes. Go to "My Notes" in your dashboard. You can edit title/description or delete notes. Editing is only available before approval.',
    icon: <BookOpen size={18} />,
  },
  {
    q: 'How do bookmarks work?',
    a: 'Click the bookmark icon on any note to save it. Access all saved notes from the "Bookmarks" section in your dashboard.',
    icon: <User size={18} />,
  },
  {
    q: 'Upload limits?',
    a: 'No limits. Upload as many notes as you\'d like to share with the community.',
    icon: <FileText size={18} />,
  },
  {
    q: 'How to report content?',
    a: 'Use the Report feature on any problematic note. Our moderation team will review it promptly.',
    icon: <Shield size={18} />,
  },
];

export default function Support() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <section style={{ flex: 1, padding: '100px 5% 60px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--radius-full)',
            background: 'var(--primary-light)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', marginBottom: 20,
          }}>
            <HelpCircle size={24} style={{ color: 'var(--primary)' }} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Support</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 40, maxWidth: 500, lineHeight: 1.6 }}>
            Frequently asked questions and helpful resources to get the most out of NoteUniX.
          </p>

          <div className="faq-grid">
            {faqs.map((faq, i) => {
              const isOpen = openIdx === i;
              return (
                <div key={i} className={`content-card faq-card ${isOpen ? 'faq-open' : ''}`} style={{
                  padding: 0, cursor: 'pointer', overflow: 'hidden',
                  transition: 'box-shadow 0.2s',
                  border: isOpen ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                }} onClick={() => setOpenIdx(isOpen ? null : i)}>
                  <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: 'var(--primary)', flexShrink: 0 }}>{faq.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, flex: 1, color: 'var(--text-main)' }}>{faq.q}</span>
                    <ChevronRight size={14} style={{
                      color: 'var(--text-light)', flexShrink: 0,
                      transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }} />
                  </div>
                  {isOpen && (
                    <div style={{
                      padding: '0 24px 20px 58px',
                      fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7,
                      borderTop: '1px solid var(--border-color)', paddingTop: 16, marginTop: 0,
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="content-card" style={{ padding: '28px 32px', textAlign: 'center', background: 'var(--primary)', border: 'none', marginTop: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Still need help?</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 20 }}>
              Reach out to our team and we'll get back to you as soon as possible.
            </p>
            <Link to="/contact" className="btn-rounded" style={{
              padding: '10px 24px', fontSize: 13, background: '#fff', color: 'var(--primary)',
              fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              Contact Us <ChevronRight size={14} />
            </Link>
          </div>
      </section>
    </div>
  );
}
