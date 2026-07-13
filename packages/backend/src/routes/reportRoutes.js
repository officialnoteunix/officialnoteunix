import { Router } from 'express';
import Report from '../models/Report.js';
import AuditLog from '../models/AuditLog.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { safeLimit, safePage } from '../utils/constants.js';

const router = Router();

router.get('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 5 } = req.query;
    const safeLim = safeLimit(limit);
    const safePg = safePage(page);
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    const skip = (safePg - 1) * safeLim;
    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLim)
        .populate('note', 'title')
        .populate('reportedBy', 'fullname email avatar'),
      Report.countDocuments(query),
    ]);
    res.json({ success: true, data: { items: reports, total, page: safePg, limit: safeLim, totalPages: Math.ceil(total / safeLim) } });
  } catch (err) { next(err); }
});

router.get('/my', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const safeLim = safeLimit(limit);
    const safePg = safePage(page);
    const skip = (safePg - 1) * safeLim;
    const [reports, total] = await Promise.all([
      Report.find({ reportedBy: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLim)
        .populate('note', 'title'),
      Report.countDocuments({ reportedBy: req.user._id }),
    ]);
    res.json({
      success: true,
      data: {
        items: reports,
        total,
        page: safePg,
        limit: safeLim,
        totalPages: Math.ceil(total / safeLim),
      },
    });
  } catch (err) { next(err); }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { noteId, type, reason } = req.body;
    if (!noteId || !type || !reason) {
      return res.status(400).json({ success: false, message: 'noteId, type, and reason are required' });
    }
    const report = await Report.create({
      note: noteId,
      reportedBy: req.user._id,
      type,
      reason,
    });
    res.status(201).json({ success: true, data: report });
  } catch (err) { next(err); }
});

router.patch('/:id/status', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('note', 'title');
    if (!report) return res.status(404).json({ success: false, message: 'Not found' });
    await AuditLog.create({
      adminId: req.user._id, adminEmail: req.user.email,
      action: status === 'resolved' ? 'report_resolve' : 'report_dismiss',
      targetType: 'report', targetId: report._id,
      targetTitle: report.note?.title || `Report #${report._id}`,
    });
    res.json({ success: true, data: report });
  } catch (err) { next(err); }
});

export default router;
