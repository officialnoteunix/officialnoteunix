import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { getApiError } from '../utils/constants';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'email_unavailable'>('loading');
  const [message, setMessage] = useState('');
  const [retryHours, setRetryHours] = useState<number | null>(null);
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
      .catch(err => {
        const errData = err.response?.data;
        if (err.response?.status === 503 && errData?.retryHours) {
          setStatus('email_unavailable');
          setMessage(errData.message || 'Email service is temporarily unavailable.');
          setRetryHours(errData.retryHours);
        } else {
          setStatus('error');
          setMessage(getApiError(err, 'Verification failed.'));
        }
      });
  }, [token, email]);

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.resendVerification(email);
      setMessage('New verification email sent!');
      setStatus('success');
    } catch (err: any) {
      const errData = err.response?.data;
      if (err.response?.status === 503 && errData?.retryHours) {
        setStatus('email_unavailable');
        setMessage(errData.message || 'Email service is temporarily unavailable.');
        setRetryHours(errData.retryHours);
      } else {
        setMessage(getApiError(err, 'Failed to resend verification email.'));
      }
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
        {status === 'email_unavailable' && <Clock size={48} style={{ color: 'var(--warning)', marginBottom: 16 }} />}
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          {status === 'loading' ? 'Verifying...'
            : status === 'success' ? 'Verified!'
            : status === 'email_unavailable' ? 'Email temporarily unavailable'
            : 'Verification failed'}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px', fontSize: 14, lineHeight: 1.6 }}>{message}</p>
        {status === 'email_unavailable' && retryHours && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, background: 'var(--warning-light)', padding: '10px 16px', borderRadius: 'var(--radius-sm)' }}>
            Please try again in about {retryHours} hour{retryHours > 1 ? 's' : ''}.
          </p>
        )}
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
        {status === 'email_unavailable' && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/" className="btn-rounded btn-ghost" style={{ padding: '12px 24px', fontSize: 14, textDecoration: 'none' }}>Go home</Link>
            <button
              className="btn-rounded btn-primary"
              style={{ padding: '12px 24px', fontSize: 14, border: 'none', cursor: 'pointer', opacity: resending ? 0.7 : 1 }}
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? 'Sending...' : 'Try again'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
