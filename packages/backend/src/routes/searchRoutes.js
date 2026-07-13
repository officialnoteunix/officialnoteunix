import { Router } from 'express';
import University from '../models/University.js';
import Course from '../models/Course.js';
import Subject from '../models/Subject.js';
import Note from '../models/Note.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { safeLimit, safePage } from '../utils/constants.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { q, notePage = 1, noteLimit = 10 } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: { universities: [], courses: [], subjects: [], notes: [], notesTotal: 0, notesTotalPages: 0 } });
    }
    const escaped = escapeRegex(q);
    const regex = { $regex: escaped, $options: 'i' };
    const safeLim = safeLimit(noteLimit);
    const safePg = safePage(notePage);
    const noteSkip = (safePg - 1) * safeLim;
    const [universities, courses, subjects, notes, notesTotal] = await Promise.all([
      University.find({ name: regex }).limit(5),
      Course.find({ name: regex }).limit(5).populate('universityId', 'name'),
      Subject.find({ name: regex }).limit(5).populate({ path: 'semesterId', populate: { path: 'courseId', select: 'name' } }),
      Note.find({ $or: [{ title: regex }, { description: regex }], approved: true })
        .sort({ createdAt: -1 })
        .skip(noteSkip)
        .limit(safeLim)
        .populate('userId', 'fullname avatar'),
      Note.countDocuments({ $or: [{ title: regex }, { description: regex }], approved: true }),
    ]);
    res.json({
      success: true,
      data: {
        universities, courses, subjects, notes,
        notesTotal,
        notesPage: safePg,
        notesTotalPages: Math.ceil(notesTotal / safeLim),
      },
    });
  } catch (err) { next(err); }
});

export default router;
