import { Router } from 'express';
import User from '../models/User.js';
import Note from '../models/Note.js';
import University from '../models/University.js';
import Course from '../models/Course.js';
import Semester from '../models/Semester.js';
import Subject from '../models/Subject.js';
import Report from '../models/Report.js';
import Bookmark from '../models/Bookmark.js';
import Rating from '../models/Rating.js';
import ContactMessage from '../models/ContactMessage.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { sendNoteApprovedEmail, sendCustomEmail, isEmailEnabled, sendContactReplyEmail } from '../config/email.js';
import { validate } from '../middleware/validate.js';
import { upload, validatePdfBuffer } from '../middleware/upload.js';
import { createNoteSchema } from '../validators/noteValidator.js';
import cloudinary from '../config/cloudinary.js';
import { safeLimit, safePage } from '../utils/constants.js';

const router = Router();

router.get('/stats', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [
      totalUsers, totalNotes, totalUniversities, totalCourses, totalSemesters, totalSubjects,
      pendingNotes, pendingReports, totalBookmarks, totalContactMessages, unreadContactMessages,
      recentAuditLogs,
    ] = await Promise.all([
      User.countDocuments(),
      Note.countDocuments(),
      University.countDocuments(),
      Course.countDocuments(),
      Semester.countDocuments(),
      Subject.countDocuments(),
      Note.countDocuments({ approved: false }),
      Report.countDocuments({ status: 'pending' }),
      Bookmark.countDocuments(),
      ContactMessage.countDocuments(),
      ContactMessage.countDocuments({ read: false }),
      AuditLog.countDocuments({ createdAt: { $gte: new Date(Date.now() - 86400000) } }),
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const notesByMonth = await Note.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const usersByMonth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalUsers, totalNotes, totalUniversities, totalCourses, totalSemesters, totalSubjects,
        pendingNotes, pendingReports, totalBookmarks, totalContactMessages, unreadContactMessages,
        recentAuditLogs, notesByMonth, usersByMonth,
      },
    });
  } catch (err) { next(err); }
});

router.get('/users', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const safeLim = safeLimit(limit);
    const safePg = safePage(page);
    const skip = (safePg - 1) * safeLim;
    const [users, total] = await Promise.all([
      User.find().select('-passwordHash -refreshTokenHash').sort({ createdAt: -1 }).skip(skip).limit(safeLim),
      User.countDocuments(),
    ]);
    res.json({ success: true, data: { items: users, total, page: safePg, limit: safeLim, totalPages: Math.ceil(total / safeLim) } });
  } catch (err) { next(err); }
});

router.get('/users/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id).select('-passwordHash -refreshTokenHash');
    if (!u) return res.status(404).json({ success: false, message: 'Not found' });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [notesCount, bookmarksCount, totalDownloads, recentNotes, bookmarks, notesByMonth] = await Promise.all([
      Note.countDocuments({ userId: u._id }),
      Bookmark.countDocuments({ userId: u._id }),
      Note.aggregate([{ $match: { userId: u._id } }, { $group: { _id: null, total: { $sum: '$downloads' } } }]),
      Note.find({ userId: u._id }).sort({ createdAt: -1 }).limit(5).select('title createdAt approved downloads'),
      Bookmark.find({ userId: u._id }).sort({ createdAt: -1 }).limit(5).populate('noteId', 'title'),
      Note.aggregate([
        { $match: { userId: u._id, createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        ...u.toObject(),
        stats: {
          totalNotes: notesCount,
          totalBookmarks: bookmarksCount,
          totalDownloads: totalDownloads[0]?.total || 0,
        },
        recentNotes,
        recentBookmarks: bookmarks,
        notesByMonth,
      },
    });
  } catch (err) { next(err); }
});

router.get('/notes', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { approved, page = 1, limit = 5 } = req.query;
    const safeLim = safeLimit(limit);
    const safePg = safePage(page);
    const query = {};
    if (approved !== undefined) query.approved = approved === 'true';
    const skip = (safePg - 1) * safeLim;
    const [notes, total] = await Promise.all([
      Note.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLim)
        .populate('userId', 'fullname email avatar')
        .populate('subjectId', 'name'),
      Note.countDocuments(query),
    ]);
    res.json({ success: true, data: { items: notes, total, page: safePg, limit: safeLim, totalPages: Math.ceil(total / safeLim) } });
  } catch (err) { next(err); }
});

