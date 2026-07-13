import { Router } from 'express';
import University from '../models/University.js';
import Note from '../models/Note.js';
import User from '../models/User.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const [recentNotes, featuredUniversities, stats] = await Promise.all([
      Note.find({ approved: true }).sort({ createdAt: -1 }).limit(10).populate('userId', 'fullname avatar'),
      University.find().limit(6),
      Promise.all([
        Note.countDocuments({ approved: true }),
        User.countDocuments({ role: 'student' }),
        University.countDocuments(),
      ]),
    ]);
    res.json({
      success: true,
      data: {
        recentNotes,
        featuredUniversities,
        stats: {
          totalNotes: stats[0],
          totalStudents: stats[1],
          totalUniversities: stats[2],
        },
      },
    });
  } catch (err) { next(err); }
});

export default router;
