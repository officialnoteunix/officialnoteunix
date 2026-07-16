import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, ChevronRight } from 'lucide-react';

const sections = [
  {
    title: '1. Introduction',
    text: 'NoteUniX ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our note-sharing platform. By using NoteUniX, you consent to the practices described in this policy.',
  },
  {
    title: '2. Information We Collect',
    text: 'We collect information you provide directly: your name, email address, educational institution, and profile details when you create an account. When you upload notes, we store the files and associated metadata (title, description, subject, tags). We also automatically collect usage data such as pages visited, search queries, downloads, and device/browser information for platform improvement.',
  },
  {
    title: '3. How We Use Your Information',
    text: 'We use your information to: provide and maintain the NoteUniX platform; personalize your experience and deliver relevant content; process note uploads and manage the approval workflow; send notifications about your uploads, bookmarks, and platform updates; monitor and analyze usage patterns to improve the platform; detect and prevent fraud, spam, and abuse; and communicate with you about your account or support requests.',
  },
  {
    title: '4. Note Sharing & Public Content',
    text: 'Notes you upload are shared publicly on the platform as part of NoteUniX\'s core mission. Your name and profile information are displayed alongside your uploaded notes. Other users can download, rate, and bookmark your notes. You retain ownership of your content but grant NoteUniX a non-exclusive license to display and distribute it on the platform.',
  },
  {
    title: '5. Data Storage & Security',
    text: 'Your data is stored on secure servers with industry-standard encryption (TLS in transit, AES-256 at rest). We implement access controls, regular security audits, and monitoring to protect your information. While we take every reasonable precaution, no method of transmission or storage is 100% secure. We retain your data for as long as your account is active or as needed to provide services.',
  },
  {
    title: '6. Information Sharing',
    text: 'We do not sell your personal information. We may share data only: with your explicit consent; as required by law or legal process; to protect the rights, safety, or property of NoteUniX, our users, or the public; or with trusted service providers who assist in platform operations (hosting, email delivery) under strict confidentiality agreements.',
  },
  {
    title: '7. Cookies & Tracking',
    text: 'NoteUniX uses essential cookies for authentication, session management, and platform functionality. We do not use third-party tracking cookies or advertising networks. We may use minimal analytics to understand platform usage patterns, but this data is aggregated and does not identify individual users.',
  },
  {
    title: '8. Your Rights',
    text: 'You have the right to: access and download your personal data; update or correct your information through profile settings; delete your account and associated data; opt out of non-essential communications; and request a copy of all data we hold about you. To exercise these rights, visit your Settings page or contact us directly.',
  },
  {
    title: '9. Children\'s Privacy',
    text: 'NoteUniX is intended for users aged 13 and older. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will take steps to delete it promptly.',
  },
  {
    title: '10. Changes to This Policy',
    text: 'We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the updated policy on this page with a revised "Last updated" date. Continued use of NoteUniX after changes constitutes acceptance of the updated policy.',
  },
  {
    title: '11. Contact Us',
    text: 'If you have questions about this Privacy Policy or our data practices, please contact us at official@noteunix.com or visit our Contact page.',
  },
];

export default function Privacy() {
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <section style={{ flex: 1, padding: '100px 5% 60px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <div style={{
          width: 56, height: 56, borderRadius: 'var(--radius-full)',
          background: 'var(--primary-light)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: 20,
        }}>
          <Shield size={24} style={{ color: 'var(--primary)' }} />
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>Last updated: July 2026</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {sections.map((section, i) => (
            <div key={i} className="content-card" style={{ padding: '22px 26px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ChevronRight size={14} style={{ color: 'var(--primary)' }} /> {section.title}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.75 }}>{section.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
