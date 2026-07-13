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
import cloudinary from '../config/cloudinary.js';
import { uploadImage, validateImageBuffer } from '../middleware/upload.js';

const router = Router();

router.get('/profile', authenticate, (req, res) => {
  res.json({ success: true, data: req.user.toPublicJSON() });
});

router.patch('/profile', authenticate, async (req, res, next) => {
  try {
    const { fullname } = req.body;
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
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'noteunix/avatars', width: 200, height: 200, crop: 'fill' },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(req.file.buffer);
    });
    req.user.avatar = result.secure_url;
    await req.user.save();
    res.json({ success: true, data: { avatar: result.secure_url } });
  } catch (err) { next(err); }
});

router.patch('/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
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
    const notes = await Note.find({ userId }).select('cloudinaryUrl');
    await Promise.all([
      ...notes.map(note => {
        if (note.cloudinaryUrl) {
          const parts = note.cloudinaryUrl.split('/upload/');
          if (parts[1]) {
            const publicId = parts[1].replace(/\.[^.]+$/, '');
            return cloudinary.uploader.destroy(publicId).catch(() => {});
          }
        }
        return Promise.resolve();
      }),
      Note.deleteMany({ userId }),
      Comment.deleteMany({ userId }),
      Bookmark.deleteMany({ userId }),
      Rating.deleteMany({ userId }),
      Report.deleteMany({ reportedBy: userId }),
      Notification.deleteMany({ userId }),
    ]);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    await User.findByIdAndDelete(userId);
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) { next(err); }
});

export default router;
