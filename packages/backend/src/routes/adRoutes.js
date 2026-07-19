import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import Ad from '../models/Ad.js';
import { authenticate, authorize, authorizePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createAdSchema, updateAdSchema } from '../validators/adminValidator.js';
import { logAudit } from '../services/auditLogger.js';
import { PERMISSIONS } from '../utils/constants.js';

const impressionLimiter = rateLimit({
  windowMs: 1000,
  max: 1,
  keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  message: { success: false, message: 'Too many ad impression requests, try again later' },
});

const clickLimiter = rateLimit({
  windowMs: 5000,
  max: 1,
  keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  message: { success: false, message: 'Too many ad click requests, try again later' },
});

const router = Router();

router.get('/active', async (req, res, next) => {
  try {
    const now = new Date();
    const ads = await Ad.find({
      active: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
    const bySlot = {};
    for (const ad of ads) {
      if (!bySlot[ad.slot]) bySlot[ad.slot] = [];
      bySlot[ad.slot].push(ad);
    }
    res.json({ success: true, data: bySlot });
  } catch (err) { next(err); }
});

router.get('/active/:slot', async (req, res, next) => {
  try {
    const now = new Date();
    const ads = await Ad.find({
      slot: req.params.slot,
      active: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
    res.json({ success: true, data: ads });
  } catch (err) { next(err); }
});

router.get('/', authenticate, authorizePermission(PERMISSIONS.AD_MANAGE), async (req, res, next) => {
  try {
    const ads = await Ad.find().sort({ createdAt: -1 });
    res.json({ success: true, data: ads });
  } catch (err) { next(err); }
});

router.get('/stats/full', authenticate, authorizePermission(PERMISSIONS.AD_MANAGE), async (req, res, next) => {
  try {
    const ads = await Ad.find();
    const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);
    const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);
    res.json({
      success: true,
      data: {
        ads,
        totals: { impressions: totalImpressions, clicks: totalClicks },
        ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00',
      },
    });
  } catch (err) { next(err); }
});

router.get('/stats/range', authenticate, authorizePermission(PERMISSIONS.AD_MANAGE), async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const query = {};
    if (start && !isNaN(Date.parse(start))) query.startDate = { $gte: new Date(start) };
    if (end && !isNaN(Date.parse(end))) query.endDate = { $lte: new Date(end) };
    const ads = await Ad.find(query);
    res.json({ success: true, data: ads });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, authorizePermission(PERMISSIONS.AD_MANAGE), async (req, res, next) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: ad });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorizePermission(PERMISSIONS.AD_MANAGE), validate(createAdSchema), async (req, res, next) => {
  try {
    const { slot, imageUrl, linkUrl, description, startDate, endDate, active } = req.validatedBody;
    const ad = await Ad.create({ slot, imageUrl, linkUrl, description, startDate, endDate, active });
    res.status(201).json({ success: true, data: ad });
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, authorizePermission(PERMISSIONS.AD_MANAGE), validate(updateAdSchema), async (req, res, next) => {
  try {
    const allowed = ['slot', 'imageUrl', 'linkUrl', 'description', 'startDate', 'endDate', 'active'];
    const updates = {};
    for (const key of allowed) {
      if (req.validatedBody[key] !== undefined) updates[key] = req.validatedBody[key];
    }
    const ad = await Ad.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!ad) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: ad });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false, message: 'Not found' });
    await Ad.findByIdAndDelete(req.params.id);
    await logAudit({
      adminId: req.user._id, adminEmail: req.user.email,
      action: 'ad_delete', targetType: 'ad', targetId: ad._id,
      targetTitle: ad.description || ad.slot || 'Ad',
    });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

router.post('/:id/impression', impressionLimiter, async (req, res, next) => {
  try {
    const ad = await Ad.findByIdAndUpdate(req.params.id, { $inc: { impressions: 1 } }, { new: true });
    res.json({ success: true, data: ad });
  } catch (err) { next(err); }
});

router.post('/:id/click', clickLimiter, async (req, res, next) => {
  try {
    const ad = await Ad.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } }, { new: true });
    res.json({ success: true, data: ad });
  } catch (err) { next(err); }
});

export default router;
