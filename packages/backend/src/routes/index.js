import { Router } from 'express';
import authRoutes from './authRoutes.js';
import homeRoutes from './homeRoutes.js';
import configRoutes from './configRoutes.js';
import universityRoutes from './universityRoutes.js';
import courseRoutes from './courseRoutes.js';
import semesterRoutes from './semesterRoutes.js';
import subjectRoutes from './subjectRoutes.js';
import noteRoutes from './noteRoutes.js';
import searchRoutes from './searchRoutes.js';
import userRoutes from './userRoutes.js';
import bookmarkRoutes from './bookmarkRoutes.js';
import reportRoutes from './reportRoutes.js';
import adminRoutes from './adminRoutes.js';
import adRoutes from './adRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import contactRoutes from './contactRoutes.js';
import commentRoutes from './commentRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import ratingRoutes from './ratingRoutes.js';
const router = Router();

router.use('/auth', authRoutes);
router.use('/home', homeRoutes);
router.use('/config', configRoutes);
router.use('/universities', universityRoutes);
router.use('/courses', courseRoutes);
router.use('/semesters', semesterRoutes);
router.use('/subjects', subjectRoutes);
router.use('/notes', noteRoutes);
router.use('/search', searchRoutes);
router.use('/users', userRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);
router.use('/ads', adRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/contact', contactRoutes);
router.use('/comments', commentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ratings', ratingRoutes);

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'OK' });
});

export default router;
