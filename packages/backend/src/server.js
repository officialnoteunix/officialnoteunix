import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

function check(label, ok, detail) {
  const icon = ok ? '✓' : '✗';
  const suffix = detail ? ` — ${detail}` : '';
  console.log(`  ${icon} ${label}${suffix}`);
  return ok;
}

async function startupCheck() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║         NoteUniX Startup Checks          ║');
  console.log('╚══════════════════════════════════════════╝\n');

  let allPassed = true;

  // ── 1. Environment Variables ────────────────────────────
  console.log('[1/6] Environment Variables');
  const required = {
    MONGO_URI: 'Database connection',
    JWT_ACCESS_SECRET: 'Access token signing',
    JWT_REFRESH_SECRET: 'Refresh token signing',
    CLOUDINARY_CLOUD_NAME: 'File storage (Cloudinary)',
    CLOUDINARY_API_KEY: 'File storage (Cloudinary)',
    CLOUDINARY_API_SECRET: 'File storage (Cloudinary)',
  };
  for (const [key, desc] of Object.entries(required)) {
    allPassed = check(`${desc} (${key})`, !!process.env[key]) && allPassed;
  }
  const optional = {
    BREVO_API_KEY: 'Email (Brevo)',
    GOOGLE_CLIENT_ID: 'Google OAuth',
    GOOGLE_CLIENT_SECRET: 'Google OAuth',
  };
  for (const [key, desc] of Object.entries(optional)) {
    check(`${desc} (${key})`, !!process.env[key], process.env[key] ? 'configured' : 'not configured');
  }

  // ── 2. JWT Secrets Strength ─────────────────────────────
  console.log('\n[2/6] JWT Secrets');
  const accessLen = (process.env.JWT_ACCESS_SECRET || '').length;
  const refreshLen = (process.env.JWT_REFRESH_SECRET || '').length;
  allPassed = check('Access secret length ≥ 32 chars', accessLen >= 32, `${accessLen} chars`) && allPassed;
  allPassed = check('Refresh secret length ≥ 32 chars', refreshLen >= 32, `${refreshLen} chars`) && allPassed;
  allPassed = check('Secrets are different', process.env.JWT_ACCESS_SECRET !== process.env.JWT_REFRESH_SECRET) && allPassed;

  // ── 3. Cloudinary ───────────────────────────────────────
  console.log('\n[3/6] Cloudinary');
  try {
    const { v2: cld } = await import('cloudinary');
    cld.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const result = await cld.api.ping();
    allPassed = check('API connection', result.status === 'ok') && allPassed;
  } catch (err) {
    allPassed = check('API connection', false, err.message) && allPassed;
  }

  // ── 4. Email ──────────────────────────────────────────────
  console.log('\n[4/6] Email');
  const hasBrevo = !!process.env.BREVO_API_KEY;
  if (hasBrevo) {
    allPassed = check('Brevo API Key', true, 'configured') && allPassed;
  } else {
    allPassed = check('Brevo API Key', false, 'not configured — emails disabled') && allPassed;
  }

  // ── 5. Google OAuth ─────────────────────────────────────
  console.log('\n[5/6] Google OAuth');
  const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  check('Credentials', googleConfigured, googleConfigured ? 'configured' : 'not configured — Google sign-in disabled');
  if (googleConfigured) {
    check('Callback URL', true, `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/api/auth/google/callback`);
  }

  // ── 6. Port Availability ────────────────────────────────
  console.log('\n[6/6] Port');
  try {
    const net = await import('net');
    const available = await new Promise((resolve) => {
      const srv = net.createServer();
      srv.once('error', () => resolve(false));
      srv.once('listening', () => { srv.close(); resolve(true); });
      srv.listen(PORT);
    });
    allPassed = check(`Port ${PORT}`, available, available ? 'available' : 'already in use') && allPassed;
  } catch {
    check(`Port ${PORT}`, false, 'could not verify');
  }

  // ── Summary ─────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════');
  if (allPassed) {
    console.log('  ✓ All critical checks passed — starting server\n');
  } else {
    console.log('  ✗ Some checks failed — server may not work correctly\n');
  }

  return allPassed;
}

import mongoose from 'mongoose';
import cloudinary from './config/cloudinary.js';
import configurePassport from './config/passport.js';
import app from './app.js';
import { startCleanupScheduler } from './jobs/cleanup.js';

configurePassport();

async function start() {
  await startupCheck();

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[MongoDB] Connected');

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Clean up expired suspensions on startup
    await mongoose.connection.db.collection('users').updateMany(
      { suspendedUntil: { $ne: null, $lt: new Date() } },
      { $set: { banned: false, suspendedUntil: null } }
    );

    const server = app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
      startCleanupScheduler();
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received — shutting down gracefully...`);
      server.close(async () => {
        console.log('[Server] HTTP closed');
        await mongoose.connection.close();
        console.log('[MongoDB] Connection closed');
        process.exit(0);
      });
      setTimeout(() => {
        console.error('[Server] Forced shutdown after 10s');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('[FATAL] Failed to start server:', err);
    process.exit(1);
  }
}

start();
