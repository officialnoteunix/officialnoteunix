import jwt from 'jsonwebtoken';
import User from '../models/User.js';

async function autoClearSuspension(user) {
  if (user.suspendedUntil && user.suspendedUntil <= new Date()) {
    user.banned = false;
    user.suspendedUntil = null;
    try {
      await user.save();
    } catch {
      // Non-critical — continue with in-memory state
    }
  }
}

export async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash -refreshTokenHash');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    await autoClearSuspension(user);
    if (user.banned) {
      return res.status(401).json({ success: false, message: 'User not found or banned' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (err.name === 'NotBeforeError') {
      return res.status(401).json({ success: false, message: 'Token not yet valid' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash -refreshTokenHash');
      if (user) {
        await autoClearSuspension(user);
        if (!user.banned) {
          req.user = user;
        }
      }
    }
  } catch {
    // ignore
  }
  next();
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
}
