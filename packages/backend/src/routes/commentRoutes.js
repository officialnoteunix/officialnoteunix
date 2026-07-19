import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import Comment from '../models/Comment.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate, sanitizeTextFields } from '../middleware/validate.js';
import { createCommentSchema, replyCommentSchema } from '../validators/commentValidator.js';

const router = Router();

const commentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many comments. Please slow down.' },
});

const populateUser = [{ path: 'userId', select: 'fullname email avatar' }];

router.get('/note/:noteId', optionalAuth, async (req, res, next) => {
  try {
    const comments = await Comment.find({ noteId: req.params.noteId })
      .populate(populateUser)
      .sort({ createdAt: -1 })
      .lean();

    const topLevel = comments.filter(c => !c.parentComment);
    const replyMap = {};
    for (const c of comments) {
      if (c.parentComment) {
        const parentId = c.parentComment.toString();
        if (!replyMap[parentId]) replyMap[parentId] = [];
        replyMap[parentId].push(c);
      }
    }

    for (const c of topLevel) {
      c.replies = (replyMap[c._id.toString()] || []).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    res.json({ success: true, data: topLevel });
  } catch (err) { next(err); }
});

router.post('/note/:noteId', authenticate, commentLimiter, sanitizeTextFields('content'), validate(createCommentSchema), async (req, res, next) => {
  try {
    const comment = await Comment.create({
      noteId: req.params.noteId,
      userId: req.user.id,
      content: req.validatedBody.content,
    });
    const populated = await Comment.findById(comment._id).populate(populateUser);
    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
});

router.post('/:id/reply', authenticate, commentLimiter, sanitizeTextFields('content'), validate(replyCommentSchema), async (req, res, next) => {
  try {
    const parent = await Comment.findById(req.params.id);
    if (!parent) return res.status(404).json({ success: false, message: 'Comment not found' });

    const reply = await Comment.create({
      noteId: parent.noteId,
      userId: req.user.id,
      content: req.validatedBody.content,
      parentComment: parent._id,
    });
    const populated = await Comment.findById(reply._id).populate(populateUser);
    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
});

router.post('/:id/like', authenticate, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const userId = req.user.id;
    const idx = comment.likes.findIndex(id => id.toString() === userId);
    if (idx > -1) comment.likes.splice(idx, 1);
    else comment.likes.push(userId);

    await comment.save();
    res.json({ success: true, data: { likes: comment.likes, likesCount: comment.likes.length } });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.userId.toString() !== req.user.id && !req.user.hasPermission('comment:moderate')) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    await Comment.deleteMany({ parentComment: comment._id });
    await Comment.findByIdAndDelete(comment._id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;
