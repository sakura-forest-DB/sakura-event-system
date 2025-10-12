 import express from 'express';
  import prisma from '../lib/prisma.js';
  const router = express.Router();

  // 出店申込フォーム（GET）
router.get('/:slug/stall', async (req, res) => {
  try {
    const { slug } = req.params;
    const event = await prisma.event.findUnique({ where: { slug } });

    // 非公開 or CLOSED はクローズ表示（404ではなく200で）
    if (!event || !event.isPublic || event.status !== 'OPEN') {
      return res.status(200).render('apply-closed', {
        title: '申込受付終了',
        event,
      });
    }

    // 申込開始日前は「準備中」を表示（404ではなく200で）
    const now = new Date();
    if (event.applicationStartDate && event.applicationStartDate > now) {
      return res.status(200).render('apply-closed', {
        title: '申込準備中',
        event,
      });
    }

    // 受付中ならフォームを表示（event は hidden eventId で使用）
    return res.render('apply_stall', {
      title: `${event.title} - 出店申込`,
      event,
    });
  } catch (error) {
    console.error('[stall:get] error:', error);
    return res.status(500).render('error', {
      title: 'エラー',
      message: 'サーバー側でエラーが発生しました。',
      error: { status: 500 },
    });
  }
});

// 送信: 出演申込
router.post('/:slug/performer/submit', async (req, res) => {
  try {
    const { slug } = req.params;

    // イベント取得（サーバーサイドで確定）
    const event = await prisma.event.findUnique({ where: { slug } });

    if (!event) {
      return res.status(404).render('error', {
        title: 'イベントが見つかりません',
        message: '指定されたイベントが見つかりません。',
        error: { status: 404 },
      });
    }

    // 非公開 or 受付終了はクローズ画面
    if (!event.isPublic || event.status !== 'OPEN') {
      return res.render('apply-closed', {
        title: '申込受付終了',
        event,
      });
    }

    // ボディから必要項目を取り、eventId はサーバー側で上書き
    const payload = {
      groupName: req.body.groupName,
      representative: req.body.representative,
      address: req.body.address || null,
      email: req.body.email,
      phone: req.body.phone || null,
      performance: req.body.performance,
      performerCount: req.body.performerCount ? Number(req.body.performerCount) : null,
      slotCount: req.body.slotCount ? Number(req.body.slotCount) : null,
      vehicleCount: req.body.vehicleCount ? Number(req.body.vehicleCount) : null,
      vehicleNumbers: req.body.vehicleNumbers || null,
      audioSourceOnly: req.body.audioSourceOnly ? Number(req.body.audioSourceOnly) : null,
      rentalAmp: req.body.rentalAmp ? Number(req.body.rentalAmp) : null,
      rentalMic: req.body.rentalMic ? Number(req.body.rentalMic) : null,
      questions: req.body.questions || null,

      // 同意
      privacyConsent: req.body.privacyConsent === 'on',
      marketingConsent: req.body.marketingConsent === 'on',

      // サーバー側で確定
      eventId: event.id,
    };

    await prisma.performerApplication.create({ data: payload });

    return res.render('apply_thanks', {
      title: '送信が完了しました',
      event,
    });
  } catch (error) {
    console.error('[performer submit] error:', error);
    return res.status(500).render('error', {
      title: 'エラー',
      message: '送信処理でエラーが発生しました。',
      error: { status: 500 },
    });
  }
});

export default router;
