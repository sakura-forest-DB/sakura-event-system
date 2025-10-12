import express from 'express';
  const router = express.Router();

  // イベント申込分岐ページ表示（slugなしは404）
  router.get('/', (req, res) =>
    res.status(404).render('error', {
      title: 'ページが見つかりません',
      message: 'イベントを指定してください',
      error: { status: 404 }
    })
  );

  export default router;
