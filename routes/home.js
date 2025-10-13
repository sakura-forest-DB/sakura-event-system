import express from 'express';
  import prisma from '../lib/prisma.js';

  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const events = await prisma.event.findMany({
        where: { isPublic: true },
        orderBy: { eventDate: 'asc' }
      });

      res.render('home', {
        title: 'きくな桜まつり実行委員会',
        events
      });
    } catch (error) {
      console.error('Home route error:', error);
      res.status(500).render('error', {
        title: 'エラー',
        message: 'ページの読み込みに失敗しました',
        error: { status: 500 }
      });
    }
  });

  export default router;
