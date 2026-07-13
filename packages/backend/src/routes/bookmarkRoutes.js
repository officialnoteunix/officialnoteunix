import { Router } from 'express';
import Bookmark from '../models/Bookmark.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { safeLimit, safePage } from '../utils/constants.js';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const safeLim = safeLimit(limit);
    const safePg = safePage(page);
    const skip = (safePg - 1) * safeLim;
    const [bookmarks, total] = await Promise.all([
      Bookmark.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLim)
        .populate({
          path: 'noteId',
          populate: { path: 'subjectId', select: 'name slug' },
        }),
      Bookmark.countDocuments({ userId: req.user._id }),
    ]);
    res.json({
      success: true,
      data: {
        items: bookmarks.map(b => ({ ...b.noteId.toObject(), bookmarkedAt: b.createdAt })),
        total,
        page: safePg,
        limit: safeLim,
        totalPages: Math.ceil(total / safeLim),
      },
    });
  } catch (err) { next(err); }
});

router.post('/:noteId', authenticate, async (req, res, next) => {
  try {
    const existing = await Bookmark.findOne({ userId: req.user._id, noteId: req.params.noteId });
    if (existing) {
      await Bookmark.findByIdAndDelete(existing._id);
      return res.json({ success: true, data: { bookmarked: false } });
    }
    await Bookmark.create({ userId: req.user._id, noteId: req.params.noteId });
    res.json({ success: true, data: { bookmarked: true } });
  } catch (err) { next(err); }
});

router.get('/:noteId/check', optionalAuth, async (req, res, next) => {
  try {
    if (!req.user) return res.json({ success: true, data: { bookmarked: false } });
    const bookmark = await Bookmark.findOne({ userId: req.user._id, noteId: req.params.noteId });
    res.json({ success: true, data: { bookmarked: !!bookmark } });
  } catch (err) { next(err); }
});

export default router;
