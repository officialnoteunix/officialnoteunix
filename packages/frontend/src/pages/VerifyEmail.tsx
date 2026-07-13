import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { getApiError } from '../utils/constants';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setMessage('Missing verification parameters.');
      return;
    }
    authApi.verifyEmail(token, email)
      .then(res => {
        const msg = res.data.message || 'Email verified successfully!';
        const alreadyVerified = msg.toLowerCase().includes('already verified');
        setStatus('success');
        setMessage(alreadyVerified ? 'Your email is already verified.' : msg);
      })
      .catch(err => { setStatus('error'); setMessage(getApiError(err, 'Verification failed.')); });
  }, [token, email]);

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.resendVerification(email);
      setMessage('New verification email sent!');
    } catch (err) {
      setMessage(getApiError(err, 'Failed to resend verification email.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
      <div>
        {status === 'loading' && <Loader2 size={48} className="spin" style={{ color: 'var(--primary)', marginBottom: 16 }} />}
        {status === 'success' && <CheckCircle size={48} style={{ color: 'var(--secondary)', marginBottom: 16 }} />}
        {status === 'error' && <XCircle size={48} style={{ color: 'var(--danger)', marginBottom: 16 }} />}
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          {status === 'loading' ? 'Verifying...' : status === 'success' ? 'Verified!' : 'Verification failed'}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{message}</p>
        {status === 'success' && (
          <Link to="/login" className="btn-rounded btn-primary" style={{ padding: '12px 32px', fontSize: 14, textDecoration: 'none' }}>
            Sign in
          </Link>
        )}
        {status === 'error' && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/" className="btn-rounded btn-ghost" style={{ padding: '12px 24px', fontSize: 14, textDecoration: 'none' }}>Go home</Link>
            {email && (
              <button
                className="btn-rounded btn-primary"
                style={{ padding: '12px 24px', fontSize: 14, border: 'none', cursor: 'pointer', opacity: resending ? 0.7 : 1 }}
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? 'Sending...' : 'Resend verification'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
