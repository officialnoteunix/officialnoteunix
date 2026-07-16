import User from '../models/User.js';
import Note from '../models/Note.js';
import Comment from '../models/Comment.js';
import Bookmark from '../models/Bookmark.js';
import Rating from '../models/Rating.js';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import ContactMessage from '../models/ContactMessage.js';
import Ad from '../models/Ad.js';
import { deleteNoteFiles } from '../utils/uploadCloudinary.js';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

async function cleanupUnverifiedAccounts() {
  const result = await User.deleteMany({
    emailVerified: false,
    emailVerifyExpiry: { $lt: new Date() },
  });
  return result.deletedCount;
}

async function cleanupExpiredResetTokens() {
  const result = await User.updateMany(
    { resetTokenExpiry: { $lt: new Date() }, resetTokenHash: { $ne: null } },
    { $unset: { resetTokenHash: '', resetTokenExpiry: '' } }
  );
  return result.modifiedCount;
}

async function cleanupStaleRefreshTokens() {
  const cutoff = new Date(Date.now() - 30 * DAY);
  const result = await User.updateMany(
    { updatedAt: { $lt: cutoff }, refreshTokenHash: { $ne: null } },
    { $unset: { refreshTokenHash: '', refreshTokenPrefix: '' } }
  );
  return result.modifiedCount;
}

async function cleanupExpiredSuspensions() {
  const result = await User.updateMany(
    { suspendedUntil: { $ne: null, $lt: new Date() } },
    { $set: { banned: false, suspendedUntil: null } }
  );
  return result.modifiedCount;
}

async function cleanupOrphanedNotifications() {
  const existingUserIds = await User.distinct('_id');
  const result = await Notification.deleteMany({
    userId: { $nin: existingUserIds },
  });
  return result.deletedCount;
}

async function cleanupOrphanedComments() {
  const existingNoteIds = await Note.distinct('_id');
  const result = await Comment.deleteMany({
    noteId: { $nin: existingNoteIds },
  });
  return result.deletedCount;
}

async function cleanupOrphanedBookmarks(existingNoteIds) {
  const noteIds = existingNoteIds || await Note.distinct('_id');
  const result = await Bookmark.deleteMany({
    noteId: { $nin: noteIds },
  });
  return result.deletedCount;
}

async function cleanupOrphanedRatings(existingNoteIds) {
  const noteIds = existingNoteIds || await Note.distinct('_id');
  const result = await Rating.deleteMany({
    noteId: { $nin: noteIds },
  });
  return result.deletedCount;
}

async function cleanupOrphanedReports(existingNoteIds) {
  const noteIds = existingNoteIds || await Note.distinct('_id');
  const result = await Report.deleteMany({
    note: { $nin: noteIds },
  });
  return result.deletedCount;
}

async function cleanupStaleCommentLikes() {
  const existingUserIds = await User.distinct('_id');
  const result = await Comment.updateMany(
    { 'likes.0': { $exists: true } },
    { $pull: { likes: { $nin: existingUserIds } } }
  );
  return result.modifiedCount;
}

async function cleanupExpiredAds() {
  const result = await Ad.deleteMany({
    endDate: { $lt: new Date() },
    active: true,
  });
  return result.deletedCount;
}

async function cleanupOldContactMessages() {
  const cutoff = new Date(Date.now() - 90 * DAY);
  const result = await ContactMessage.deleteMany({
    createdAt: { $lt: cutoff },
  });
  return result.deletedCount;
}

async function cleanupOldAuditLogs() {
  const cutoff = new Date(Date.now() - 90 * DAY);
  const result = await AuditLog.deleteMany({
    createdAt: { $lt: cutoff },
  });
  return result.deletedCount;
}

async function cleanupOldNotifications() {
  const cutoff = new Date(Date.now() - 30 * DAY);
  const result = await Notification.deleteMany({
    createdAt: { $lt: cutoff },
  });
  return result.deletedCount;
}

async function cleanupStaleUnapprovedNotes() {
  const cutoff = new Date(Date.now() - 90 * DAY);
  const staleNotes = await Note.find({ approved: false, createdAt: { $lt: cutoff } }).select('files thumbnailUrl');
  if (!staleNotes.length) return 0;
  await Promise.all(staleNotes.map(n => deleteNoteFiles(n)));
  return Note.deleteMany({ _id: { $in: staleNotes.map(n => n._id) } }).then(r => r.deletedCount);
}

async function cleanupOldResolvedReports() {
  const cutoff = new Date(Date.now() - 180 * DAY);
  const result = await Report.deleteMany({
    status: { $in: ['resolved', 'dismissed'] },
    createdAt: { $lt: cutoff },
  });
  return result.deletedCount;
}

async function logCleanup(name, fn) {
  try {
    const count = await fn();
    if (count > 0) console.log(`[Cleanup] ${name}: ${count} item(s)`);
  } catch (err) {
    console.error(`[Cleanup] ${name} failed:`, err.message);
  }
}

const LIGHT_TASKS = [
  ['expired unverified accounts', cleanupUnverifiedAccounts],
  ['expired reset tokens', cleanupExpiredResetTokens],
  ['stale refresh tokens', cleanupStaleRefreshTokens],
  ['expired suspensions', cleanupExpiredSuspensions],
];

const HEAVY_TASKS = [
  ['orphaned notifications', cleanupOrphanedNotifications],
  ['orphaned comments', cleanupOrphanedComments],
  ['stale comment likes', cleanupStaleCommentLikes],
  ['expired ads', cleanupExpiredAds],
  ['stale unapproved notes (>90d)', cleanupStaleUnapprovedNotes],
];

async function runOrphanedNoteCleanup() {
  const existingNoteIds = await Note.distinct('_id');
  const tasks = [
    ['orphaned bookmarks', () => cleanupOrphanedBookmarks(existingNoteIds)],
    ['orphaned ratings', () => cleanupOrphanedRatings(existingNoteIds)],
    ['orphaned reports', () => cleanupOrphanedReports(existingNoteIds)],
  ];
  for (const [name, fn] of tasks) {
    await logCleanup(name, fn);
  }
}

const PRUNE_TASKS = [
  ['old contact messages (>90d)', cleanupOldContactMessages],
  ['old audit logs (>90d)', cleanupOldAuditLogs],
  ['old notifications (>30d)', cleanupOldNotifications],
  ['old resolved reports (>180d)', cleanupOldResolvedReports],
];

async function runTasks(tasks) {
  for (const [name, fn] of tasks) {
    await logCleanup(name, fn);
  }
}

export function startCleanupScheduler() {
  console.log('[Cleanup] Scheduler started');

  runTasks([...LIGHT_TASKS, ...HEAVY_TASKS]).then(() => runOrphanedNoteCleanup()).then(() => runTasks(PRUNE_TASKS)).catch(err => {
    console.error('[Cleanup] Initial run failed:', err.message);
  });
  console.log('[Cleanup] Initial run triggered');

  setInterval(() => runTasks(LIGHT_TASKS).catch(err => {
    console.error('[Cleanup] Light tasks failed:', err.message);
  }), 1 * HOUR);
  setInterval(() => runTasks(HEAVY_TASKS).then(() => runOrphanedNoteCleanup()).catch(err => {
    console.error('[Cleanup] Heavy tasks failed:', err.message);
  }), 6 * HOUR);
  setInterval(() => runTasks(PRUNE_TASKS).catch(err => {
    console.error('[Cleanup] Prune tasks failed:', err.message);
  }), 24 * HOUR);
}
