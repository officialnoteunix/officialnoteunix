import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getApiError } from '../../utils/constants';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

function GoogleIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

interface AuthContainerProps {
  initialView?: 'login' | 'register';
}

export default function AuthContainer({ initialView = 'login' }: AuthContainerProps) {
  const [view, setView] = useState(initialView);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwdLogin, setShowPwdLogin] = useState(false);
  const [showPwdReg, setShowPwdReg] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const user = await login(form.get('email') as string, form.get('password') as string);
      const redirect = searchParams.get('redirect');
      if (redirect) return navigate(redirect);
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.remaining) {
        const diff = new Date(data.remaining).getTime() - Date.now();
        if (diff > 0) {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          setError(`Account suspended — ${h > 0 ? `${h}h ${m}m` : `${m}m`} remaining`);
        } else {
          setError('Account suspended');
        }
      } else {
        setError(data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const password = form.get('password') as string;
    const confirm = form.get('confirmPassword') as string;
    if (password !== confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    try {
      const res = await register(
        form.get('fullname') as string,
        form.get('email') as string,
        password
      );
      const redirect = searchParams.get('redirect');
      if (redirect) return navigate(redirect);
      navigate('/user/dashboard');
    } catch (err: any) {
      setError(getApiError(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/auth/google`;
  };

  const switchView = (to: 'login' | 'register') => {
    setView(to);
    setError('');
    setShowPwdLogin(false);
    setShowPwdReg(false);
    setShowConfirm(false);
    window.history.pushState(null, '', `/${to}`);
  };

  const isSignUp = view === 'register';

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-container">
        <Link to="/" className={`auth-back-link${isSignUp ? ' auth-back-link-light' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back to home
        </Link>

        <div className="auth-form-wrapper">
          <div className={`auth-form-panel auth-panel-signup ${isSignUp ? 'active' : ''}`}>
            <div className="auth-form-scroll">
              <div className="auth-form-inner">
                <h1 className="auth-form-heading">Create Account</h1>

                <div className="auth-social-row">
                  <button onClick={handleGoogleLogin} className="auth-google-btn" disabled={loading}>
                    <GoogleIcon size={20} />
                    Sign up with Google
                  </button>
                </div>

                <p className="auth-social-divider">or continue with email</p>

                {error && (
                  <div className="auth-error" style={{ marginBottom: 16 }}>
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegister} className="auth-form">
                  <div className="auth-field">
                    <div className="auth-input-group">
                      <User size={16} />
                      <input name="fullname" type="text" className="auth-input" placeholder="Name" required />
                    </div>
                  </div>
                  <div className="auth-field">
                    <div className="auth-input-group">
                      <Mail size={16} />
                      <input name="email" type="email" className="auth-input" placeholder="Email" required />
                    </div>
                  </div>
                  <div className="auth-field">
                    <div className="auth-input-group">
                      <Lock size={16} />
                      <input name="password" type={showPwdReg ? 'text' : 'password'} className="auth-input" placeholder="Password" required minLength={6} />
                      <button type="button" className="auth-pwd-toggle" onClick={() => setShowPwdReg(!showPwdReg)} tabIndex={-1}>
                        {showPwdReg ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                                      <div className="auth-field">
                    <div className="auth-input-group">
                      <Lock size={16} />
                      <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} className="auth-input" placeholder="Confirm password" required />
                      <button type="button" className="auth-pwd-toggle" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="auth-submit-wrap">
                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                      {loading ? (
                        <span className="auth-loading">
                          <span className="auth-spinner" />
                          Creating...
                        </span>
                      ) : (
                        'Sign Up'
                      )}
                    </button>
                  </div>
                </form>

                <p className="auth-switch-text">
                  Already have an account?{' '}
                  <button type="button" onClick={() => switchView('login')} className="auth-switch-btn">Sign In</button>
                </p>
              </div>
            </div>
          </div>

          <div className={`auth-form-panel auth-panel-signin ${!isSignUp ? 'active' : ''}`}>
            <div className="auth-form-scroll">
              <div className="auth-form-inner">
                <h1 className="auth-form-heading">Sign In</h1>

                <div className="auth-social-row">
                  <button onClick={handleGoogleLogin} className="auth-google-btn" disabled={loading}>
                    <GoogleIcon size={20} />
                    Sign in with Google
                  </button>
                </div>

                <p className="auth-social-divider">or continue with email</p>

                {error && (
                  <div className="auth-error" style={{ marginBottom: 16 }}>
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="auth-form">
                  <div className="auth-field">
                    <div className="auth-input-group">
                      <Mail size={16} />
                      <input name="email" type="email" className="auth-input" placeholder="Email" required />
                    </div>
                  </div>
                  <div className="auth-field">
                    <div className="auth-input-group">
                      <Lock size={16} />
                      <input name="password" type={showPwdLogin ? 'text' : 'password'} className="auth-input" placeholder="Password" required />
                      <button type="button" className="auth-pwd-toggle" onClick={() => setShowPwdLogin(!showPwdLogin)} tabIndex={-1}>
                        {showPwdLogin ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="auth-forgot-wrap">
                    <span className="auth-forgot-link" style={{ opacity: 0.5, cursor: 'not-allowed' }}>Forget Your Password? (Coming Soon)</span>
                  </div>

                  <div className="auth-submit-wrap">
                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                      {loading ? (
                        <span className="auth-loading">
                          <span className="auth-spinner" />
                          Signing in...
                        </span>
                      ) : (
                        'Sign in'
                      )}
                    </button>
                  </div>
                </form>

                <p className="auth-switch-text">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => switchView('register')} className="auth-switch-btn">Sign Up</button>
                </p>
              </div>
            </div>
          </div>

          <div className={`auth-overlay ${isSignUp ? 'active' : ''}`}>
            <div className="auth-overlay-inner">
              <div className="auth-overlay-panel auth-overlay-left">
                <h2 className="auth-overlay-heading">Welcome Back!</h2>
                <p className="auth-overlay-text">
                  To keep connected with us please login with your personal info
                </p>
                <button onClick={() => switchView('login')} className="auth-overlay-btn">
                  Sign In
                </button>
              </div>
              <div className="auth-overlay-panel auth-overlay-right">
                <h2 className="auth-overlay-heading">Hello, Friend!</h2>
                <p className="auth-overlay-text">
                  Enter your personal details and start your journey with us
                </p>
                <button onClick={() => switchView('register')} className="auth-overlay-btn">
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
