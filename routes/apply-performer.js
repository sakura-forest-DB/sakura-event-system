import express from 'express';
  import prisma from '../lib/prisma.js';
  const router = express.Router();

  // 受付中か判定（公開+開始日/終了日）
const isAccepting = (event) => {
  const now = new Date();
  if (!event || !event.isPublic) return false;
  if (event.applicationStartDate && now < new Date(event.applicationStartDate)) return false;
  if (event.applicationEndDate && now > new Date(event.applicationEndDate)) return false;
  return true;
};
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

      // 申込開始日をチェック
      const currentDate = new Date();
      const canApply = !event.applicationStartDate ||
  event.applicationStartDate <= currentDate;

      if (!canApply) {
        return res.render('apply-closed', {
          title: '申込開始前',
          event,
          applicationStartMessage: `申込開始: ${event.applicationStartDate.toLocaleDateString('ja-JP')}から`
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

  // 出演申込処理
  router.post('/:slug/performer', async (req, res) => {
    try {
      const { slug } = req.params;
      const event = await prisma.event.findUnique({ where:
  { slug } });

      if (!event || !event.isPublic || event.status !==
  'OPEN') {
        return res.status(400).render('apply-closed', {
          title: '申込受付終了',
          event
        });
      }

      // 申込開始日をチェック
      const currentDate = new Date();
      const canApply = !event.applicationStartDate ||
  event.applicationStartDate <= currentDate;

      if (!canApply) {
        return res.status(400).render('apply-closed', {
          title: '申込開始前',
          event,
          applicationStartMessage: `申込開始: ${event.applicationStartDate.toLocaleDateString('ja-JP')}から`
        });
      }

      const {
        groupName,
        representative,
        address,
        email,
        phone,
        performance,
        performerCount,
        slotCount,
        vehicleCount,
        vehicleNumbers,
        audioSourceOnly,
        rentalAmp,
        rentalMic,
        questions,
        privacyConsent,
        marketingConsent
      } = req.body;

      const errors = [];

      // バリデーション
      if (!groupName) errors.push('参加団体名は必須です');
      if (!representative)
  errors.push('代表者名は必須です');
      if (!email) errors.push('メールアドレスは必須です');
      if (email &&
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

  errors.push('有効なメールアドレスを入力してください');
      }
      if (!phone) errors.push('電話番号は必須です');
      if (!performance) errors.push('出演内容は必須です');
      if (!privacyConsent)
  errors.push('個人情報の利用について同意が必要です');

      if (errors.length > 0) {
        return res.render('apply_performer', {
          title: `${event.title} - 出演申込`,
          event,
          errors,
          formData: req.body
        });
      }

      // エラーがない場合は確認画面を表示
      res.render('apply_performer_confirm', {
        title: `${event.title} - 出演申込内容確認`,
        formData: req.body,
        event,
        isPreview: false
      });

    } catch (error) {
      console.error('[performer POST] error', error);
      res.status(500).render('error', {
        title: 'エラー',
        message: '申込処理中にエラーが発生しました',
        error: { status: 500 }
      });
    }
  });

 

// 送信（DB保存）
router.post('/:slug/performer/submit', async (req, res) => {
  try {
    const { slug } = req.params;
    const prisma = req.prisma;

    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event || !event.isPublic || event.status !== 'OPEN') {
      return res.status(404).render('apply-closed', { title: '申込受付終了', event });
    }

    const toInt = v => (v === '' || v == null ? null : parseInt(v, 10));

    const data = {
      eventId: event.id,
      groupName: req.body.groupName,
      representative: req.body.representative,
      address: req.body.address || null,
      email: req.body.email,
      phone: req.body.phone,
      performance: req.body.performance,
      performerCount: toInt(req.body.performerCount),
      slotCount: toInt(req.body.slotCount),
      vehicleCount: toInt(req.body.vehicleCount),
      vehicleNumbers: req.body.vehicleNumbers || null,
      audioSourceOnly: toInt(req.body.audioSourceOnly),
      rentalAmp: toInt(req.body.rentalAmp),
      rentalMic: toInt(req.body.rentalMic),
      questions: req.body.questions || null,
      privacyConsent: !!req.body.privacyConsent,
      marketingConsent: !!req.body.marketingConsent,
      originalPayload: JSON.stringify(req.body),
      originalSubmittedAt: new Date()
    };

    await prisma.performerApplication.create({ data });
    return res.render('apply_performer_success', { title: '出演申込完了', event });
  } catch (e) {
    console.error(e);
    return res.status(500).render('error', { title: 'エラー', message: '送信に失敗しました' });
  }
});

// 戻って修正（入力画面に差し戻し）
router.post('/:slug/performer/edit', async (req, res) => {
  try {
    const { slug } = req.params;
    const prisma = req.prisma;
    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event) return res.status(404).render('error', { title: 'エラー', message: 'イベントが見つかりません' });

    return res.render('apply_performer', {
      title: `${event.title} - 出演申込（修正）`,
      event,
      formData: req.body
    });
  } catch (e) {
    console.error(e);
    return res.status(500).render('error', { title: 'エラー', message: '修正画面の表示に失敗しました' });
  }
});
  export default router;
