// src/routes/apply-performer.js
import express from 'express';
import prisma from '../lib/prisma.js';
const router = express.Router();

/**
 * GET /apply/:slug/performer
 * - 入力画面を表示（セッションに下書きがあれば復元）
 */
router.get('/:slug/performer', async (req, res) => {
  try {
    const { slug } = req.params;
    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event) {
      return res.status(404).render('error', {
        title: 'イベントが見つかりません',
        message: '指定されたイベントが見つかりません',
        error: { status: 404 },
      });
    }

    const draft = (req.session && req.session.performerDraft) || {};
    return res.render('apply_performer', {
      title: `${event.title} - 出演申込`,
      event,
      formData: draft,
      errors: [],
    });
  } catch (err) {
    console.error('[GET performer] ', err);
    return res.status(500).render('error', {
      title: 'エラー',
      message: 'ページ表示に失敗しました。',
      error: { status: 500 },
    });
  }
});

/**
 * POST /apply/:slug/performer
 * - 入力値をバリデーション
 * - エラーがあれば入力画面に戻す
 * - OKならセッションに下書き保存 → 確認画面を表示
 */
router.post('/:slug/performer', async (req, res) => {
  try {
    const { slug } = req.params;
    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event) {
      return res.status(404).render('error', {
        title: 'イベントが見つかりません',
        message: '指定されたイベントが見つかりません',
        error: { status: 404 },
      });
    }

    const formData = { ...req.body };
    const errors = [];

    // 必須チェック（必要に応じて増やしてください）
    if (!formData.groupName) errors.push('参加団体名は必須です。');
    if (!formData.email)     errors.push('メールアドレスは必須です。');

    // エラーなら入力画面に戻す
    if (errors.length > 0) {
      return res.render('apply_performer', {
        title: `${event.title} - 出演申込`,
        event,
        formData,
        errors,
      });
    }

    // 問題なければ確認画面へ：セッションに下書きを保存
    if (req.session) req.session.performerDraft = formData;

    return res.render('apply_performer_confirm', {
      title: `${event.title} - 出演申込（確認）`,
      event,
      formData,
    });
  } catch (err) {
    console.error('[POST performer confirm] ', err);
    return res.status(500).render('error', {
      title: 'エラー',
      message: '確認処理に失敗しました。',
      error: { status: 500 },
    });
  }
});

/**
 * POST /apply/:slug/performer/submit
 * - DBに保存（ここではサンプル：必要に応じて実装）
 * - セッションの下書きをクリア
 * - 完了画面へ
 */
// POST /apply/:slug/performer/submit → 完了画面（DB保存なしの安全版）
router.post('/:slug/performer/submit', async (req, res) => {
  try {
    const { slug } = req.params;
    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event) {
      return res.status(404).render('error', {
        title: 'イベントが見つかりません',
        message: '指定されたイベントが見つかりません',
        error: { status: 404 },
      });
    }

    // 確認で保存していた下書き（なければ今回のPOST）
    const formData =
      (req.session && req.session.performerDraft) ? req.session.performerDraft : { ...req.body };

    // --- データベースに保存 ---
// --- DBに保存（schemaの型に合わせて整形） ---
const saved = await prisma.performerApplication.create({
  data: {
    eventId:        event.id,
    groupName:      formData.groupName?.trim() || null,
    representative: formData.representative?.trim() || null,
    email:          formData.email?.trim() || null,
    phone:          formData.phone?.trim() || null,
    address:        formData.address?.trim() || null,

    performance:    formData.performance?.trim() || null,
    performerCount: parseInt(formData.performerCount || 0, 10) || 0,
    slotCount:      parseInt(formData.slotCount      || 0, 10) || 0,

    // ← Prismaが Int なので true/false を 1/0 に直す
    audioSourceOnly: (formData.audioSourceOnly === 'on') ? 1 : 0,

    rentalAmp:      parseInt(formData.rentalAmp      || 0, 10) || 0,
    rentalMic:      parseInt(formData.rentalMic      || 0, 10) || 0,
    vehicleCount:   parseInt(formData.vehicleCount   || 0, 10) || 0,
    vehicleNumbers: formData.vehicleNumbers?.trim() || null,
    questions:      formData.questions?.trim()      || null,

    privacyConsent:   formData.privacyConsent   === 'on',
    marketingConsent: formData.marketingConsent === 'on',
  },
});

// 完了画面に渡す元データ（保存結果を採用）
const application = saved;

// 受付番号（スキーマに receiptNo が無ければ仮番号を生成）
const fakeReceipt = 'PRF-' + Math.random().toString(36).slice(2, 8).toUpperCase();

// 下書きクリア
if (req.session) delete req.session.performerDraft;

// 完了画面へ（DB保存結果を渡す）
return res.render('apply_performer_thanks', {
  title: `${event.title} - 出演申込 完了`,
  event,
  applicationNumber: fakeReceipt,
  application: saved,
});
  } catch (err) {
    console.error('[POST performer submit] ', err);
    return res.status(500).render('error', {
      title: 'エラー',
      message: '送信処理でエラーが発生しました。',
      error: { status: 500 },
    });
  }
});

export default router;