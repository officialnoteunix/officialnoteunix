import { Router } from 'express';
import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import Note from '../models/Note.js';
import { authenticate, authorize, authorizePermission } from '../middleware/auth.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { safeLimit, safePage, PERMISSIONS } from '../utils/constants.js';
import { validate } from '../middleware/validate.js';
import { createContentSchema, updateContentSchema } from '../validators/adminValidator.js';
import { cascadeDeleteSubject } from '../utils/cascadeDelete.js';

const router = Router();

router.get('/discover', async (req, res, next) => {
  try {
    const { search, universityId, courseId, semesterId, page = 1, limit = 20 } = req.query;
    const safeLim = safeLimit(limit, 20);
    const safePg = safePage(page);

    const matchStage = {};
    if (search) matchStage.name = { $regex: escapeRegex(search), $options: 'i' };
    if (semesterId) matchStage.semesterId = new mongoose.Types.ObjectId(semesterId);

    const pipeline = [];

    if (matchStage.name || matchStage.semesterId) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'semesters',
          localField: 'semesterId',
          foreignField: '_id',
          as: 'semester',
        },
      },
      { $unwind: '$semester' },
    );

    if (courseId) {
      pipeline.push({ $match: { 'semester.courseId': new mongoose.Types.ObjectId(courseId) } });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'courses',
          localField: 'semester.courseId',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: '$course' },
    );

    if (universityId) {
      pipeline.push({ $match: { 'course.universityId': new mongoose.Types.ObjectId(universityId) } });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'universities',
          localField: 'course.universityId',
          foreignField: '_id',
          as: 'university',
        },
      },
      { $unwind: { path: '$university', preserveNullAndEmptyArrays: true } },
    );

    pipeline.push(
      {
        $lookup: {
          from: 'notes',
          let: { subjectId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$subjectId', '$$subjectId'] }, approved: true } },
            {
              $group: {
                _id: null,
                totalNotes: { $sum: 1 },
                totalDownloads: { $sum: '$downloads' },
                avgRating: { $avg: '$averageRating' },
                ratingsCount: { $sum: '$ratingsCount' },
                resourceTypes: {
                  $push: '$resourceType',
                },
              },
            },
          ],
          as: 'noteStats',
        },
      },
      {
        $addFields: {
          noteStats: { $arrayElemAt: ['$noteStats', 0] },
        },
      },
      {
        $addFields: {
          totalNotes: { $ifNull: ['$noteStats.totalNotes', 0] },
          totalDownloads: { $ifNull: ['$noteStats.totalDownloads', 0] },
          averageRating: { $round: [{ $ifNull: ['$noteStats.avgRating', 0] }, 1] },
          ratingsCount: { $ifNull: ['$noteStats.ratingsCount', 0] },
          resourceTypeCounts: {
            $let: {
              vars: { types: { $ifNull: ['$noteStats.resourceTypes', []] } },
              in: {
                $map: {
                  input: [
                    'study_notes', 'past_question', 'assignment', 'lab_report',
                    'practical_file', 'reference_book', 'syllabus', 'study_guide',
                    'important_question', 'mcq', 'department_resource',
                  ],
                  as: 'rt',
                  in: {
                    type: '$$rt',
                    count: {
                      $size: {
                        $filter: {
                          input: '$$types',
                          cond: { $eq: ['$$this', '$$rt'] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          code: 1,
          slug: 1,
          description: 1,
          totalNotes: 1,
          totalDownloads: 1,
          averageRating: 1,
          ratingsCount: 1,
          resourceTypeCounts: 1,
          semester: { _id: 1, title: 1, semesterNumber: 1 },
          course: { _id: 1, name: 1, slug: 1 },
          university: { _id: 1, name: 1, slug: 1 },
        },
      },
      { $sort: { totalDownloads: -1, name: 1 } },
    );

    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Subject.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    pipeline.push(
      { $skip: (safePg - 1) * safeLim },
      { $limit: safeLim },
    );

    const subjects = await Subject.aggregate(pipeline);

    res.json({
      success: true,
      data: {
        items: subjects,
        total,
        page: safePg,
        limit: safeLim,
        totalPages: Math.ceil(total / safeLim),
      },
    });
  } catch (err) { next(err); }
});

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

    const stats = await Note.aggregate([
      { $match: { subjectId: subject._id, approved: true } },
      {
        $group: {
          _id: '$resourceType',
          count: { $sum: 1 },
          totalDownloads: { $sum: '$downloads' },
          avgRating: { $avg: '$averageRating' },
        },
      },
    ]);

    const totalNotes = stats.reduce((sum, s) => sum + s.count, 0);
    const totalDownloads = stats.reduce((sum, s) => sum + s.totalDownloads, 0);
    const allRatings = stats.reduce((sum, s) => sum + (s.avgRating || 0) * s.count, 0);
    const averageRating = totalNotes > 0 ? Math.round((allRatings / totalNotes) * 10) / 10 : 0;

    const resourceTypeCounts = stats.map(s => ({
      type: s._id,
      count: s.count,
      totalDownloads: s.totalDownloads,
    }));

    const subjectObj = subject.toObject();
    subjectObj.stats = { totalNotes, totalDownloads, averageRating, resourceTypeCounts };

    res.json({ success: true, data: subjectObj });
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
