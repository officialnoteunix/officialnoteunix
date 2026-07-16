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
    const { q, resourceType, notePage = 1, noteLimit = 10 } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: { universities: [], courses: [], subjects: [], notes: [], notesTotal: 0, notesTotalPages: 0 } });
    }
    const escaped = escapeRegex(q);
    const regex = { $regex: escaped, $options: 'i' };
    const safeLim = safeLimit(noteLimit);
    const safePg = safePage(notePage);
    const noteQuery = { $or: [{ title: regex }, { description: regex }], approved: true };
    if (resourceType) noteQuery.resourceType = resourceType;
    const noteSkip = (safePg - 1) * safeLim;
    const [unis, courses, subjects, notes, notesTotal] = await Promise.all([
      University.find({ name: regex }).limit(5),
      Course.find({ name: regex }).limit(5).populate('universityId', 'name'),
      Subject.find({ $or: [{ name: regex }, { code: regex }] }).limit(5).populate({ path: 'semesterId', populate: { path: 'courseId', select: 'name' } }),
      Note.find(noteQuery)
        .sort({ createdAt: -1 })
        .skip(noteSkip)
        .limit(safeLim)
        .populate('userId', 'fullname avatar'),
      Note.countDocuments(noteQuery),
    ]);
    const uniIds = unis.map(u => u._id);
    let coursesFromUnis = [];
    if (uniIds.length > 0) {
      coursesFromUnis = await Course.find({ universityId: { $in: uniIds }, _id: { $nin: courses.map(c => c._id) } }).limit(5).populate('universityId', 'name');
    }
    const universities = unis;
    const allCourses = [...courses, ...coursesFromUnis];
    res.json({
      success: true,
      data: {
        universities, courses: allCourses, subjects, notes,
        notesTotal,
        notesPage: safePg,
        notesTotalPages: Math.ceil(notesTotal / safeLim),
      },
    });
  } catch (err) { next(err); }
});

router.get('/autocomplete', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }
    const escaped = escapeRegex(q);
    const regex = { $regex: escaped, $options: 'i' };
    const [universities, courses, subjects, notes] = await Promise.all([
      University.find({ name: regex }).limit(3).select('name'),
      Course.find({ name: regex }).limit(3).select('name universityId').populate('universityId', 'name'),
      Subject.find({ name: regex }).limit(3).select('name code'),
      Note.find({ title: regex, approved: true }).limit(3).select('title'),
    ]);
    const suggestions = [
      ...universities.map(u => ({ _id: u._id, name: u.name, label: u.name, type: 'university' })),
      ...courses.map(c => ({ _id: c._id, name: c.name, label: `${c.name} — ${c.universityId?.name || ''}`, type: 'course' })),
      ...subjects.map(s => ({ _id: s._id, name: s.name, label: `${s.name}${s.code ? ` (${s.code})` : ''}`, type: 'subject' })),
      ...notes.map(n => ({ _id: n._id, name: n.title, label: n.title, type: 'note' })),
    ];
    res.json({ success: true, data: suggestions });
  } catch (err) { next(err); }
});

export default router;
