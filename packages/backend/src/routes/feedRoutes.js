import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Types } from 'mongoose';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Follow from '../models/Follow.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticate, optionalAuth, authorizePermission } from '../middleware/auth.js';
import { sanitizeTextFields } from '../middleware/validate.js';
import { validate } from '../middleware/validate.js';
import { createPostSchema, updatePostSchema, createCommentSchema, updateProfileSchema } from '../validators/feedValidator.js';
import { uploadMedia } from '../middleware/upload.js';
import { uploadFiles, deleteFile } from '../utils/uploadCloudinary.js';
import { computeScore } from '../services/recommend.js';
import { logAudit } from '../services/auditLogger.js';
import { safeLimit } from '../utils/constants.js';

const router = Router();

const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many posts. Please slow down.' },
});

const likeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many actions. Please slow down.' },
});

const followLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many follow actions. Please slow down.' },
});

const POST_POPULATE = { path: 'author', select: 'fullname avatar username bio role' };

function authorToPublic(author) {
  if (!author) return undefined;
  if (typeof author.toPublicJSON === 'function') return author.toPublicJSON();
  const { _id, fullname, avatar, username, bio, role, followersCount, followingCount } = author;
  return { id: _id, fullname, avatar, username, bio, role, followersCount, followingCount };
}

function toFeedPost(post) {
  const p = {
    id: post._id,
    content: post.content,
    media: post.media || [],
    visibility: post.visibility,
    tags: post.tags || [],
    topic: post.topic || '',
    likesCount: post.likesCount || 0,
    commentsCount: post.commentsCount || 0,
    sharesCount: post.sharesCount || 0,
    viewsCount: post.viewsCount || 0,
    score: post.score || 0,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: authorToPublic(post.author),
  };
  return p;
}

// SSE live feed. Pushes new public posts as they are created.
const sseClients = new Set();

router.get('/stream', authenticate, (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write(`event: ready\ndata: ${JSON.stringify({ ok: true })}\n\n`);
  const client = res;
  sseClients.add(client);

  const ping = setInterval(() => {
    client.write(': ping\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(ping);
    sseClients.delete(client);
  });
});

export function broadcastPost(post) {
  const payload = `event: post\ndata: ${JSON.stringify(post)}\n\n`;
  for (const client of sseClients) {
    try { client.write(payload); } catch { /* drop */ }
  }
}

// Parse form-data fields that arrive as JSON strings (tags) before validation.
function parseMultipartBody(req, res, next) {
  if (req.body && typeof req.body.tags === 'string') {
    const raw = req.body.tags.trim();
    try {
      const parsed = JSON.parse(raw);
      req.body.tags = Array.isArray(parsed) ? parsed : [];
    } catch {
      // Tolerate unquoted client payloads like [study,motivation]
      const inner = raw.replace(/^\[|\]$/g, '').trim();
      req.body.tags = inner ? inner.split(',').map((t) => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean) : [];
    }
  }
  next();
}

// Create a post (text ± images/videos)
router.post('/posts', authenticate, postLimiter, uploadMedia.array('media', 8), sanitizeTextFields('content'), parseMultipartBody, validate(createPostSchema), async (req, res, next) => {
  try {
    let media = [];
    if (req.files && req.files.length) {
      const uploaded = await uploadFiles(req.files, 'noteunix/feed');
      media = uploaded.map((u, i) => ({
        url: u.url,
        fileType: u.fileType,
        fileSize: u.fileSize,
        publicId: u.publicId || '',
        kind: req.files[i].mimetype.startsWith('video/') ? 'video' : 'image',
      }));
    }

    if (!req.validatedBody.content && media.length === 0) {
      return res.status(400).json({ success: false, message: 'Post must have text or media' });
    }

    const post = await Post.create({
      author: req.user._id,
      content: req.validatedBody.content,
      media,
      visibility: req.validatedBody.visibility,
      tags: (req.validatedBody.tags || []).map((t) => t.toLowerCase().replace(/^#/, '').trim()).filter(Boolean),
      topic: req.validatedBody.topic || '',
    });

    post.score = computeScore(post, {});
    await post.save();

    await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } }).catch(() => {});

    await logAudit({ action: 'post_create', actor: req.user._id, targetId: post._id, targetType: 'post', ip: req.ip });
    const populated = await Post.findById(post._id).populate(POST_POPULATE);
    const summary = toFeedPost(populated);
    broadcastPost(summary);
    res.status(201).json({ success: true, data: summary });
  } catch (err) { next(err); }
});

