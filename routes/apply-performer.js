import express from 'express';
  import prisma from '../lib/prisma.js';
  const router = express.Router();

// 受付中判定
const isAccepting = (event) => {
  if (!event) return false;
  const now = new Date();
  const started   = !event.applicationStartDate || now >= new Date(event.applicationStartDate);
  const notEnded  = !event.applicationEndDate   || now <= new Date(event.applicationEndDate);
  return event.isPublic && event.status === 'OPEN' && started && notEnded;
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

// 送信（まずは最小フィールドだけで通す／デバッグ用）
router.post('/:slug/performer/submit', async (req, res) => {
  try {
    const { slug } = req.params;
    const prisma = req.prisma;

    // イベント取得 & 受付可否チェック
    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event || !event.isPublic || event.status !== 'OPEN') {
      return res.status(404).render('apply-closed', { title: '申込受付終了', event });
    }

    // まずは最小セットで保存（通ることを確認）
    const data = {
      eventId: event.id,
      groupName: req.body.groupName,
      representative: req.body.representative,
      email: req.body.email,
      phone: req.body.phone,
      performance: req.body.performance,
    };

    await prisma.performerApplication.create({ data });

    return res.render('apply_performer_success', {
      title: '出演申込 送信完了',
      event
    });
  } catch (e) {
    console.error('[performer submit error]', e);
    // 一時的にエラーメッセージを画面にも表示
    return res.status(500).render('error', {
      title: 'エラー',
      message: e.message || '送信に失敗しました'
    });
  }
});

export default router;