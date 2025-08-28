import express from 'express';
const router = express.Router();

// イベント申込分岐ページ表示
router.get('/', (req, res) => {
  res.render('apply', {
    title: 'イベント申込'
  });
});


export default router;