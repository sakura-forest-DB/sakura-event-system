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

    // セッションにある下書きを読み出す（無ければ body）
    const formData =
      (req.session && req.session.performerDraft) ? req.session.performerDraft : { ...req.body };

    // TODO: 本実装：DBに保存
    // 例）
    // const app = await prisma.performerApplication.create({
    //   data: {
    //     eventId: event.id,
    //     groupName: formData.groupName,
    //     email: formData.email,
    //     // ...
    //   },
    // });

    // 受付番号に相当する値（雰囲気だけ）
    const fakeReceipt = 'PRF-' + Math.random().toString(36).slice(2, 8).toUpperCase();

// 送信に使ったデータを application として完了画面へ渡す
const application = formData; // DB保存してるなら saved を使ってOK

// 下書きクリア
if (req.session) delete req.session.performerDraft;


// 完了画面へ
return res.render('apply_performer_thanks', {
  title: `${event.title} - 出演申込 完了`,
  event,
  applicationNumber: fakeReceipt,
  application, // ← これが重要（カンマ含めてそのまま）
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