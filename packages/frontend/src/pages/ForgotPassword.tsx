import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { getApiError } from '../utils/constants';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(getApiError(err, 'Something went wrong. Try again later.'));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Mail size={28} style={{ color: 'var(--primary)' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Check your email</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            If an account exists for <strong>{email}</strong>, we've sent a password reset link.
          </p>
          <Link to="/login" className="btn-rounded btn-primary" style={{ padding: '12px 32px', fontSize: 14, textDecoration: 'none' }}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginBottom: 32, textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to login
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Reset password</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
          Enter your email and we'll send you a reset link.
        </p>
        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-subtle)' }}>
              <Mail size={16} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
              <input type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: 14, fontFamily: 'inherit' }} />
            </div>
          </div>
          <button type="submit" className="btn-rounded btn-primary" style={{ padding: '12px 32px', fontSize: 14, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} disabled={loading}>
            {loading ? <Loader2 size={16} className="spin" /> : <Mail size={16} />}
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  );
}
