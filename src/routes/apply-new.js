import express from 'express';
  import prisma from '../lib/prisma.js';

  const router = express.Router();

  router.get('/', (req, res) =>
    res.status(404).render('error', {
      title: 'ページが見つかりません',
      message: 'イベントを指定してください',
      error: { status: 404 }
    })
  );

  router.get('/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const event = await prisma.event.findUnique({ where:
  { slug } });

      if (!event) {
        return res.status(404).render('error', {
          title: 'イベントが見つかりません',
          message: '指定されたイベントが見つかりません',
          error: { status: 404 }
        });
      }

      if (!event.isPublic || event.status !== 'OPEN') {
        return res.render('apply-closed', {
          title: '申込受付終了',
          event
        });
      }

      const currentDate = new Date();
      const canApply = !event.applicationStartDate ||
  event.applicationStartDate <= currentDate;

      if (!canApply) {
        return res.render('apply-closed', {
          title: '申込開始前',
          event
        });
      }

      res.render('apply', {
        title: event.title + ' - イベント申込',
        event
      });

    } catch (error) {
      console.error('[apply GET] error', error);
      res.status(500).render('error', {
        title: 'エラー',
        message: 'ページ表示に失敗しました',
        error: { status: 500 }
      });
    }
  });

  export default router;