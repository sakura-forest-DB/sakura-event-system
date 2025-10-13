import express from 'express';
  import prisma from '../lib/prisma.js';
  const router = express.Router();

  // 出演申込フォーム表示
  router.get('/performer/:slug', async (req, res) => {
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
          applicationStartMessage: `申込開始: ${event.appli
  cationStartDate.toLocaleDateString('ja-JP')}から`
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
  router.post('/performer/:slug', async (req, res) => {
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
          applicationStartMessage: `申込開始: ${event.appli
  cationStartDate.toLocaleDateString('ja-JP')}から`
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

  // 出演申込最終送信処理
  router.post('/performer/:slug/submit', async (req, res)
  => {
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
          applicationStartMessage: `申込開始: ${event.appli
  cationStartDate.toLocaleDateString('ja-JP')}から`
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

      // 初回申込スナップショット用データ
      const originalPayload = JSON.stringify(req.body);
      const submittedAt = new Date();

      // 出演申込作成（サーバーサイドでeventIdを決定）
      const performerApplication = await
  prisma.performerApplication.create({
        data: {
          groupName,
          representative,
          address: address || null,
          email,
          phone: phone || null,
          eventId: event.id, // サーバーサイドで決定
          performance,
          performerCount: performerCount ?
  parseInt(performerCount) : null,
          slotCount: slotCount ? parseInt(slotCount) :
  null,
          vehicleCount: vehicleCount ?
  parseInt(vehicleCount) : null,
          vehicleNumbers: vehicleNumbers || null,
          audioSourceOnly: audioSourceOnly ?
  parseInt(audioSourceOnly) : null,
          rentalAmp: rentalAmp ? parseInt(rentalAmp) :
  null,
          rentalMic: rentalMic ? parseInt(rentalMic) :
  null,
          questions: questions || null,
          privacyConsent: privacyConsent === 'on',
          marketingConsent: marketingConsent === 'on',
          originalPayload,
          originalSubmittedAt: submittedAt
        }
      });

      res.render('thanks', {
        title: `${event.title} - 出演申込完了`,
        type: 'performer',
        application: performerApplication,
        event
      });

    } catch (error) {
      console.error('[performer submit] error', error);
      res.status(500).render('error', {
        title: 'エラー',
        message: '申込送信中にエラーが発生しました',
        error: { status: 500 }
      });
    }
  });

  export default router;
