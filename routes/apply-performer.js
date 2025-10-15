import express from 'express';
  import prisma from '../lib/prisma.js';
  const router = express.Router();

// 受付可否：公開・OPEN・申込開始日OK
function isAccepting(event) {
  if (!event) return false;
  if (!event.isPublic) return false;
  if (event.status !== 'OPEN') return false;
  if (event.applicationStartDate && new Date(event.applicationStartDate) > new Date()) return false;
  return true;
}

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

 
// === Performer confirm & submit routes (slug-based) ===

// 確認画面（プレビュー）
router.post('/:slug/performer/preview', async (req, res) => {
  try {
    const { slug } = req.params;
    const prisma = req.prisma;

    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event || !event.isPublic || event.status !== 'OPEN') {
      return res.status(404).render('apply-closed', { title: '申込受付終了', event });
    }

    const formData = req.body; // 入力をそのまま確認用に渡す
    return res.render('apply_performer_confirm', {
      title: `${event.title} - 出演申込 内容確認`,
      event,
      formData,
      isPreview: false
    });
  } catch (e) {
    console.error(e);
    return res.status(500).render('error', { title: 'エラー', message: '確認画面の表示に失敗しました' });
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

    await prisma.performerApplication.create({
      data: {
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
      }
    });

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
    if (!event) {
      return res.status(404).render('error', { title: 'エラー', message: 'イベントが見つかりません' });
    }
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