// Feed with tabs + infinite scroll cursor
router.get('/feed', optionalAuth, async (req, res, next) => {
  try {
    const tab = ['for-you', 'following', 'new', 'top'].includes(req.query.tab) ? req.query.tab : 'for-you';
    const limit = safeLimit(req.query.limit, 20);
    const cursor = req.query.cursor || null;
    const viewerId = req.user?.id;

    let followingSet = null;
    if (viewerId && (tab === 'for-you' || tab === 'following')) {
      const following = await Follow.find({ follower: viewerId }).select('following').lean();
      followingSet = new Set(following.map((f) => f.following.toString()));
    }

    const match = { visibility: 'public' };
    if (tab === 'following') {
      if (!followingSet || followingSet.size === 0) {
        return res.json({ success: true, data: { posts: [], nextCursor: null, tab } });
      }
      match.author = { $in: Array.from(followingSet).map((id) => new Types.ObjectId(id)) };
    }
    if (cursor && tab !== 'top') {
      match._id = { $lt: new Types.ObjectId(cursor) };
    }
    if (tab === 'top') {
      match.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 3.6e6) };
    }

    let sort;
    if (tab === 'top') sort = { likesCount: -1, commentsCount: -1, createdAt: -1 };
    else if (tab === 'new') sort = { createdAt: -1 };
    else sort = { score: -1, createdAt: -1 };

    const posts = await Post.find(match).populate(POST_POPULATE).sort(sort).limit(limit + 1).lean();
    let nextCursor = null;
    if (posts.length > limit) {
      nextCursor = posts[limit]._id.toString();
      posts.length = limit;
    }

    const data = posts.map((p) => toFeedPost(p));
    res.json({ success: true, data: { posts: data, nextCursor, tab } });
  } catch (err) { next(err); }
});

// Single post + comments
router.get('/posts/:id', optionalAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate(POST_POPULATE);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.visibility === 'followers' && req.user?.id !== post.author._id.toString()) {
      const isFollower = await Follow.exists({ follower: req.user?.id, following: post.author._id });
      if (!isFollower) return res.status(403).json({ success: false, message: 'This post is for followers only' });
    }
    await Post.findByIdAndUpdate(post._id, { $inc: { viewsCount: 1 } });
    const comments = await Comment.find({ postId: post._id }).populate({ path: 'userId', select: 'fullname avatar username' }).sort({ createdAt: -1 }).lean();
    const summary = toFeedPost(post);
    res.json({ success: true, data: { post: summary, comments } });
  } catch (err) { next(err); }
});

router.patch('/posts/:id', authenticate, sanitizeTextFields('content'), validate(updatePostSchema), async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.author.toString() !== req.user.id && !req.user.hasPermission('feed:moderate')) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const fields = ['content', 'visibility', 'tags', 'topic'];
    for (const f of fields) {
      if (req.validatedBody[f] !== undefined) {
        post[f] = f === 'tags' ? req.validatedBody[f].map((t) => t.toLowerCase().replace(/^#/, '').trim()) : req.validatedBody[f];
      }
    }
    post.score = computeScore(post, {});
    await post.save();
    res.json({ success: true, data: post.toSummary() });
  } catch (err) { next(err); }
});

