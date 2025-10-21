import express from 'express';
const router = express.Router();

// 登録状況確認フォーム表示
router.get('/', (req, res) => {
  res.render('status', {
    title: '登録状況確認',
    error: null,
    email: null
  });
});

// 登録状況検索処理
router.post('/', async (req, res) => {
  try {
    const prisma = req.prisma;
    const { email } = req.body;

    if (!email) {
      return res.render('status', {
        title: '登録状況確認',
        error: 'メールアドレスを入力してください',
        email: email
      });
    }

    // メールアドレスでボランティア登録を検索
    const volunteer = await prisma.volunteer.findFirst({
      where: { email: email }
    });

    res.render('status-result', {
      title: 'ボランティア登録状況確認',
      email,
      volunteer
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: '登録状況確認中にエラーが発生しました'
    });
  }
});

export default router;