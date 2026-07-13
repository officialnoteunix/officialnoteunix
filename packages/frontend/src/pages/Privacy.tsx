import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, ChevronRight } from 'lucide-react';

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              {
                title: 'Information We Collect',
                text: 'We collect information you provide when creating an account, including your name, email address, and educational institution. When you upload notes, we collect the content and metadata. We also collect usage data such as pages visited and interactions with the platform.'
              },
              {
                title: 'How We Use Your Information',
                text: 'Your information is used to provide and improve our note-sharing service, moderate content, communicate with you about platform updates, and ensure compliance with our Terms of Service.'
              },
              {
                title: 'Data Storage & Security',
                text: 'Your data is stored securely on our servers. We implement industry-standard security measures including encryption in transit and at rest. We retain your data for as long as your account is active.'
              },
              {
                title: 'Information Sharing',
                text: 'We do not sell your personal information. Your uploaded notes are shared publicly as part of the platform\'s purpose. Your email and personal details are never shared with third parties without your consent except as required by law.'
              },
              {
                title: 'Your Rights',
                text: 'You can access, update, or delete your account and personal data at any time through your profile settings. You can also contact us directly for data requests.'
              },
              {
                title: 'Cookies',
                text: 'We use essential cookies for authentication and platform functionality. We do not use tracking cookies or third-party analytics that collect personal data.'
              },
              {
                title: 'Contact',
                text: 'If you have questions about this policy, please reach out through our Contact page or email us at privacy@noteunix.com.'
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
