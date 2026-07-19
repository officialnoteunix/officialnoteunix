import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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
      if (user && !user.banned) {
        req.user = user;
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

// Permission-based guard: admin always passes; maintainer must hold the required permission.
export function authorizePermission(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const allowed = requiredPermissions.every(p => req.user.hasPermission(p));
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action' });
    }
    next();
  };
}
