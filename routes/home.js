import express from 'express';
  import prisma from '../lib/prisma.js';

  const router = express.Router();

router.get('/', async (req, res) => {
    try {
      const now = new Date();

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
