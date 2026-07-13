import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import Note from '../models/Note.js';
import Comment from '../models/Comment.js';
import Bookmark from '../models/Bookmark.js';
import Rating from '../models/Rating.js';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import cloudinary from '../config/cloudinary.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload, validatePdfBuffer } from '../middleware/upload.js';
import { createNoteSchema, updateNoteSchema } from '../validators/noteValidator.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { safeLimit, safePage } from '../utils/constants.js';

const downloadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many downloads, slow down' },
});

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { subjectId, courseId, universityId, search, page = 1, limit = 20 } = req.query;
    const safeLim = safeLimit(limit);
    const safePg = safePage(page);
    const query = { approved: true };
    if (subjectId) query.subjectId = subjectId;
    if (search) {
      const escaped = escapeRegex(search);
      query.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    }
    const skip = (safePg - 1) * safeLim;
    const [notes, total] = await Promise.all([
      Note.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLim)
        .populate('userId', 'fullname avatar')
        .populate('subjectId', 'name slug'),
      Note.countDocuments(query),
    ]);
    res.json({
      success: true,
      data: {
        items: notes,
        total,
        page: safePg,
        limit: safeLim,
        totalPages: Math.ceil(total / safeLim),
      },
    });
  } catch (err) { next(err); }
});

router.get('/my', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const safeLim = safeLimit(limit);
    const safePg = safePage(page);
    const query = { userId: req.user._id };
    const skip = (safePg - 1) * safeLim;
    const [notes, total] = await Promise.all([
      Note.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLim)
        .populate('subjectId', 'name slug')
        .populate('userId', 'fullname avatar'),
      Note.countDocuments(query),
    ]);
    res.json({ success: true, data: { items: notes, total, page: safePg, limit: safeLim, totalPages: Math.ceil(total / safeLim) } });
  } catch (err) { next(err); }
});

router.get('/top', async (req, res, next) => {
  try {
    const { type = 'downloads', limit = 10 } = req.query;
    const safeLim = safeLimit(limit);
    let sort = {};
    if (type === 'ratings') sort = { averageRating: -1, ratingsCount: -1 };
    else sort = { downloads: -1 };

    const notes = await Note.find({ approved: true })
      .sort(sort)
      .limit(safeLim)
      .populate('userId', 'fullname avatar')
      .populate('subjectId', 'name slug');

    res.json({ success: true, data: notes });
  } catch (err) { next(err); }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('userId', 'fullname avatar')
      .populate({
        path: 'subjectId',
        populate: {
          path: 'semesterId',
          populate: {
            path: 'courseId',
            populate: { path: 'universityId' },
          },
        },
      });
    if (!note) return res.status(404).json({ success: false, message: 'Not found' });
    const isOwner = req.user && note.userId._id.toString() === req.user._id.toString();
    const isAdmin = req.user?.role === 'admin';
    if (!note.approved && !isOwner && !isAdmin) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, data: note });
  } catch (err) { next(err); }
});

router.get('/:id/share', async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('userId', 'fullname avatar')
      .populate('subjectId', 'name slug');
    if (!note) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({
      success: true,
      data: {
        title: note.title,
        description: note.description,
        averageRating: note.averageRating,
        authorName: note.userId?.fullname,
        downloads: note.downloads,
        cloudinaryUrl: note.cloudinaryUrl,
        subjectName: note.subjectId?.name,
      },
    });
  } catch (err) { next(err); }
});

router.post('/', authenticate, upload.single('file'), validate(createNoteSchema), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }
    if (!validatePdfBuffer(req.file.buffer)) {
      return res.status(400).json({ success: false, message: 'File content does not match PDF format' });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'noteunix/notes', resource_type: 'auto' },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(req.file.buffer);
    });
    const note = await Note.create({
      subjectId: req.validatedBody.subjectId,
      userId: req.user._id,
      title: req.validatedBody.title,
      description: req.validatedBody.description,
      cloudinaryUrl: result.secure_url,
      fileType: 'pdf',
      fileSize: req.file.size,
    });

    await Notification.create({
      userId: req.user._id,
      type: 'note_uploaded',
      title: 'Note Uploaded',
      message: `"${note.title}" has been uploaded and is pending approval.`,
      link: `/user/dashboard`,
    });

    res.status(201).json({ success: true, data: note });
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, validate(updateNoteSchema), async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Not found' });
    if (note.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    Object.assign(note, req.validatedBody);
    await note.save();
    res.json({ success: true, data: note });
  } catch (err) { next(err); }
});

router.post('/:id/download', authenticate, downloadLimiter, async (req, res, next) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );
    if (!note) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: { downloads: note.downloads } });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Not found' });
    if (note.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await Promise.all([
      Comment.deleteMany({ noteId: note._id }),
      Bookmark.deleteMany({ noteId: note._id }),
      Rating.deleteMany({ noteId: note._id }),
      Report.deleteMany({ note: note._id }),
    ]);
    if (note.cloudinaryUrl) {
      try {
        const parts = note.cloudinaryUrl.split('/upload/');
        if (parts[1]) {
          const publicId = parts[1].replace(/\.[^.]+$/, '');
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (cloudErr) {
        console.warn('Cloudinary delete failed for note', note._id, cloudErr.message);
      }
    }
    await Note.findByIdAndDelete(note._id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;