router.delete('/posts/:id', authenticate, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.author.toString() !== req.user.id && !req.user.hasPermission('feed:moderate')) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    await Promise.all((post.media || []).map((m) => m.publicId ? deleteFile(m.publicId).catch(() => {}) : Promise.resolve()));
    await Comment.deleteMany({ postId: post._id });
    await Post.findByIdAndDelete(post._id);
    await User.findByIdAndUpdate(post.author, { $inc: { postsCount: -1 } }).catch(() => {});
    await logAudit({ action: 'post_delete', actor: req.user._id, targetId: post._id, targetType: 'post', ip: req.ip });
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) { next(err); }
});

// Like / unlike a post
router.post('/posts/:id/like', authenticate, likeLimiter, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const liked = post.likes?.some?.((id) => id.toString() === req.user.id);
    let isLiked;
    if (liked) {
      post.likes = post.likes.filter((id) => id.toString() !== req.user.id);
      post.likesCount = Math.max(0, post.likesCount - 1);
      isLiked = false;
    } else {
      post.likes = post.likes || [];
      post.likes.push(req.user._id);
      post.likesCount += 1;
      isLiked = true;
      if (post.author.toString() !== req.user.id) {
        await Notification.create({
          userId: post.author,
          type: 'post_liked',
          title: 'New like',
          message: `${req.user.fullname} liked your post.`,
          link: `/community/post/${post._id}`,
        }).catch(() => {});
      }
    }
    post.score = computeScore(post, {});
    await post.save();
    res.json({ success: true, data: { isLiked, likesCount: post.likesCount } });
  } catch (err) { next(err); }
});

// Share a post (increments share count)
router.post('/posts/:id/share', authenticate, likeLimiter, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.sharesCount += 1;
    post.score = computeScore(post, {});
    await post.save();
    res.json({ success: true, data: { sharesCount: post.sharesCount } });
  } catch (err) { next(err); }
});

// Comment on a post
router.post('/posts/:id/comment', authenticate, likeLimiter, sanitizeTextFields('content'), validate(createCommentSchema), async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const comment = await Comment.create({ postId: post._id, userId: req.user._id, content: req.validatedBody.content });
    post.commentsCount += 1;
    post.score = computeScore(post, {});
    await post.save();
    const populated = await Comment.findById(comment._id).populate({ path: 'userId', select: 'fullname avatar username' });
    if (post.author.toString() !== req.user.id) {
      await Notification.create({
        userId: post.author,
        type: 'post_commented',
        title: 'New comment',
        message: `${req.user.fullname} commented on your post.`,
        link: `/community/post/${post._id}`,
      }).catch(() => {});
    }
    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
});

// Follow / unfollow a user
router.post('/users/:id/follow', authenticate, followLimiter, async (req, res, next) => {
  try {
    const idOrName = req.params.id;
    const isObjectId = Types.ObjectId.isValid(idOrName) && String(new Types.ObjectId(idOrName)) === idOrName;
    const target = isObjectId
      ? await User.findById(idOrName)
      : await User.findOne({ username: idOrName.toLowerCase() });
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    const targetId = target._id.toString();
    if (targetId === req.user.id) return res.status(400).json({ success: false, message: 'Cannot follow yourself' });

    const existing = await Follow.findOne({ follower: req.user.id, following: targetId });
    let isFollowing;
    if (existing) {
      await Follow.findByIdAndDelete(existing._id);
      await User.findByIdAndUpdate(req.user.id, { $inc: { followingCount: -1 } });
      await User.findByIdAndUpdate(targetId, { $inc: { followersCount: -1 } });
      isFollowing = false;
    } else {
      await Follow.create({ follower: req.user.id, following: targetId });
      await User.findByIdAndUpdate(req.user.id, { $inc: { followingCount: 1 } });
      await User.findByIdAndUpdate(targetId, { $inc: { followersCount: 1 } });
      isFollowing = true;
      await Notification.create({
        userId: targetId,
        type: 'new_follower',
        title: 'New follower',
        message: `${req.user.fullname} started following you.`,
        link: `/community/${target.username || target._id}`,
      }).catch(() => {});
    }
    const updated = await User.findById(targetId).select('followersCount followingCount');
    res.json({ success: true, data: { isFollowing, followersCount: updated.followersCount, followingCount: updated.followingCount } });
  } catch (err) { next(err); }
});

