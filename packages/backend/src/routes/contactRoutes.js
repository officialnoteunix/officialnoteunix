import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import ContactMessage from '../models/ContactMessage.js';
import { authenticate } from '../middleware/auth.js';
import { PERMISSIONS } from '../utils/constants.js';
import { sanitizeText } from '../utils/sanitize.js';
import { validate } from '../middleware/validate.js';
import { createContactSchema } from '../validators/contactValidator.js';

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages sent. Please try again later.' },
});

function requireContactManage(req, res) {
  if (!req.user || !req.user.hasPermission(PERMISSIONS.CONTACT_MANAGE)) {
    res.status(403).json({ success: false, message: 'Insufficient permissions' });
    return false;
  }
  return true;
}

router.post('/', contactLimiter, validate(createContactSchema), async (req, res, next) => {
  try {
    const { name, email, topic, message } = req.validatedBody;
    await ContactMessage.create({
      name: sanitizeText(name),
      email: sanitizeText(email),
      topic: topic ? sanitizeText(topic) : '',
      message: sanitizeText(message),
    });
    res.status(201).json({ success: true, message: 'Message sent successfully' });
  } catch (err) { next(err); }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    if (!requireContactManage(req, res)) return;
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ success: true, data: messages });
  } catch (err) { next(err); }
});

router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    if (!requireContactManage(req, res)) return;
    await ContactMessage.updateMany({ read: false }, { $set: { read: true } });
    res.json({ success: true, message: 'All marked as read' });
  } catch (err) { next(err); }
});

router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    if (!requireContactManage(req, res)) return;
    const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!msg) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: msg });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    if (!requireContactManage(req, res)) return;
    const msg = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;
