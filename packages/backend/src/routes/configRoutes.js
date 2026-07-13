import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      fileTypes: ['pdf'],
      maxFileSize: 10 * 1024 * 1024,
      reportReasons: ['Incorrect content', 'Copyright violation', 'Spam', 'Offensive', 'Other'],
      disputeReasons: ['My content removed', 'False report', 'Other'],
    },
  });
});

export default router;
