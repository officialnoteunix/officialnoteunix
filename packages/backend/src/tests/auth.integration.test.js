import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import User from '../models/User.js';
import authRoutes from '../routes/authRoutes.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/noteunix_test';

let server;
let baseUrl;

before(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
  }
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  server = app.listen(0);
  await new Promise(r => server.on('listening', r));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(async () => {
  await User.deleteMany({});
  await mongoose.disconnect();
  server.close();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('POST /api/auth/register', () => {
  it('registers a new user', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname: 'Test User', email: 'test@example.com', password: 'pass123' }),
    });
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.user.email, 'test@example.com');
    assert.strictEqual(body.data.user.fullname, 'Test User');
  });

  it('rejects duplicate email', async () => {
    await User.create({ fullname: 'Existing', email: 'test@example.com', passwordHash: 'hash' });
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname: 'Test', email: 'test@example.com', password: 'pass123' }),
    });
    assert.strictEqual(res.status, 409);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  it('rejects invalid email format', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname: 'Test', email: 'not-email', password: 'pass123' }),
    });
    assert.strictEqual(res.status, 400);
  });

  it('rejects short password', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname: 'Test', email: 'test@example.com', password: '12345' }),
    });
    assert.strictEqual(res.status, 400);
  });

  it('sets httpOnly cookies', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname: 'Test', email: 'test@example.com', password: 'pass123' }),
    });
    const cookies = res.headers.getSetCookie();
    assert.ok(cookies.some(c => c.startsWith('accessToken=')));
    assert.ok(cookies.some(c => c.startsWith('refreshToken=')));
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    const hash = await bcrypt.hash('pass123', 12);
    await User.create({ fullname: 'Test', email: 'test@example.com', passwordHash: hash });
  });

  it('logs in with correct credentials', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'pass123' }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.user.email, 'test@example.com');
  });

  it('rejects wrong password', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.ok(body.message.includes('password') || body.message.includes('Incorrect'));
  });

  it('rejects unregistered email', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@example.com', password: 'pass123' }),
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.ok(body.message.toLowerCase().includes("isn't registered") || body.message.toLowerCase().includes('not registered'));
  });
});

describe('GET /api/auth/verify-email', () => {
  it('verifies with valid token', async () => {
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    await User.create({
      fullname: 'Test', email: 'verify@example.com', passwordHash: 'hash',
      emailVerifyToken: hashed, emailVerifyExpiry: new Date(Date.now() + 3600000),
    });
    const res = await fetch(`${baseUrl}/api/auth/verify-email?token=${token}&email=verify@example.com`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
  });

  it('returns success for already verified email', async () => {
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    await User.create({
      fullname: 'Test', email: 'verify@example.com', passwordHash: 'hash',
      emailVerified: true, emailVerifyToken: hashed,
    });
    const res = await fetch(`${baseUrl}/api/auth/verify-email?token=${token}&email=verify@example.com`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.message.toLowerCase().includes('already verified'));
  });

  it('rejects invalid token', async () => {
    await User.create({ fullname: 'Test', email: 'verify@example.com', passwordHash: 'hash' });
    const res = await fetch(`${baseUrl}/api/auth/verify-email?token=invalid&email=verify@example.com`);
    assert.strictEqual(res.status, 400);
  });
});

describe('POST /api/auth/forgot-password', () => {
  beforeEach(async () => {
    const hash = await bcrypt.hash('pass123', 12);
    await User.create({ fullname: 'Test', email: 'test@example.com', passwordHash: hash });
  });

  it('returns success for existing email', async () => {
    const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
  });

  it('returns same success for non-existing email (no enumeration)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@example.com' }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
  });
});

describe('POST /api/auth/refresh', () => {
  it('refreshes with valid token', async () => {
    const crypto = await import('crypto');
    const hash = await bcrypt.hash('pass123', 12);
    const { token: refreshToken, prefix } = generateRefreshToken();
    const user = await User.create({
      fullname: 'Test', email: 'test@example.com', passwordHash: hash,
      refreshTokenHash: await bcrypt.hash(refreshToken, 10), refreshTokenPrefix: prefix,
    });
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `refreshToken=${refreshToken}` },
    });
    assert.strictEqual(res.status, 200);
  });

  it('rejects without refresh token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/refresh`, { method: 'POST' });
    assert.strictEqual(res.status, 401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns user with valid access token', async () => {
    const hash = await bcrypt.hash('pass123', 12);
    const user = await User.create({ fullname: 'Test', email: 'test@example.com', passwordHash: hash });
    const token = generateAccessToken(user);
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: `accessToken=${token}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.email, 'test@example.com');
  });

  it('rejects without token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.strictEqual(res.status, 401);
  });
});
