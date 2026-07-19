import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import passport from 'passport';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import configurePassport from './config/passport.js';
import { RATE_LIMIT } from './utils/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      frameSrc: ["'self'", "https://docs.google.com"],
    },
  },
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
// Strip NoSQL operator keys ($gt, $set, etc.) and prevent prototype pollution.
app.use(mongoSanitize());
app.use(hpp());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(passport.initialize());

function createRateLimiter(windowMs, max) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const retryAfter = req.rateLimit?.resetTime
        ? Math.ceil((new Date(req.rateLimit.resetTime).getTime() - Date.now()) / 1000)
        : Math.ceil(windowMs / 1000);
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please wait before trying again.',
        retryAfter,
        code: 'RATE_LIMITED',
      });
    },
  });
}

app.use('/api/auth', createRateLimiter(RATE_LIMIT.AUTH_WINDOW_MS, RATE_LIMIT.AUTH_MAX_REQUESTS));
app.use('/api', createRateLimiter(RATE_LIMIT.GENERAL_WINDOW_MS, RATE_LIMIT.GENERAL_MAX_REQUESTS));

const distPath = path.resolve(__dirname, '../../frontend/dist');
const fs = await import('fs');
const indexExists = fs.existsSync(path.join(distPath, 'index.html'));
console.log(`[SPA] distPath: ${distPath}, index.html exists: ${indexExists}`);

if (process.env.NODE_ENV !== 'production') {
  app.post('/api/debug/test-email', express.json(), async (req, res) => {
    try {
      const nodemailer = (await import('nodemailer')).default;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS?.replace(/\s+/g, ''),
        },
      });
      await transporter.verify();
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@noteunix.com',
        to: req.body.email || process.env.SMTP_USER,
        subject: 'Test email from NoteUniX',
        html: '<p>If you received this, email sending works!</p>',
      });
      res.json({ success: true, messageId: info.messageId });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message, response: err.response });
    }
  });
}

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const healthy = dbState === 1;
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 'healthy' : 'unhealthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus[dbState] || 'unknown',
    distPath: distPath,
    indexExists: indexExists,
    nodeEnv: process.env.NODE_ENV,
  });
});

app.use('/api', routes);

if (indexExists) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.warn('[SPA] dist/index.html not found — SPA routes will 404');
}

app.use(errorHandler);

export default app;
