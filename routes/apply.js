// routes/apply.js
import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// /apply ランディング：公開イベントを開催日順に一覧表示
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const events = await prisma.event.findMany({
      where: { isPublic: true, date: { gte: now } }, // 公開かつこれからのイベント
      orderBy: { date: 'asc' }
    });

    const listed = events.map(e => ({
      ...e,
      canApply:
        e.status === 'OPEN' &&
        (!e.applicationStartDate || e.applicationStartDate <= now)
    }));

    res.render('apply-landing', {
      title: 'イベント申込',
      events: listed
    });
  } catch (err) {
    console.error('[apply landing] error:', err);
    res.status(500).render('error', {
      title: 'エラー',
      message: 'イベント一覧の取得に失敗しました。',
      error: { status: 500 }
    });
  }
});

export default router;
