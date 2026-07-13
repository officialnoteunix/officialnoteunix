import { Router } from 'express';
import Ad from '../models/Ad.js';
import { authenticate, authorize } from '../middleware/auth.js';

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

router.get('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const ads = await Ad.find().sort({ createdAt: -1 });
    res.json({ success: true, data: ads });
  } catch (err) { next(err); }
});

router.get('/stats/full', authenticate, authorize('admin'), async (req, res, next) => {
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

router.get('/stats/range', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const query = {};
    if (start) query.startDate = { $gte: new Date(start) };
    if (end) query.endDate = { ...query.endDate, $lte: new Date(end) };
    const ads = await Ad.find(query);
    res.json({ success: true, data: ads });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: ad });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const ad = await Ad.create(req.body);
    res.status(201).json({ success: true, data: ad });
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const ad = await Ad.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ad) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: ad });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await Ad.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

router.post('/:id/impression', async (req, res, next) => {
  try {
    const ad = await Ad.findByIdAndUpdate(req.params.id, { $inc: { impressions: 1 } }, { new: true });
    res.json({ success: true, data: ad });
  } catch (err) { next(err); }
});

router.post('/:id/click', async (req, res, next) => {
  try {
    const ad = await Ad.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } }, { new: true });
    res.json({ success: true, data: ad });
  } catch (err) { next(err); }
});

export default router;
