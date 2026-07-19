import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { DEFAULT_MAINTAINER_PERMISSIONS, ADMIN_ONLY_PERMISSIONS, ROLES } from '../utils/constants.js';

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, default: '' },
  role: { type: String, enum: ['student', 'maintainer', 'admin'], default: 'student' },
  permissions: {
    type: [String],
    default: undefined,
    validate: {
      validator: function (vals) {
        if (!Array.isArray(vals)) return true;
        return vals.every(v => !ADMIN_ONLY_PERMISSIONS.includes(v));
      },
      message: 'Maintainer permissions cannot include admin-only permissions',
    },
  },
  avatar: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  banned: { type: Boolean, default: false },
  suspendedUntil: { type: Date, default: null },
  refreshTokenHash: { type: String, default: null },
  refreshTokenPrefix: { type: String, default: null, index: true },
  resetTokenHash: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  emailVerified: { type: Boolean, default: false },
  emailVerifyToken: { type: String, default: null },
  emailVerifyExpiry: { type: Date, default: null },
  username: { type: String, unique: true, sparse: true, lowercase: true, trim: true, match: /^[a-z0-9_]{3,20}$/ },
  bio: { type: String, default: '', maxlength: 160 },
  followersCount: { type: Number, default: 0, min: 0 },
  followingCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    fullname: this.fullname,
    email: this.email,
    role: this.role,
    permissions: this.permissions || [],
    avatar: this.avatar,
    isVerified: this.isVerified,
    banned: this.banned,
    suspendedUntil: this.suspendedUntil,
    emailVerified: this.emailVerified,
    username: this.username || null,
    bio: this.bio || '',
    followersCount: this.followersCount || 0,
    followingCount: this.followingCount || 0,
    createdAt: this.createdAt,
  };
};

// Admins implicitly hold every permission. Maintainers hold only what is assigned.
userSchema.methods.hasPermission = function (permission) {
  if (this.role === ROLES.ADMIN) return true;
  if (this.role === ROLES.STUDENT) return false;
  const perms = this.permissions || [];
  return perms.includes(permission);
};

userSchema.methods.clearSuspension = function () {
  if (this.suspendedUntil && this.suspendedUntil <= new Date()) {
    this.banned = false;
    this.suspendedUntil = null;
    return true;
  }
  return false;
};

export default mongoose.model('User', userSchema);
