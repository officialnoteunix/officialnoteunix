import { Router } from 'express';
import https from 'https';
import rateLimit from 'express-rate-limit';
import Note from '../models/Note.js';
import Comment from '../models/Comment.js';
import Bookmark from '../models/Bookmark.js';
import Rating from '../models/Rating.js';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload, validatePdfBuffer } from '../middleware/upload.js';
import { createNoteSchema, updateNoteSchema } from '../validators/noteValidator.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { safeLimit, safePage, EXT_TO_MIME } from '../utils/constants.js';
import { uploadFiles, uploadThumbnail, deleteFile, deleteNoteFiles, extractPublicId } from '../utils/uploadCloudinary.js';

const downloadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many downloads, slow down' },
});

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { subjectId, search, resourceType, page = 1, limit = 20 } = req.query;
    const safeLim = safeLimit(limit);
    const safePg = safePage(page);
    const query = { approved: true };
    if (subjectId) query.subjectId = subjectId;
    if (resourceType) query.resourceType = resourceType;
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

router.get('/:id/related', async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id).select('subjectId');
    if (!note) return res.status(404).json({ success: false, message: 'Not found' });
    const related = await Note.find({
      _id: { $ne: note._id },
      subjectId: note.subjectId,
      approved: true,
    })
      .sort({ downloads: -1 })
      .limit(4)
      .populate('userId', 'fullname avatar')
      .populate('subjectId', 'name');
    res.json({ success: true, data: related });
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

router.post('/', authenticate, upload.fields([
  { name: 'files', maxCount: 10 },
  { name: 'thumbnail', maxCount: 1 },
]), validate(createNoteSchema), async (req, res, next) => {
  try {
    const uploaded = req.files?.files || [];
    if (!uploaded.length) {
      return res.status(400).json({ success: false, message: 'At least one file is required' });
    }

    for (const f of uploaded) {
      if (f.mimetype === 'application/pdf' && !validatePdfBuffer(f.buffer)) {
        return res.status(400).json({ success: false, message: `File "${f.originalname}" is not a valid PDF` });
      }
    }

    let files;
    let thumbnailUrl = '';
    try {
      files = await uploadFiles(uploaded);
      const thumbFile = req.files?.thumbnail?.[0];
      if (thumbFile) {
        thumbnailUrl = await uploadThumbnail(thumbFile.buffer);
      }
    } catch (uploadErr) {
      if (files?.length) {
        await Promise.all(files.map(f => {
          const pid = extractPublicId(f.url);
          return pid ? deleteFile(pid).catch(() => {}) : Promise.resolve();
        }));
      }
      throw uploadErr;
    }

    let note;
    try {
      note = await Note.create({
        subjectId: req.validatedBody.subjectId,
        userId: req.user._id,
        title: req.validatedBody.title,
        description: req.validatedBody.description,
        resourceType: req.validatedBody.resourceType,
        files,
        thumbnailUrl,
      });
    } catch (dbErr) {
      await Promise.all(files.map(f => {
        const pid = extractPublicId(f.url);
        return pid ? deleteFile(pid).catch(() => {}) : Promise.resolve();
      }));
      if (thumbnailUrl) {
        const pid = extractPublicId(thumbnailUrl);
        if (pid) await deleteFile(pid).catch(() => {});
      }
      throw dbErr;
    }

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

router.patch('/:id', authenticate, (req, res, next) => {
  if (req.is('multipart/form-data')) {
    upload.fields([
      { name: 'files', maxCount: 10 },
      { name: 'thumbnail', maxCount: 1 },
    ])(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  } else {
    next();
  }
}, validate(updateNoteSchema), async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Not found' });
    if (note.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updates = { ...req.validatedBody };

    const uploaded = req.files?.files || [];
    if (uploaded.length) {
      for (const f of uploaded) {
        if (f.mimetype === 'application/pdf' && !validatePdfBuffer(f.buffer)) {
          return res.status(400).json({ success: false, message: `File "${f.originalname}" is not a valid PDF` });
        }
      }
      const oldFiles = note.files?.length ? [...note.files] : [];
      const oldThumb = note.thumbnailUrl || '';
      updates.files = await uploadFiles(uploaded);
      await Promise.all(oldFiles.map(f => {
        const pid = extractPublicId(f.url);
        return pid ? deleteFile(pid).catch(() => {}) : Promise.resolve();
      }));
      if (oldThumb) {
        const pid = extractPublicId(oldThumb);
        if (pid) await deleteFile(pid).catch(() => {});
      }
    }

    const thumbFile = req.files?.thumbnail?.[0];
    if (thumbFile) {
      const oldThumb = note.thumbnailUrl || '';
      updates.thumbnailUrl = await uploadThumbnail(thumbFile.buffer);
      if (oldThumb) {
        const pid = extractPublicId(oldThumb);
        if (pid) await deleteFile(pid).catch(() => {});
      }
    }

    Object.assign(note, updates);
    await note.save();
    res.json({ success: true, data: note });
  } catch (err) { next(err); }
});

router.post('/:id/download', optionalAuth, downloadLimiter, async (req, res, next) => {
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

router.get('/:id/download/file/:fileIdx(\\d+)?', optionalAuth, downloadLimiter, async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Not found' });
    if (!note.approved) return res.status(404).json({ success: false, message: 'Not found' });

    const fileIdx = parseInt(req.params.fileIdx || '0', 10);
    let fileUrl, ext;
    if (note.files?.length) {
      const f = note.files[fileIdx];
      if (!f) return res.status(404).json({ success: false, message: 'File not found' });
      fileUrl = f.url;
      ext = f.fileType || 'pdf';
    } else {
      const raw = note._doc || {};
      if (!raw.cloudinaryUrl) return res.status(404).json({ success: false, message: 'File not found' });
      fileUrl = raw.cloudinaryUrl;
      ext = raw.fileType || (raw.cloudinaryUrl.split('?')[0].split('.').pop()?.toLowerCase() || 'pdf');
    }

    const filename = `${note.title.replace(/[^a-zA-Z0-9 ]/g, '_')}.${ext}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', EXT_TO_MIME[ext] || 'application/octet-stream');

    https.get(fileUrl, (cloudRes) => {
      if (cloudRes.statusCode >= 300 && cloudRes.headers.location) {
        https.get(cloudRes.headers.location, (redirectRes) => redirectRes.pipe(res));
        return;
      }
      cloudRes.pipe(res);
    });
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
    await deleteNoteFiles(note);
    await Note.findByIdAndDelete(note._id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;
