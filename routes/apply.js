// routes/apply.js
import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// /apply（slugなし）は、申込対象イベントの一覧ランディングを表示
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const events = await prisma.event.findMany({
      where: {
        AND: [
          { isPublic: true },
          { status: 'OPEN' },
          { date: { gte: now } },
        ],
      },
      orderBy: { date: 'asc' },
    });

    res.render('apply-landing', {
      title: 'イベント申込',
      events, // ← 配列で渡す
      now,
    });
  } catch (e) {
    console.error('[apply] landing error:', e);
    res.status(500).render('error', {
      title: 'エラー',
      message: 'サーバー側でエラーが発生しました。',
      error: { status: 500 },
    });
  }
});

export default router;
