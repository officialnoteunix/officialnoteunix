import { Router } from 'express';
import University from '../models/University.js';
import Course from '../models/Course.js';
import Semester from '../models/Semester.js';
import Subject from '../models/Subject.js';
import { authenticate, authorize, authorizePermission } from '../middleware/auth.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { validate } from '../middleware/validate.js';
import { createContentSchema, updateContentSchema } from '../validators/adminValidator.js';
import { cascadeDeleteUniversity } from '../utils/cascadeDelete.js';
import { PERMISSIONS } from '../utils/constants.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = search ? { name: { $regex: escapeRegex(search), $options: 'i' } } : {};
    const universities = await University.find(query).sort({ name: 1 });
    res.json({ success: true, data: universities });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const university = await University.findById(req.params.id);
    if (!university) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: university });
  } catch (err) { next(err); }
});

router.get('/:id/courses', async (req, res, next) => {
  try {
    const query = { universityId: req.params.id };
    const courses = await Course.find(query).sort({ name: 1 });
    res.json({ success: true, data: courses });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorizePermission(PERMISSIONS.TAXONOMY_EDIT), validate(createContentSchema), async (req, res, next) => {
  try {
    const university = await University.create(req.validatedBody);
    res.status(201).json({ success: true, data: university });
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, authorizePermission(PERMISSIONS.TAXONOMY_EDIT), validate(updateContentSchema), async (req, res, next) => {
  try {
    const university = await University.findByIdAndUpdate(req.params.id, req.validatedBody, { new: true });
    if (!university) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: university });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const university = await University.findById(req.params.id);
    if (!university) return res.status(404).json({ success: false, message: 'Not found' });
    const result = await cascadeDeleteUniversity(University, Course, Semester, Subject, req.params.id);
    res.json({ success: true, message: 'Deleted', data: result });
  } catch (err) { next(err); }
});

export default router;