// A user's posts (profile) — accepts ObjectId or username
router.get('/users/:id/posts', optionalAuth, async (req, res, next) => {
  try {
    const viewerId = req.user?.id;
    const idOrName = req.params.id;
    const isObjectId = Types.ObjectId.isValid(idOrName) && String(new Types.ObjectId(idOrName)) === idOrName;
    const target = isObjectId
      ? await User.findById(idOrName)
      : await User.findOne({ username: idOrName.toLowerCase() });
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    const targetId = target._id.toString();
    const isSelf = viewerId === targetId;
    const match = { author: target._id };
    if (!isSelf) match.visibility = 'public';
    const posts = await Post.find(match).populate(POST_POPULATE).sort({ createdAt: -1 }).limit(60).lean();
    res.json({ success: true, data: { posts, user: target.toPublicJSON() } });
  } catch (err) { next(err); }
});

// Update own community profile (username, bio)
router.patch('/profile', authenticate, sanitizeTextFields('bio'), validate(updateProfileSchema), async (req, res, next) => {
  try {
    const update = {};
    if (req.validatedBody.username !== undefined) {
      const taken = await User.findOne({ username: req.validatedBody.username, _id: { $ne: req.user.id } });
      if (taken) return res.status(409).json({ success: false, message: 'Username already taken' });
      update.username = req.validatedBody.username;
    }
    if (req.validatedBody.bio !== undefined) update.bio = req.validatedBody.bio;
    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true });
    res.json({ success: true, data: user.toPublicJSON() });
  } catch (err) { next(err); }
});

// Search posts
router.get('/search', optionalAuth, async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (!q) return res.json({ success: true, data: { posts: [] } });
    const posts = await Post.find({
      visibility: 'public',
      $text: { $search: q },
    }).populate(POST_POPULATE).sort({ score: -1, createdAt: -1 }).limit(30).lean();
    res.json({ success: true, data: { posts } });
  } catch (err) { next(err); }
});

// Moderation: list all posts (admin + feed:moderate maintainers). Supports filter by author + search.
router.get('/admin/posts', authenticate, authorizePermission('feed:moderate'), async (req, res, next) => {
  try {
    const limit = safeLimit(req.query.limit, 30);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const match = {};
    if (req.query.author) match.author = new Types.ObjectId(req.query.author);
    if (req.query.q) {
      match.$or = [
        { content: { $regex: req.query.q, $options: 'i' } },
        { tags: { $in: [req.query.q.toLowerCase()] } },
      ];
    }
    const [posts, total] = await Promise.all([
      Post.find(match).populate(POST_POPULATE).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Post.countDocuments(match),
    ]);
    res.json({ success: true, data: { posts: posts.map(toFeedPost), total, page, limit } });
  } catch (err) { next(err); }
});

// Moderation: delete any post (admin + feed:moderate). Records audit + notifies author.
router.delete('/admin/posts/:id', authenticate, authorizePermission('feed:moderate'), async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    await Promise.all((post.media || []).map((m) => m.publicId ? deleteFile(m.publicId).catch(() => {}) : Promise.resolve()));
    await Comment.deleteMany({ postId: post._id });
    await Post.findByIdAndDelete(post._id);
    await User.findByIdAndUpdate(post.author, { $inc: { postsCount: -1 } }).catch(() => {});
    await Notification.create({
      userId: post.author,
      type: 'post_moderated',
      title: 'Post removed',
      message: `Your post was removed by a moderator.`,
      link: '/community',
    }).catch(() => {});
    await logAudit({ actor: req.user._id, action: 'post_moderate', targetType: 'post', targetId: post._id, ip: req.ip });
    res.json({ success: true, message: 'Post removed' });
  } catch (err) { next(err); }
});

export function getSseClients() { return sseClients; }

export default router;
