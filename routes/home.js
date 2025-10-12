 import express from 'express';
  import prisma from '../lib/prisma.js';

  const router = express.Router();

  // ホームページ
  router.get('/', async (req, res) => {
    try {
      const currentDate = new Date();

      const events = await prisma.event.findMany({
        where: {
          AND: [
            { isPublic: true },
            { status: 'OPEN' },
            { date: { gte: currentDate } }
          ]
        },
        orderBy: { date: 'asc' }
        // take は付けない（件数制限なし）
      });

      // 0件時の表示
      if (!events || events.length === 0) {
        return res.render('home', {
          title: '菊名桜山公園 ボランティア募集',
          upcomingEvents: [],
          message: '現在募集中のイベントはありません。'
        });
      }

     // 申込可能かどうかを各イベントに追加
const upcomingEvents = events.map((event) => ({
  ...event,
  canApply:
    !event.applicationStartDate ||
    event.applicationStartDate <= currentDate,
  applicationStartMessage:
    event.applicationStartDate &&
    event.applicationStartDate > currentDate
      ? `申込開始: ${event.applicationStartDate.toLocaleDateString('ja-JP')}から`
      : null,
}));

      res.render('home', {
        title: '菊名桜山公園 ボランティア募集',
        upcomingEvents
      });
    } catch (error) {
      console.error('[home] load error:', error);
      res.status(500).render('error', {
        title: 'エラー',
        message: 'イベント一覧の取得に失敗しました。',
        error: { status: 500 }
      });
    }
  });

  export default router;
