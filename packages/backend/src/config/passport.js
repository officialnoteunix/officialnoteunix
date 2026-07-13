import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export default function configurePassport() {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/api/auth/google/callback`,
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails?.[0]?.value });
        if (!user) {
          user = await User.create({
            fullname: profile.displayName,
            email: profile.emails?.[0]?.value,
            avatar: profile.photos?.[0]?.value || null,
            passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
            emailVerified: true,
          });
        } else if (!user.emailVerified) {
          user.emailVerified = true;
          await user.save();
        }
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }));
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
}
