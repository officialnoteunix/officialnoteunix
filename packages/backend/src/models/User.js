import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, default: '' },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
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
    avatar: this.avatar,
    isVerified: this.isVerified,
    banned: this.banned,
    suspendedUntil: this.suspendedUntil,
    emailVerified: this.emailVerified,
    createdAt: this.createdAt,
  };
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
