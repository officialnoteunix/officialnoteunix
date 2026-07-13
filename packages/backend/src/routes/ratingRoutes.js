import { Router } from 'express';
import Rating from '../models/Rating.js';
import Note from '../models/Note.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/:noteId', authenticate, async (req, res, next) => {
  try {
    const { value } = req.body;
    if (!value || value < 1 || value > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    const note = await Note.findById(req.params.noteId);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    const existing = await Rating.findOne({ noteId: req.params.noteId, userId: req.user._id });
    if (existing) {
      existing.value = value;
      await existing.save();
    } else {
      await Rating.create({ noteId: req.params.noteId, userId: req.user._id, value });
    }

    const stats = await Rating.aggregate([
      { $match: { noteId: note._id } },
      { $group: { _id: null, average: { $avg: '$value' }, count: { $sum: 1 } } },
    ]);

    const avg = stats[0] ? Math.round(stats[0].average * 10) / 10 : 0;
    const cnt = stats[0] ? stats[0].count : 0;

    await Note.findByIdAndUpdate(note._id, { averageRating: avg, ratingsCount: cnt });

    const userRating = await Rating.findOne({ noteId: req.params.noteId, userId: req.user._id });

    res.json({
      success: true,
      data: {
        rating: userRating ? userRating.value : null,
        averageRating: avg,
        ratingsCount: cnt,
      },
    });
  } catch (err) { next(err); }
});

router.get('/:noteId', optionalAuth, async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.noteId).select('averageRating ratingsCount');
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    let userRating = null;
    if (req.user) {
      const r = await Rating.findOne({ noteId: req.params.noteId, userId: req.user._id });
      if (r) userRating = r.value;
    }

    res.json({
      success: true,
      data: {
        rating: userRating,
        averageRating: note.averageRating,
        ratingsCount: note.ratingsCount,
      },
    });
  } catch (err) { next(err); }
});

export default router;
