import { Router } from 'express';
import Note from '../models/Note.js';
import User from '../models/User.js';
import Ad from '../models/Ad.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/overview', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      totalNotes, totalUsers, totalDownloads,
      notesByMonth, usersByMonth,
      topNotes, topUsers,
      ads,
    ] = await Promise.all([
      Note.countDocuments(),
      User.countDocuments(),
      Note.aggregate([{ $group: { _id: null, total: { $sum: '$downloads' } } }]),
      Note.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Note.find().sort({ downloads: -1 }).limit(5).select('title downloads createdAt'),
      User.find().sort({ createdAt: -1 }).limit(5).select('fullname email createdAt'),
      Ad.find().select('slot imageUrl description impressions clicks'),
    ]);

    const monthlyDownloads = await Note.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, downloads: { $sum: '$downloads' } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalNotes,
        totalUsers,
        totalDownloads: totalDownloads[0]?.total || 0,
        notesByMonth,
        usersByMonth,
        monthlyDownloads,
        topNotes,
        topUsers,
        ads: ads.map(a => ({
          _id: a._id,
          slot: a.slot,
          imageUrl: a.imageUrl,
          description: a.description,
          impressions: a.impressions,
          clicks: a.clicks,
          ctr: a.impressions > 0 ? ((a.clicks / a.impressions) * 100).toFixed(2) : '0.00',
        })),
      },
    });
  } catch (err) { next(err); }
});

export default router;
