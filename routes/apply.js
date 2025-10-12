import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// /apply/:slug ＝ イベントごとのランディング
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const event = await prisma.event.findUnique({ where: { slug } });

    if (!event || !event.isPublic) {
      return res.status(404).render('error', {
        title: 'イベントが見つかりません',
        message: '指定されたイベントが見つかりません。',
        error: { status: 404 }
      });
    }

    const now = new Date();
    const isOpen =
      event.status === 'OPEN' &&
      (!event.applicationStartDate || event.applicationStartDate <= now);

    // 受付前 or クローズなら“受付終了/準備中”画面へ
    if (!isOpen) {
      return res.status(200).render('apply-closed', {
        title: '申込受付終了',
        event
      });
    }

    // 受付中ならランディングで「出店/出演」へ誘導
    return res.render('apply-landing', {
      title: `${event.title} - イベント申込`,
      event
    });
  } catch (error) {
    console.error('[apply/:slug] error:', error);
    return res.status(500).render('error', {
      title: 'エラー',
      message: 'イベント情報の取得に失敗しました。',
      error: { status: 500 }
    });
  }
});

// slug無しは404（既存の方針を維持）
router.get('/', (req, res) =>
  res.status(404).render('error', {
    title: 'ページが見つかりません',
    message: 'イベントを指定してください',
    error: { status: 404 }
  })
);

export default router;
