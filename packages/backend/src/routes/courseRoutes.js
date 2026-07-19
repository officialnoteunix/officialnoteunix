import { Router } from 'express';
import Course from '../models/Course.js';
import Semester from '../models/Semester.js';
import Subject from '../models/Subject.js';
import { authenticate, authorize, authorizePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createContentSchema, updateContentSchema } from '../validators/adminValidator.js';
import { cascadeDeleteCourse } from '../utils/cascadeDelete.js';
import { PERMISSIONS } from '../utils/constants.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { universityId } = req.query;
    const query = universityId ? { universityId } : {};
    const courses = await Course.find(query).sort({ name: 1 });
    res.json({ success: true, data: courses });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate('universityId', 'name slug');
    if (!course) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: course });
  } catch (err) { next(err); }
});

router.get('/:id/semesters', async (req, res, next) => {
  try {
    const query = { courseId: req.params.id };
    const semesters = await Semester.find(query).sort({ semesterNumber: 1 });
    res.json({ success: true, data: semesters });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorizePermission(PERMISSIONS.TAXONOMY_EDIT), validate(createContentSchema), async (req, res, next) => {
  try {
    const course = await Course.create(req.validatedBody);
    res.status(201).json({ success: true, data: course });
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, authorizePermission(PERMISSIONS.TAXONOMY_EDIT), validate(updateContentSchema), async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.validatedBody, { new: true });
    if (!course) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: course });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Not found' });
    const result = await cascadeDeleteCourse(Course, Semester, Subject, req.params.id);
    res.json({ success: true, message: 'Deleted', data: result });
  } catch (err) { next(err); }
});

export default router;
