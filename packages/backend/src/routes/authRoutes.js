import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import { setAuthCookies, clearAuthCookies } from '../utils/cookies.js';
import { sendWelcomeEmail, sendResetEmail, sendPasswordChangedEmail, sendVerificationEmail, getEmailRetryInfo } from '../config/email.js';
import passport from 'passport';

const router = Router();

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { fullname, email, password } = req.validatedBody;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      fullname, email, passwordHash,
      emailVerifyToken: crypto.createHash('sha256').update(verifyToken).digest('hex'),
      emailVerifyExpiry: new Date(Date.now() + 1 * 60 * 60 * 1000),
    });
    await Notification.create({
      userId: user._id,
      type: 'welcome',
      title: 'Welcome to NoteUniX!',
      message: 'Check your email to verify your account.',
      link: '/user/dashboard',
    });
    const verifyUrl = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/verify-email?token=${verifyToken}&email=${encodeURIComponent(email)}`;
    let emailSent = true;
    let emailRetryHours = null;
    try {
      const result = await sendVerificationEmail(email, verifyUrl, fullname);
      if (result && !result.success) {
        emailSent = false;
        emailRetryHours = result.retryHours || null;
      }
    } catch (err) {
      console.warn(`[AUTH] Verification email failed for ${email}:`, err.message);
      emailSent = false;
      const retry = getEmailRetryInfo();
      emailRetryHours = retry.hours;
    }
    const accessToken = generateAccessToken(user);
    const { token: refreshToken, prefix: refreshTokenPrefix } = generateRefreshToken();
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenPrefix = refreshTokenPrefix;
    await user.save();
    setAuthCookies(res, accessToken, refreshToken);
    const response = { success: true, data: { user: user.toPublicJSON() } };
    if (!emailSent) {
      response.emailWarning = { message: 'Email service is temporarily unavailable. You can still use your account but please verify your email later.', retryHours: emailRetryHours };
    }
    res.status(201).json(response);
  } catch (err) { next(err); }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "This email isn't registered" });
    }
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }
    const cleared = user.clearSuspension();
    if (user.banned && !cleared) {
      const suspended = user.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now();
      const remaining = suspended ? user.suspendedUntil.toISOString() : null;
      return res.status(403).json({ success: false, message: suspended ? 'Account is suspended' : 'Account has been banned permanently', remaining });
    }
    const accessToken = generateAccessToken(user);
    const { token: refreshToken, prefix: refreshTokenPrefix } = generateRefreshToken();
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenPrefix = refreshTokenPrefix;
    await user.save();
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ success: true, data: { user: user.toPublicJSON() } });
  } catch (err) { next(err); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (!rawToken) return res.status(401).json({ success: false, message: 'Refresh token required' });

    const prefix = rawToken.substring(0, 16);
    const matchedUser = await User.findOne({ refreshTokenPrefix: prefix });
    if (!matchedUser || !matchedUser.refreshTokenHash) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const valid = await bcrypt.compare(rawToken, matchedUser.refreshTokenHash);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid refresh token' });

    const cleared = matchedUser.clearSuspension();
    if (matchedUser.banned && !cleared) {
      const suspended = matchedUser.suspendedUntil && new Date(matchedUser.suspendedUntil).getTime() > Date.now();
      return res.status(403).json({ success: false, message: suspended ? 'Account is suspended' : 'Account has been banned permanently', remaining: suspended ? matchedUser.suspendedUntil.toISOString() : null });
    }

    const accessToken = generateAccessToken(matchedUser);
    const { token: newRefreshToken, prefix: newPrefix } = generateRefreshToken();
    matchedUser.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    matchedUser.refreshTokenPrefix = newPrefix;
    await matchedUser.save();

    setAuthCookies(res, accessToken, newRefreshToken);
    res.json({ success: true, message: 'Token refreshed' });
  } catch (err) { next(err); }
});

router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshTokenHash = null;
      user.refreshTokenPrefix = null;
      await user.save();
    }
    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
});

router.get('/verify-email', async (req, res, next) => {
  try {
    const { token, email } = req.query;
    if (!token || !email) {
      return res.status(400).json({ success: false, message: 'Token and email required' });
    }
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ email, emailVerifyToken: hashedToken });
    if (!user) {
      const alreadyVerified = await User.findOne({ email, emailVerified: true });
      if (alreadyVerified) {
        return res.json({ success: true, message: 'Email already verified' });
      }
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });
    }
    if (user.emailVerified) {
      return res.json({ success: true, message: 'Email already verified' });
    }
    if (!user.emailVerifyExpiry || user.emailVerifyExpiry <= new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });
    }
    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpiry = undefined;
    await user.save();
    try { await sendWelcomeEmail(email, user.fullname); } catch (err) {
      console.warn(`[AUTH] Welcome email failed for ${email}:`, err.message);
    }
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) { next(err); }
});

router.post('/resend-verification', async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Email verification is not yet available.' });
});

router.post('/forgot-password', async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Password reset is not yet available. Coming soon.' });
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const { email } = req.query;
    if (!token || !email || !password) {
      return res.status(400).json({ success: false, message: 'token, email, and password required' });
    }
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      email,
      resetTokenHash: hashedToken,
      resetTokenExpiry: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetTokenHash = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    try { await sendPasswordChangedEmail(email); } catch {
      console.warn(`[AUTH] Password changed email failed for ${email}`);
    }
    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) { next(err); }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, data: req.user.toPublicJSON() });
});

const isGoogleConfigured = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

router.get('/google', (req, res, next) => {
  if (!isGoogleConfigured()) return res.status(501).json({ success: false, message: 'Google OAuth not configured' });
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

router.get('/google/callback',
  (req, res, next) => {
    if (!isGoogleConfigured()) return res.status(501).json({ success: false, message: 'Google OAuth not configured' });
    passport.authenticate('google', { session: false, failureRedirect: '/login' })(req, res, next);
  },
  async (req, res, next) => {
    try {
      const user = req.user;
      const accessToken = generateAccessToken(user);
      const { token: refreshToken, prefix: refreshTokenPrefix } = generateRefreshToken();
      user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      user.refreshTokenPrefix = refreshTokenPrefix;
      await user.save();

      setAuthCookies(res, accessToken, refreshToken);
      let frontendUrl = process.env.NODE_ENV === 'production'
        ? (process.env.BACKEND_URL || 'http://localhost:5000')
        : (process.env.CORS_ORIGIN || 'http://localhost:5173');
      frontendUrl = frontendUrl.replace(/\/api\/?$/, '');
      const redirectUrl = `${frontendUrl}/user/dashboard`;
      res.send(`<!DOCTYPE html><html><head><title>Signing you in...</title><meta http-equiv="refresh" content="0;url=${redirectUrl}"></head><body><p>Redirecting...</p></body></html>`);
    } catch (err) { next(err); }
  }
);

export default router;
