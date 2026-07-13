import { Link } from 'react-router-dom';
import { ScrollText, ArrowLeft, ChevronRight } from 'lucide-react';

export default function Terms() {
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
            <ScrollText size={24} style={{ color: 'var(--primary)' }} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Terms of Service</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>Last updated: July 2026</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              {
                title: 'Acceptance of Terms',
                text: 'By accessing NoteUniX, you agree to these terms. If you do not agree, please do not use the platform. We reserve the right to update these terms with notice to users.'
              },
              {
                title: 'User Accounts',
                text: 'You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your login credentials. One person may hold only one account.'
              },
              {
                title: 'Content Guidelines',
                text: 'All uploaded notes must be your own original work or properly attributed. Plagiarism, copyrighted material without permission, and inappropriate content are strictly prohibited and will result in account suspension.'
              },
              {
                title: 'Acceptable Use',
                text: 'You agree to use NoteUniX for educational purposes only. You may not spam, harass others, attempt to breach security, upload malicious content, or use the platform for commercial purposes without authorization.'
              },
              {
                title: 'Content Moderation',
                text: 'Admins reserve the right to review, approve, reject, or remove any content at their discretion. Users may appeal moderation decisions through the support channel.'
              },
              {
                title: 'Intellectual Property',
                text: 'You retain ownership of notes you upload. By uploading, you grant NoteUniX a license to display and distribute your content on the platform. You represent that you have the rights to share the content.'
              },
              {
                title: 'Limitation of Liability',
                text: 'NoteUniX provides the platform as-is. We are not responsible for the accuracy of user-uploaded content or for any damages arising from platform use.'
              },
              {
                title: 'Termination',
                text: 'We reserve the right to suspend or terminate accounts that violate these terms. Users may delete their accounts at any time through profile settings.'
              },
            ].map((section, i) => (
              <div key={i} className="content-card" style={{ padding: '24px 28px' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ChevronRight size={14} style={{ color: 'var(--primary)' }} /> {section.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>{section.text}</p>
              </div>
            ))}
          </div>
      </section>
    </div>
  );
}
