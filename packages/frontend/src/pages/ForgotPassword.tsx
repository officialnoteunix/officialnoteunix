import { Link } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginBottom: 32, textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to login
        </Link>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Lock size={28} style={{ color: 'var(--primary)' }} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Coming Soon</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Password reset functionality is under development. Please contact support if you need help accessing your account.
        </p>
        <Link to="/login" className="btn-rounded btn-primary" style={{ padding: '12px 32px', fontSize: 14, textDecoration: 'none' }}>
          Back to Login
        </Link>
      </div>
    </div>
  );
}
