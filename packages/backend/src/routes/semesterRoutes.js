import { Router } from 'express';
import Semester from '../models/Semester.js';
import Subject from '../models/Subject.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createContentSchema, updateContentSchema } from '../validators/adminValidator.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const query = courseId ? { courseId } : {};
    const semesters = await Semester.find(query).sort({ semesterNumber: 1 });
    res.json({ success: true, data: semesters });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const semester = await Semester.findById(req.params.id).populate('courseId', 'name slug');
    if (!semester) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: semester });
  } catch (err) { next(err); }
});

router.get('/:id/subjects', async (req, res, next) => {
  try {
    const query = { semesterId: req.params.id };
    const subjects = await Subject.find(query).sort({ name: 1 });
    res.json({ success: true, data: subjects });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('admin'), validate(createContentSchema), async (req, res, next) => {
  try {
    const semester = await Semester.create(req.validatedBody);
    res.status(201).json({ success: true, data: semester });
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, authorize('admin'), validate(updateContentSchema), async (req, res, next) => {
  try {
    const semester = await Semester.findByIdAndUpdate(req.params.id, req.validatedBody, { new: true });
    if (!semester) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: semester });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await Semester.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;
