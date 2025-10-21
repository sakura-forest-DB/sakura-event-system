// src/routes/apply-performer.js
import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

/**
 * GET 入力画面
 * 例: /apply/forest-christmas/performer
 */
router.get('/:slug/performer', async (req, res) => {
  try {
    const { slug } = req.params;
    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event) {
      return res.status(404).render('error', {
        title: 'イベントが見つかりません',
        message: '指定されたイベントが見つかりません',
        error: { status: 404 }
      });
    }

    // 申込可否チェック（必要なら）
    const now = new Date();
    const canApply = event.isPublic && event.status === 'OPEN' &&
                     (!event.applicationStartDate || event.applicationStartDate <= now);
    if (!canApply) {
      return res.render('apply-closed', {
        title: '申込受付終了',
        event
      });
    }

    // セッション下書き復元
    const formData = (req.session && req.session.performerDraft) || {};
    return res.render('apply_performer', {
      title: `${event.title} 出演申込`,
      event,
      formData,
      errors: []
    });
  } catch (err) {
    console.error('[performer GET] error', err);
    return res.status(500).render('error', {
      title: 'エラー',
      message: 'ページ表示に失敗しました',
      error: { status: 500 }
    });
  }
});

/**
 * POST 確認画面へ
 * 例: /apply/forest-christmas/performer
 */
router.post('/:slug/performer', async (req, res) => {
  try {
    const { slug } = req.params;
    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event) {
      return res.status(404).render('error', {
        title: 'イベントが見つかりません',
        message: '指定されたイベントが見つかりません',
        error: { status: 404 }
      });
    }

    const formData = {
      groupName: req.body.groupName?.trim() || '',
      representative: req.body.representative?.trim() || '',
      email: req.body.email?.trim() || '',
      phone: req.body.phone?.trim() || '',
      address: req.body.address?.trim() || '',
      performance: req.body.performance?.trim() || '',
      performerCount: req.body.performerCount || '',
      slotCount: req.body.slotCount || '',
      audioSourceOnly: req.body.audioSourceOnly || '',
      rentalAmp: req.body.rentalAmp || '',
      rentalMic: req.body.rentalMic || '',
      vehicleCount: req.body.vehicleCount || '',
      vehicleNumbers: req.body.vehicleNumbers?.trim() || '',
      questions: req.body.questions?.trim() || '',
      privacyConsent: req.body.privacyConsent ? 'on' : ''
    };

    // 超簡易バリデーション（必要なら拡張OK）
    const errors = [];
    if (!formData.groupName) errors.push('参加団体名は必須です');
    if (!formData.representative) errors.push('代表者名は必須です');
    if (!formData.email) errors.push('メールアドレスは必須です');
    if (!formData.phone) errors.push('電話番号は必須です');
    if (!formData.performance) errors.push('出演内容は必須です');
    if (formData.privacyConsent !== 'on') errors.push('個人情報の同意が必要です');

    if (errors.length > 0) {
      return res.status(400).render('apply_performer', {
        title: `${event.title} 出演申込`,
        event,
        formData,
        errors
      });
    }

    // 下書きをセッションに保持 → 確認画面へ
    if (req.session) req.session.performerDraft = formData;

    return res.render('apply_performer_confirm', {
      title: '入力内容の確認',
      event,
      formData
    });
  } catch (err) {
    console.error('[performer POST] error', err);
    return res.status(500).render('error', {
      title: 'エラー',
      message: '確認画面の表示に失敗しました',
      error: { status: 500 }
    });
  }
});

/**
 * POST 本送信
 * 例: /apply/forest-christmas/performer/submit
 */
router.post('/:slug/performer/submit', async (req, res) => {
  try {
    const { slug } = req.params;
    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event) {
      return res.status(404).render('error', {
        title: 'イベントが見つかりません',
        message: '指定されたイベントが見つかりません',
        error: { status: 404 }
      });
    }

    const formData = (req.session && req.session.performerDraft) || {};
    if (!formData.groupName || !formData.representative || !formData.email) {
      // 下書き無し or 直接叩かれた場合は入力へ戻す
      return res.redirect(`/apply/${slug}/performer`);
    }

    // ここで DB 保存（テーブル名は仮。プロジェクトのスキーマに合わせて書き換え）
    await prisma.performerApplication.create({
      data: {
        eventId: event.id,
        groupName: formData.groupName,
        representative: formData.representative,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        performance: formData.performance,
        performerCount: formData.performerCount ? Number(formData.performerCount) : null,
        slotCount: formData.slotCount ? Number(formData.slotCount) : null,
        audioSourceOnly: formData.audioSourceOnly ? Number(formData.audioSourceOnly) : null,
        rentalAmp: formData.rentalAmp ? Number(formData.rentalAmp) : null,
        rentalMic: formData.rentalMic ? Number(formData.rentalMic) : null,
        vehicleCount: formData.vehicleCount ? Number(formData.vehicleCount) : null,
        vehicleNumbers: formData.vehicleNumbers,
        questions: formData.questions
      }
    });

    // 下書きクリア
    if (req.session) delete req.session.performerDraft;

    return res.render('apply_complete', {
      title: '申込完了',
      event,
      kind: 'performer'
    });
  } catch (err) {
    console.error('[performer SUBMIT] error', err);
    return res.status(500).render('error', {
      title: 'エラー',
      message: '申込の保存に失敗しました',
      error: { status: 500 }
    });
  }
});

export default router;