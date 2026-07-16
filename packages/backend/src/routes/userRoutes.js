import { Router } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Note from '../models/Note.js';
import Bookmark from '../models/Bookmark.js';
import Comment from '../models/Comment.js';
import Rating from '../models/Rating.js';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema, changePasswordSchema } from '../validators/userValidator.js';
import { uploadImage, validateImageBuffer } from '../middleware/upload.js';
import { uploadBuffer, deleteFile, deleteNoteFiles, extractPublicId } from '../utils/uploadCloudinary.js';
import { clearAuthCookies } from '../utils/cookies.js';
import { logAudit } from '../services/auditLogger.js';

const router = Router();

router.get('/profile', authenticate, (req, res) => {
  res.json({ success: true, data: req.user.toPublicJSON() });
});

router.patch('/profile', authenticate, validate(updateProfileSchema), async (req, res, next) => {
  try {
    const { fullname } = req.validatedBody;
    if (fullname) req.user.fullname = fullname;
    await req.user.save();
    res.json({ success: true, data: req.user.toPublicJSON() });
  } catch (err) { next(err); }
});

router.post('/avatar', authenticate, uploadImage.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Image required' });
    if (!validateImageBuffer(req.file.buffer, req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'File content does not match its file type' });
    }
    const result = await uploadBuffer(req.file.buffer, { folder: 'noteunix/avatars', resourceType: 'image' });
    // Clean up old avatar
    if (req.user.avatar) {
      const oldId = extractPublicId(req.user.avatar);
      if (oldId) await deleteFile(oldId).catch(() => {});
    }
    req.user.avatar = result.secure_url;
    await req.user.save();
    res.json({ success: true, data: { avatar: result.secure_url } });
  } catch (err) { next(err); }
});

router.patch('/password', authenticate, validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.validatedBody;
    const user = await User.findById(req.user._id);
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ success: true, message: 'Password changed' });
  } catch (err) { next(err); }
});

router.get('/dashboard/stats', authenticate, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const [totalNotes, totalBookmarks, recentNotes, recentBookmarks, downloadsResult, approvedNotes, pendingNotes] = await Promise.all([
      Note.countDocuments({ userId }),
      Bookmark.countDocuments({ userId }),
      Note.find({ userId }).sort({ createdAt: -1 }).limit(5).select('title createdAt approved downloads'),
      Bookmark.find({ userId }).sort({ createdAt: -1 }).limit(5).populate('noteId'),
      Note.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$downloads' } } },
      ]),
      Note.countDocuments({ userId, approved: true }),
      Note.countDocuments({ userId, approved: false }),
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const notesByMonth = await Note.aggregate([
      { $match: { userId, createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalNotes, totalBookmarks,
        totalDownloads: downloadsResult[0]?.total || 0,
        approvedNotes, pendingNotes,
        recentNotes, recentBookmarks, notesByMonth,
      },
    });
  } catch (err) { next(err); }
});

router.get('/leaderboard', async (req, res, next) => {
  try {
    const topUsers = await Note.aggregate([
      { $group: { _id: '$userId', totalDownloads: { $sum: '$downloads' }, noteCount: { $sum: 1 } } },
      { $sort: { totalDownloads: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: '$user._id',
          fullname: '$user.fullname',
          avatar: '$user.avatar',
          totalDownloads: 1,
          noteCount: 1,
        },
      },
    ]);

    const topRated = await Note.aggregate([
      { $match: { approved: true, ratingsCount: { $gt: 0 } } },
      { $sort: { averageRating: -1, ratingsCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          title: 1,
          averageRating: 1,
          ratingsCount: 1,
          downloads: 1,
          'user.fullname': 1,
          'user.avatar': 1,
        },
      },
    ]);

    const topDownloaded = await Note.find({ approved: true })
      .sort({ downloads: -1 })
      .limit(10)
      .populate('userId', 'fullname avatar')
      .select('title downloads averageRating');

    res.json({
      success: true,
      data: { topContributors: topUsers, topRated, topDownloaded },
    });
  } catch (err) { next(err); }
});

router.delete('/account', authenticate, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    // Clean up all user data
    const userNotes = await Note.find({ userId }).select('files thumbnailUrl');
    await Promise.all([
      ...userNotes.map(note => deleteNoteFiles(note)),
      Note.deleteMany({ userId }),
      Comment.deleteMany({ userId }),
      Bookmark.deleteMany({ userId }),
      Rating.deleteMany({ userId }),
      Report.deleteMany({ reportedBy: userId }),
      Notification.deleteMany({ userId }),
    ]);
    // Clean up avatar
    if (user?.avatar) {
      const avatarId = extractPublicId(user.avatar);
      if (avatarId) await deleteFile(avatarId).catch(() => {});
    }
    clearAuthCookies(res);
    await User.findByIdAndDelete(userId);
    await logAudit({
      adminId: userId, adminEmail: req.user.email,
      action: 'user_delete', targetType: 'user', targetId: userId,
      targetTitle: req.user.fullname || req.user.email,
    });
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) { next(err); }
});

export default router;
