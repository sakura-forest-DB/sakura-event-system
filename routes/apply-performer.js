 import express from 'express';
  import prisma from '../lib/prisma.js';
  const router = express.Router();

  // 出演申込フォーム表示
  router.get('/:slug/performer', async (req, res) => {
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

      res.render('apply_performer', {
        title: `${event.title} - 出演申込`,
        event,
        errors: [],
        formData: {}
      });
    } catch (error) {
      console.error('[performer GET] error', error);
      res.status(500).render('error', {
        title: 'エラー',
        message: 'フォーム表示に失敗しました',
        error: { status: 500 }
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
