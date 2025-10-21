import express from 'express';
import prisma from '../lib/prisma.js';
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const now = new Date();

    // .env の EVENT_SLUG または ACTIVE_EVENT_SLUG を読む
    const activeSlug =
      process.env.EVENT_SLUG || process.env.ACTIVE_EVENT_SLUG || null;

    // 絞り込み条件
    const where = {
      isPublic: true,
      status: 'OPEN',
      date: { gte: now },
    };
    if (activeSlug) {
      where.slug = activeSlug;
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    // 申込ボタン表示制御など既存ロジックを保持
    const upcomingEvents = events.map(e => ({
      ...e,
      canApply: !e.applicationStartDate || e.applicationStartDate <= now,
      applicationStartMessage:
        e.applicationStartDate && e.applicationStartDate > now
          ? `申込開始: ${e.applicationStartDate.toLocaleDateString('ja-JP')}から`
          : null,
    }));

    return res.render('home', {
      title: '菊名桜山公園 ボランティア募集',
      upcomingEvents,
    });
  } catch (error) {
    console.error('[home] load error:', error);
    return res.status(500).render('error', {
      title: 'エラー',
      message: 'イベント一覧の取得に失敗しました。',
      error: { status: 500 },
    });
  }
});

  export default router;
  