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

    // === ここから差し替え ===

// 値取り出し＆型変換ヘルパ
const get = (k) => {
  const v = req.session?.stallDraft?.[k] ?? req.body?.[k];
  const s = (v ?? '').toString().trim();
  return s === '' ? null : s;
};
const getInt = (k) => {
  const s = get(k);
  if (s === null) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
};

// DBへ保存
const saved = await prisma.stallApplication.create({
  data: {
    eventId:          event.id,
    groupName:        get('groupName'),
    representative:   get('representative'),
    email:            get('email'),
    phone:            get('phone'),
    address:          get('address'),

    boothType:        get('boothType'),      // 例: 飲食/物販/体験
    boothCount:       getInt('boothCount'),
    priceRangeMin:    getInt('priceRangeMin'),
    priceRangeMax:    getInt('priceRangeMax'),
    rentalTables:     getInt('rentalTables'),
    rentalChairs:     getInt('rentalChairs'),
    vehicleType:      get('vehicleType'),
    vehicleNumbers:   get('vehicleNumbers'),
    questions:        get('questions'),

    privacyConsent:   get('privacyConsent') === 'on',
    marketingConsent: get('marketingConsent') === 'on',
  }
});

// 仮の受付番号（任意）
const fakeReceipt = 'STL-' + Math.random().toString(36).slice(2, 8).toUpperCase();

// 下書きクリア
if (req.session) delete req.session.stallDraft;

// 完了画面へ（DB保存した内容を渡す）
return res.render('apply_stall_thanks', {
  title: `${event.title} - 出店申込 完了`,
  event,
  applicationNumber: fakeReceipt,
  application: saved,
});

// === 差し替えここまで ===
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