router.post('/notes', authenticate, authorize('admin'), upload.single('file'), validate(createNoteSchema), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });
    if (!validatePdfBuffer(req.file.buffer)) {
      return res.status(400).json({ success: false, message: 'File content does not match PDF format' });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'noteunix/notes', resource_type: 'auto' },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    const note = await Note.create({
      subjectId: req.validatedBody.subjectId,
      userId: req.user._id,
      title: req.validatedBody.title,
      description: req.validatedBody.description,
      cloudinaryUrl: result.secure_url,
      fileType: 'pdf', fileSize: req.file.size,
      approved: true,
    });
    res.status(201).json({ success: true, data: note });
  } catch (err) { next(err); }
});

router.patch('/notes/:id/approve', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const note = await Note.findByIdAndUpdate(req.params.id, { approved: true }, { new: true }).populate('userId', 'fullname email');
    if (!note) return res.status(404).json({ success: false, message: 'Not found' });
    const noteUrl = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/notes/${note._id}`;
    await Notification.create({
      userId: note.userId._id,
      type: 'note_approved',
      title: 'Note Approved!',
      message: `"${note.title}" has been approved.`,
      link: noteUrl,
    });
    sendNoteApprovedEmail(note.userId.email, note.title, noteUrl);
    await AuditLog.create({
      adminId: req.user._id, adminEmail: req.user.email,
      action: 'note_approve', targetType: 'note', targetId: note._id,
      targetTitle: note.title,
    });
    res.json({ success: true, data: note });
  } catch (err) { next(err); }
});

router.patch('/notes/:id/reject', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const note = await Note.findByIdAndUpdate(req.params.id, { approved: false }, { new: true }).populate('userId', 'fullname email');
    if (!note) return res.status(404).json({ success: false, message: 'Not found' });
    const noteUrl = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/notes/${note._id}`;
    await Notification.create({
      userId: note.userId._id,
      type: 'note_rejected',
      title: 'Note Not Approved',
      message: `"${note.title}" was not approved. Please review and resubmit.`,
      link: noteUrl,
    });
    await AuditLog.create({
      adminId: req.user._id, adminEmail: req.user.email,
      action: 'note_reject', targetType: 'note', targetId: note._id,
      targetTitle: note.title,
    });
    res.json({ success: true, data: note });
  } catch (err) { next(err); }
});

router.delete('/notes/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Not found' });
    await Promise.all([
      Comment.deleteMany({ noteId: note._id }),
      Report.deleteMany({ note: note._id }),
      Bookmark.deleteMany({ noteId: note._id }),
      Rating.deleteMany({ noteId: note._id }),
    ]);
    if (note.cloudinaryUrl) {
      try {
        const parts = note.cloudinaryUrl.split('/upload/');
        if (parts[1]) {
          const publicId = parts[1].replace(/\.[^.]+$/, '');
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (cloudErr) {
        console.warn('Cloudinary delete failed for note', note._id, cloudErr.message);
      }
    }
    await Note.findByIdAndDelete(note._id);
    await AuditLog.create({
      adminId: req.user._id, adminEmail: req.user.email,
      action: 'note_delete', targetType: 'note', targetId: note._id,
      targetTitle: note.title || 'Untitled',
    });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

router.patch('/users/:id/ban', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    if (req.user._id.equals(user._id)) return res.status(400).json({ success: false, message: 'Cannot restrict yourself' });
    user.banned = !user.banned;
    if (user.banned) user.suspendedUntil = null;
    await user.save();
    await AuditLog.create({
      adminId: req.user._id, adminEmail: req.user.email,
      action: user.banned ? 'user_ban' : 'user_unban',
      targetType: 'user', targetId: user._id,
      targetTitle: user.fullname || user.email,
    });
    res.json({ success: true, data: user.toPublicJSON() });
  } catch (err) { next(err); }
});

router.patch('/users/:id/suspend', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { durationHours } = req.body;
    if (!durationHours || typeof durationHours !== 'number' || durationHours < 1) {
      return res.status(400).json({ success: false, message: 'durationHours must be a positive number' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    if (req.user._id.equals(user._id)) return res.status(400).json({ success: false, message: 'Cannot restrict yourself' });
    user.banned = true;
    user.suspendedUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    await user.save();
    await AuditLog.create({
      adminId: req.user._id, adminEmail: req.user.email,
      action: 'user_suspend', targetType: 'user', targetId: user._id,
      targetTitle: user.fullname || user.email,
      details: `Suspended for ${durationHours} hour(s)`,
    });
    res.json({ success: true, data: user.toPublicJSON() });
  } catch (err) { next(err); }
});

router.delete('/users/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    await AuditLog.create({
      adminId: req.user._id, adminEmail: req.user.email,
      action: 'user_delete', targetType: 'user', targetId: user._id,
      targetTitle: user.fullname || user.email,
    });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

