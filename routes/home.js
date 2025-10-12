import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// ホームページ
router.get('/', async (req, res) => {
  try {
    const now = new Date();

    // 公開＆受付中＆今日以降の開催を全部取得（件数制限なし）
    const events = await prisma.event.findMany({
      where: {
        AND: [
          { isPublic: true },
          { status: 'OPEN' },
          { date: { gte: now } }
        ]
      },
      orderBy: { date: 'asc' }
    });

    // 申込ボタン表示制御の補助プロパティ
    const upcomingEvents = events.map(e => ({
      ...e,
      canApply: !e.applicationStartDate || e.applicationStartDate <= now,
      applicationStartMessage:
        e.applicationStartDate && e.applicationStartDate > now
          ? `申込開始: ${e.applicationStartDate.toLocaleDateString('ja-JP')}から`
          : null
    }));

    return res.render('home', {
      title: '菊名桜山公園 ボランティア募集',
      upcomingEvents
    });
  } catch (error) {
    console.error('[home] load error:', error);
    return res.status(500).render('error', {
      title: 'エラー',
      message: 'イベント一覧の取得に失敗しました。',
      error: { status: 500 }
    });
  }
});

export default router;
