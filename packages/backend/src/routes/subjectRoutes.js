import { Router } from 'express';
import Subject from '../models/Subject.js';
import Note from '../models/Note.js';
import { authenticate, authorize, authorizePermission } from '../middleware/auth.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { safeLimit, safePage, PERMISSIONS } from '../utils/constants.js';
import { validate } from '../middleware/validate.js';
import { createContentSchema, updateContentSchema } from '../validators/adminValidator.js';
import { cascadeDeleteSubject } from '../utils/cascadeDelete.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { search, semesterId } = req.query;
    const query = {};
    if (search) query.name = { $regex: escapeRegex(search), $options: 'i' };
    if (semesterId) query.semesterId = semesterId;
    const subjects = await Subject.find(query).sort({ name: 1 });
    res.json({ success: true, data: subjects });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id).populate({
      path: 'semesterId',
      populate: {
        path: 'courseId',
        populate: { path: 'universityId', select: 'name' },
      },
    });
    if (!subject) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: subject });
  } catch (err) { next(err); }
});

router.get('/:id/notes', async (req, res, next) => {
  try {
    const { page = 1, limit = 5, resourceType } = req.query;
    const safeLim = safeLimit(limit);
    const safePg = safePage(page);
    const query = { subjectId: req.params.id, approved: true };
    if (resourceType) query.resourceType = resourceType;
    const skip = (safePg - 1) * safeLim;
    const [notes, total] = await Promise.all([
      Note.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLim)
        .populate('userId', 'fullname avatar'),
      Note.countDocuments(query),
    ]);
    res.json({ success: true, data: { items: notes, total, page: safePg, limit: safeLim, totalPages: Math.ceil(total / safeLim) } });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorizePermission(PERMISSIONS.TAXONOMY_EDIT), validate(createContentSchema), async (req, res, next) => {
  try {
    const subject = await Subject.create(req.validatedBody);
    res.status(201).json({ success: true, data: subject });
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, authorizePermission(PERMISSIONS.TAXONOMY_EDIT), validate(updateContentSchema), async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.validatedBody, { new: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: subject });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Not found' });
    const result = await cascadeDeleteSubject(Subject, req.params.id);
    res.json({ success: true, message: 'Deleted', data: result });
  } catch (err) { next(err); }
});

export default router;
