# NoteUniX

A university study notes sharing platform built for Nepali students. Upload, discover, and share study notes organized by university, course, semester, and subject.

## Features

- **Notes Sharing** — Upload PDFs, admin approval workflow, download counting, star ratings
- **Content Hierarchy** — University > Course > Semester > Subject drill-down browsing
- **User Accounts** — Email/password auth, Google OAuth, email verification, password reset
- **Social Features** — Bookmarks, comments with nested replies, reports
- **Admin Panel** — Dashboard with analytics, content/user/note management, bulk email, ad management, audit logs
- **Notifications** — Real-time in-app notifications (7 types)
- **Search** — Cross-entity search across universities, courses, subjects, and notes
- **Ad System** — Slot-based ads with impression/click tracking and scheduling
- **Dark/Light Theme** — System preference detection with manual toggle

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Express.js, Mongoose, JWT (httpOnly cookies) |
| Frontend | React 18, TypeScript, Vite, React Router v6 |
| Database | MongoDB (Atlas or local) |
| File Storage | Cloudinary |
| Email | Nodemailer (Gmail SMTP) |
| Auth | Passport.js (Google OAuth 2.0) |
| Charts | Recharts |
| Monorepo | Turborepo |

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (free tier works)
- Gmail App Password (for transactional emails)
- Google Cloud project with OAuth credentials (optional, for Google sign-in)

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-username/noteunix.git
cd noteunix

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp packages/backend/.env.example packages/backend/.env
# Edit packages/backend/.env with your credentials

# 4. Start development servers
npm run dev
```

The backend runs on `http://localhost:5000` and the frontend on `http://localhost:5173`.

### Verify Admin Account

After starting, run the admin verification script:

```bash
node packages/backend/scripts/verify-admin.js
```

## Environment Variables

Edit `packages/backend/.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Yes | Secret for access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh tokens (min 32 chars) |
| `JWT_ACCESS_EXPIRES_IN` | No | Access token expiry (default: `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh token expiry (default: `30d`) |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `SMTP_HOST` | No | SMTP host (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | No | SMTP port (default: `587`) |
| `SMTP_SECURE` | No | Use TLS (default: `false`) |
| `SMTP_USER` | No | SMTP username/email |
| `SMTP_PASS` | No | SMTP password or app password |
| `SMTP_FROM` | No | Sender address (e.g., `NoteUniX <you@gmail.com>`) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `CORS_ORIGIN` | No | Frontend URL (default: `http://localhost:5173`) |
| `PORT` | No | Server port (default: `5000`) |

## Project Structure

```
noteunix/
  packages/
    backend/
      src/
        config/         # Passport, Cloudinary, email setup
        jobs/           # Background schedulers (cleanup)
        middleware/     # Auth, validation, error handling
        models/         # Mongoose schemas (User, Note, etc.)
        routes/         # Express route handlers
        utils/          # Helpers and constants
        server.js       # Entry point with startup checks
    frontend/
      src/
        api/            # Axios API clients
        components/     # Reusable UI components
        context/        # React contexts (Auth, Toast, Theme)
        pages/          # Route pages (public, user, admin)
        utils/          # Helpers and constants
```

## Available Scripts

```bash
# Development (runs both backend and frontend)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint
npm run lint
```

## Deployment

### Docker

```bash
docker compose up -d
```

### Manual

```bash
npm run build
NODE_ENV=production node packages/backend/src/server.js
```

The production build serves the frontend as static files from the backend on port 5000.

## License

MIT
