// routes/apply.js（最小・安全版）
import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// /apply 直叩き → 404（ここだけ）
router.get('/', (req, res) => {
  return res.status(404).render('404', { title: 'ページが見つかりません' });
});

// /apply/:slug → ランディング
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) {
    return res.status(404).render('404', { title: 'ページが見つかりません' });
  }
  if (!event.isPublic || event.status !== 'OPEN') {
    return res.status(200).render('apply-closed', { title: '申込受付終了', event });
  }
  return res.render('apply-landing', { title: `${event.title} - 申込`, event });
});

// ★ここで終わり（catch-all は app.js の最後だけ）
export default router;