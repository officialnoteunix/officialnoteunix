import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

export function generateRefreshToken() {
  const token = crypto.randomBytes(40).toString('hex');
  const prefix = token.substring(0, 16);
  return { token, prefix };
}