router.get('/comments', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const safeLim = safeLimit(limit);
    const safePg = safePage(page);
    const skip = (safePg - 1) * safeLim;
    const [comments, total] = await Promise.all([
      Comment.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLim)
        .populate('userId', 'fullname email avatar')
        .populate('noteId', 'title'),
      Comment.countDocuments(),
    ]);
    res.json({
      success: true,
      data: { items: comments, total, page: safePg, limit: safeLim, totalPages: Math.ceil(total / safeLim) },
    });
  } catch (err) { next(err); }
});

router.get('/notifications', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const safeLim = safeLimit(limit);
    const safePg = safePage(page);
    const skip = (safePg - 1) * safeLim;
    const [notifications, total] = await Promise.all([
      Notification.find().sort({ createdAt: -1 }).skip(skip).limit(safeLim).populate('userId', 'fullname email'),
      Notification.countDocuments(),
    ]);
    res.json({
      success: true,
      data: { items: notifications, total, page: safePg, limit: safeLim, totalPages: Math.ceil(total / safeLim) },
    });
  } catch (err) { next(err); }
});

router.delete('/comments/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id).populate('noteId', 'title');
    if (!comment) return res.status(404).json({ success: false, message: 'Not found' });
    await Comment.deleteMany({ parentComment: comment._id });
    await Comment.findByIdAndDelete(comment._id);
    await AuditLog.create({
      adminId: req.user._id, adminEmail: req.user.email,
      action: 'comment_delete', targetType: 'comment', targetId: comment._id,
      targetTitle: `Comment on "${comment.noteId?.title || 'note'}"`,
    });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

router.get('/audit-logs', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const safeLim = safeLimit(limit);
    const safePg = safePage(page);
    const skip = (safePg - 1) * safeLim;
    const [logs, total] = await Promise.all([
      AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(safeLim).populate('adminId', 'fullname email'),
      AuditLog.countDocuments(),
    ]);
    res.json({
      success: true,
      data: { items: logs, total, page: safePg, limit: safeLim, totalPages: Math.ceil(total / safeLim) },
    });
  } catch (err) { next(err); }
});

router.post('/send-email', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    if (!isEmailEnabled()) {
      return res.status(400).json({ success: false, message: 'Email service is not configured. Set SMTP_HOST and SMTP_USER in your .env file.' });
    }

    const { subject, html, recipientType, recipientEmail } = req.body;
    if (!subject || !html) {
      return res.status(400).json({ success: false, message: 'Subject and HTML body are required' });
    }

    let recipients = [];
    if (recipientType === 'all') {
      const users = await User.find().select('email fullname');
      recipients = users.map(u => ({ email: u.email, name: u.fullname }));
    } else if (recipientType === 'single' && recipientEmail) {
      recipients = [{ email: recipientEmail, name: recipientEmail }];
    } else {
      return res.status(400).json({ success: false, message: 'Specify recipientType (all/single) and recipientEmail for single' });
    }

    const results = { sent: 0, failed: 0, errors: [] };
    for (const r of recipients) {
      try {
        await sendCustomEmail({
          to: r.email,
          subject,
          html: html.replace(/\{\{name\}\}/g, r.name),
        });
        results.sent++;
      } catch (err) {
        results.failed++;
        results.errors.push({ email: r.email, error: err.message });
      }
    }

    try {
      await AuditLog.create({
        adminId: req.user._id, adminEmail: req.user.email,
        action: 'send_email', targetType: 'email',
        targetTitle: subject,
        details: `Sent to ${results.sent} users (${results.failed} failed)`,
      });
    } catch { /* non-critical */ }

    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

router.post('/contact/:id/reply', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { replyContent } = req.body;
    if (!replyContent?.trim()) {
      return res.status(400).json({ success: false, message: 'Reply content is required' });
    }
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });

    if (isEmailEnabled()) {
      try {
        await sendContactReplyEmail(msg.email, msg.name, msg.topic || 'Your inquiry', replyContent.trim());
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to send reply email. Please try again.' });
      }
    }

    msg.replied = true;
    msg.replyContent = replyContent.trim();
    msg.repliedAt = new Date();
    msg.read = true;
    await msg.save();

    try {
      await AuditLog.create({
        adminId: req.user._id, adminEmail: req.user.email,
        action: 'send_email', targetType: 'email',
        targetTitle: `Reply to ${msg.email}`,
        details: `Replied to contact message from ${msg.name}`,
      });
    } catch { /* non-critical */ }

    res.json({ success: true, data: msg });
  } catch (err) { next(err); }
});

export default router;
