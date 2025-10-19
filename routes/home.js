import express from 'express';
  import prisma from '../lib/prisma.js';

  const router = express.Router();

router.get('/', async (req, res) => {
    try {
      const now = new Date();


// ① いま運用中：このイベントだけ表示
const events = await prisma.event.findMany({
  where: { slug: 'forest-christmas' },
  orderBy: { date: 'asc' }
});

/* ② バックアップ（通常条件・将来戻す用）
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
*/
      // 申込ボタン表示制御の補助プロパティ
      const upcomingEvents = events.map(e => ({
        ...e,
        canApply: !e.applicationStartDate ||
  e.applicationStartDate <= now,
        applicationStartMessage:
          e.applicationStartDate && e.applicationStartDate > now
            ? `申込開始: 
  ${e.applicationStartDate.toLocaleDateString('ja-JP')}から`
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
