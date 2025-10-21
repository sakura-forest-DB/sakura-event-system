/// src/routes/apply-stall.js
import express from 'express';
import prisma from '../lib/prisma.js';
const router = express.Router();

/**
 * GET /apply/:slug/stall
 * - 入力画面表示（セッション下書きがあれば復元）
 */
router.get('/:slug/stall', async (req, res) => {
  const { slug } = req.params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) return res.status(404).render('error', { title:'イベントが見つかりません', message:'指定されたイベントが見つかりません', error:{status:404} });

  const draft = (req.session && req.session.stallDraft) ? req.session.stallDraft : {};
  return res.render('apply_stall', {
    title: `${event.title} - 出店申込`,
    event,
    formData: draft,
    errors: [],
  });
});

/**
 * POST /apply/:slug/stall
 * - バリデーション（簡易）
 * - セッションに下書き保存
 * - 確認画面へ
 */

// POST /apply/:slug/stall → 入力内容をセッションに保存して確認画面へ
router.post('/:slug/stall', async (req, res) => {
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

    const formData = { ...req.body };                 // 入力値
    if (req.session) req.session.stallDraft = formData; // 下書き保存

    return res.render('apply_stall_confirm', {
      title: `${event.title} - 出店申込（確認）`,
      event,
      formData,
    });
  } catch (err) {
    console.error('[POST stall confirm] ', err);
    return res.status(500).render('error', {
      title: 'エラー',
      message: '確認処理に失敗しました。',
      error: { status: 500 },
    });
  }
});

/**
 * POST /apply/:slug/stall/submit
 * - DB保存（ここではサンプル）
 * - 下書きクリア
 * - 完了画面へ（application を渡す）
 */
// POST /apply/:slug/stall/submit → 送信・完了
router.post('/:slug/stall/submit', async (req, res) => {
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

    // 確認で保存した下書きを使う（なければ body）
    const formData = (req.session && req.session.stallDraft)
      ? req.session.stallDraft
      : { ...req.body };

    // ここで本来は DB 保存（省略）。保存結果を application にしてもOK
    const application = formData;

    // 仮の受付番号
    const fakeReceipt = 'STL-' + Math.random().toString(36).slice(2, 8).toUpperCase();

    // 下書きクリア
    if (req.session) delete req.session.stallDraft;

    // 完了画面へ（申込内容を渡す！）
    return res.render('apply_stall_thanks', {
      title: `${event.title} - 出店申込 完了`,
      event,
      applicationNumber: fakeReceipt,
      application,
    });
  } catch (err) {
    console.error('[POST stall submit] ', err);
    return res.status(500).render('error', {
      title: 'エラー',
      message: '送信処理でエラーが発生しました。',
      error: { status: 500 },
    });
  }
});

export default router;