import { Link } from 'react-router-dom';
import { ScrollText, ArrowLeft, ChevronRight } from 'lucide-react';

const sections = [
  {
    title: '1. Acceptance of Terms',
    text: 'By accessing or using NoteUniX ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform. We reserve the right to update these terms at any time, and continued use constitutes acceptance of any changes.',
  },
  {
    title: '2. Eligibility',
    text: 'NoteUniX is available to users aged 13 and older. By creating an account, you represent that you are at least 13 years old and have the legal capacity to enter into these terms. Users under 18 should have parental consent before using the Platform.',
  },
  {
    title: '3. User Accounts',
    text: 'You must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. One person may hold only one account. You must notify us immediately of any unauthorized use of your account.',
  },
  {
    title: '4. Content Guidelines',
    text: 'All uploaded notes must be your original work or properly attributed with appropriate citations. The following content is strictly prohibited: plagiarized material, copyrighted content without authorization, sexually explicit material, hate speech, harassment, malware, spam, or any content that violates applicable laws. Violations may result in immediate content removal and account suspension.',
  },
  {
    title: '5. Acceptable Use',
    text: 'You agree to use NoteUniX solely for educational purposes. You may not: attempt to gain unauthorized access to any part of the Platform; use automated systems or bots to access or scrape content; upload malicious files or code; impersonate another user or entity; interfere with or disrupt the Platform\'s infrastructure; use the Platform for commercial purposes without authorization; or engage in any activity that harms other users or the Platform.',
  },
  {
    title: '6. Intellectual Property',
    text: 'You retain full ownership of notes and content you upload to NoteUniX. By uploading content, you grant NoteUniX a non-exclusive, worldwide, royalty-free license to display, distribute, and make your content available to other users on the Platform. This license terminates when you delete your content, except for cached or archived copies.',
  },
  {
    title: '7. Content Moderation',
    text: 'All notes undergo admin review before publication. Admins reserve the right to approve, reject, request modifications, or remove any content at their sole discretion. Users may appeal moderation decisions through the Contact page or support channel. Repeated violations will result in permanent account termination.',
  },
  {
    title: '8. Downloads & Ratings',
    text: 'Users may download notes for personal, educational use only. Download counts and ratings are tracked to highlight quality content on the leaderboard. Manipulating download counts or ratings through automated means or multiple accounts is prohibited and will result in account suspension.',
  },
  {
    title: '9. Limitation of Liability',
    text: 'NoteUniX is provided "as is" without warranties of any kind. We are not responsible for: the accuracy, quality, or legality of user-uploaded content; any damages arising from use of the Platform; unavailability or interruption of service; or loss of data due to technical issues. Our total liability shall not exceed the amount you paid us (which is zero for free accounts).',
  },
  {
    title: '10. Termination',
    text: 'We reserve the right to suspend or terminate your account at any time for violations of these terms, with or without notice. You may delete your account at any time through your profile settings. Upon termination, your right to use the Platform ceases immediately. We may retain certain data as required by law or for legitimate business purposes.',
  },
  {
    title: '11. Dispute Resolution',
    text: 'Any disputes arising from these terms shall be governed by the laws of Nepal. We encourage users to contact us first to resolve any issues informally before pursuing formal dispute resolution.',
  },
  {
    title: '12. Contact',
    text: 'For questions about these Terms of Service, please contact us at official@noteunix.com or visit our Contact page.',
  },
];

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
