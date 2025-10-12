import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// /apply ランディング（イベント一覧）
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const events = await prisma.event.findMany({
      where: {
        isPublic: true,
        status: 'OPEN',
        date: { gte: now },
      },
      orderBy: { date: 'asc' }
    });
    res.render('apply-landing', { title: 'イベント申込', events });
  } catch (e) {
    console.error('[apply] landing error', e);
    res.status(500).render('error', {
      title: 'エラー',
      message: 'サーバー側でエラーが発生しました。'
    });
  }
});

export default router;
