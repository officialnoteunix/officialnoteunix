import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { Lock, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token, email, password);
      showToast('success', 'Password reset successfully');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed. The link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Invalid reset link</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>This link is missing required parameters.</p>
          <Link to="/forgot-password" className="btn-rounded btn-primary" style={{ padding: '12px 32px', fontSize: 14, textDecoration: 'none' }}>
            Request a new link
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
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Set new password</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
          Enter your new password for <strong>{email}</strong>.
        </p>
        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-subtle)' }}>
              <Lock size={16} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
              <input type={showPwd ? 'text' : 'password'} placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: 14, fontFamily: 'inherit' }} />
              <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: 0 }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-subtle)' }}>
              <Lock size={16} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
              <input type={showPwd ? 'text' : 'password'} placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6}
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: 14, fontFamily: 'inherit' }} />
            </div>
          </div>
          <button type="submit" className="btn-rounded btn-primary" style={{ padding: '12px 32px', fontSize: 14, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} disabled={loading}>
            {loading ? <Loader2 size={16} className="spin" /> : <Lock size={16} />}
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}
