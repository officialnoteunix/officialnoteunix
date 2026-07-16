import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft, ChevronRight, FileText, Flag, BookOpen, User, Shield, Upload, MessageSquare, Star, Search, Mail } from 'lucide-react';

const faqSections = [
  {
    title: 'Getting Started',
    icon: <BookOpen size={16} />,
    items: [
      {
        q: 'What is NoteUniX?',
        a: 'NoteUniX is a free, community-driven platform for Nepali university students to share and discover study notes. Notes are organized by university, course, semester, and subject so you can find exactly what you need.',
        icon: <BookOpen size={18} />,
      },
      {
        q: 'Do I need an account to browse notes?',
        a: 'No. Anyone can browse and read notes without an account. You\'ll need a free account to upload notes, bookmark favorites, rate content, or leave comments.',
        icon: <User size={18} />,
      },
      {
        q: 'How do I create an account?',
        a: 'Click "Get Started" on the homepage. You can sign up with your email and password, or use Google OAuth for one-click registration. Verify your email to unlock all features.',
        icon: <User size={18} />,
      },
    ],
  },
  {
    title: 'Browsing & Searching',
    icon: <Search size={16} />,
    items: [
      {
        q: 'How do I find notes for my subject?',
        a: 'Use the Browse page to drill down: University → Course → Semester → Subject. You can also use the search bar to find notes by title, subject name, or keyword across the entire platform.',
        icon: <Search size={18} />,
      },
      {
        q: 'What file types are supported?',
        a: 'NoteUniX supports PDFs, Word documents, PowerPoint presentations, images, and other document formats. Notes are displayed with a file-type preview so you know what you\'re downloading.',
        icon: <FileText size={18} />,
      },
      {
        q: 'How do ratings work?',
        a: 'After reading a note, you can rate it from 1 to 5 stars. Ratings help other students find the highest-quality notes. The leaderboard showcases the top-rated content.',
        icon: <Star size={18} />,
      },
    ],
  },
  {
    title: 'Uploading & Sharing',
    icon: <Upload size={16} />,
    items: [
      {
        q: 'How do I upload notes?',
        a: 'Log in, go to your dashboard, and click "Upload" in the sidebar. Fill in the title, description, select the hierarchy (university, course, semester, subject), attach your file, and submit. An admin will review it before publication.',
        icon: <Upload size={18} />,
      },
      {
        q: 'How long does approval take?',
        a: 'Admins typically review notes within 24–48 hours. You\'ll receive a notification once your note is approved or if changes are requested.',
        icon: <Flag size={18} />,
      },
      {
        q: 'Can I edit or delete my notes?',
        a: 'Yes. Go to "My Notes" in your dashboard. You can edit the title and description, or delete notes entirely. Editing is only available while the note is pending approval.',
        icon: <FileText size={18} />,
      },
      {
        q: 'Are there upload limits?',
        a: 'No. Upload as many notes as you\'d like to share with the community. There are no restrictions on the number of uploads.',
        icon: <Upload size={18} />,
      },
    ],
  },
  {
    title: 'Community & Safety',
    icon: <Shield size={16} />,
    items: [
      {
        q: 'How do bookmarks work?',
        a: 'Click the bookmark icon on any note to save it for quick access. View all your saved notes from the "Bookmarks" section in your dashboard.',
        icon: <User size={18} />,
      },
      {
        q: 'How do I report inappropriate content?',
        a: 'Use the Report button on any note page. Select a reason (spam, plagiarism, inappropriate, wrong subject) and our moderation team will review it promptly.',
        icon: <Flag size={18} />,
      },
      {
        q: 'How do comments work?',
        a: 'You can leave comments and questions on any note page. Comments support nested replies for threaded discussions. Be respectful and helpful.',
        icon: <MessageSquare size={18} />,
      },
      {
        q: 'What about content quality?',
        a: 'All notes go through admin approval before being published. The community can also rate notes, and the leaderboard highlights the best content. Report any low-quality or problematic notes.',
        icon: <Shield size={18} />,
      },
    ],
  },
];

export default function Support() {
  const [openIdx, setOpenIdx] = useState<string | null>(null);

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
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Help & FAQ</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 40, maxWidth: 560, lineHeight: 1.6 }}>
          Everything you need to know about using NoteUniX. Can't find your answer? Reach out to our support team.
        </p>

        {faqSections.map((section, si) => (
          <div key={si} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ color: 'var(--primary)' }}>{section.icon}</span>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>{section.title}</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {section.items.map((faq, i) => {
                const key = `${si}-${i}`;
                const isOpen = openIdx === key;
                return (
                  <div key={i} className="content-card" style={{
                    padding: 0, cursor: 'pointer', overflow: 'hidden',
                    transition: 'box-shadow 0.2s',
                    border: isOpen ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  }} onClick={() => setOpenIdx(isOpen ? null : key)}>
                    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
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
                        padding: '0 20px 16px 50px',
                        fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7,
                        borderTop: '1px solid var(--border-color)', paddingTop: 14, marginTop: 0,
                      }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="content-card" style={{ padding: '28px 32px', textAlign: 'center', background: 'var(--primary)', border: 'none', marginTop: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Still need help?</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 20 }}>
            Our team is here to help. Reach out and we'll get back to you as soon as possible.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contact" className="btn-rounded" style={{
              padding: '10px 24px', fontSize: 13, background: '#fff', color: 'var(--primary)',
              fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <Mail size={14} /> Contact Us
            </Link>
            <a href="mailto:official@noteunix.com" className="btn-rounded" style={{
              padding: '10px 24px', fontSize: 13, background: 'rgba(255,255,255,0.15)', color: '#fff',
              fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid rgba(255,255,255,0.3)',
            }}>
              <Mail size={14} /> Email Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
