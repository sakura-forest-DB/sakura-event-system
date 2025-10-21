import express from 'express';
const router = express.Router();

// 個人登録フォーム表示
router.get('/', (req, res) => {
  res.render('register', {
    title: 'ボランティア登録',
    errors: [],
    formData: {}
  });
});

// ボランティア登録フォーム表示（修正用）
router.post('/edit', async (req, res) => {
  res.render('register', {
    title: 'ボランティア登録',
    errors: [],
    formData: req.body
  });
});

// ボランティア登録処理（確認画面表示）
router.post('/', async (req, res) => {
  try {
    const prisma = req.prisma;
    const {
      type,
      name,
      orgName,
      email,
      phone,
      address,
      skills,
      interests,
      conservationActivities,
      notes,
      agreeToTerms
    } = req.body;

    const errors = [];

    // バリデーション
    if (!name) errors.push('氏名または団体名は必須です');
    if (!email) errors.push('メールアドレスは必須です');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('有効なメールアドレスを入力してください');
    }
    if (!agreeToTerms) errors.push('個人情報取扱いに同意する必要があります');

    // 重複チェック
    const existingVolunteer = await prisma.volunteer.findFirst({
      where: {
        AND: [
          { email: email },
          { name: name }
        ]
      }
    });

    if (existingVolunteer) {
      errors.push('同じメールアドレスと氏名の登録が既に存在します');
    }

    if (errors.length > 0) {
      return res.render('register', {
        title: 'ボランティア登録',
        errors,
        formData: req.body
      });
    }

    // エラーがない場合は確認画面を表示
    res.render('register_confirm', {
      title: 'ボランティア登録内容確認',
      formData: req.body
    });

  } catch (error) {
    console.error('Register validation error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: '登録中にエラーが発生しました'
    });
  }
});

// ボランティア登録最終送信処理
router.post('/submit', async (req, res) => {
  try {
    const prisma = req.prisma;
    const {
      type,
      name,
      orgName,
      email,
      phone,
      address,
      skills,
      interests,
      conservationActivities,
      notes,
      agreeToTerms
    } = req.body;

    // 再度重複チェック（送信時の最終確認）
    const existingVolunteer = await prisma.volunteer.findFirst({
      where: {
        AND: [
          { email: email },
          { name: name }
        ]
      }
    });

    if (existingVolunteer) {
      return res.render('error', {
        title: 'エラー',
        message: '同じメールアドレスと氏名の登録が既に存在します。'
      });
    }

    // ボランティア登録
    const volunteer = await prisma.volunteer.create({
      data: {
        type: type || 'individual',
        name,
        orgName: type === 'org' ? orgName : null,
        email,
        phone: phone || null,
        address: address || null,
        skills: JSON.stringify(Array.isArray(skills) ? skills : [skills].filter(Boolean)),
        interests: JSON.stringify(Array.isArray(interests) ? interests : [interests].filter(Boolean)) + '|' + 
                   JSON.stringify(Array.isArray(conservationActivities) ? conservationActivities : [conservationActivities].filter(Boolean)),
        notes: notes || null
      }
    });

    res.render('register-success', {
      title: 'ボランティア登録完了',
      volunteer,
      isPreview: false
    });

  } catch (error) {
    console.error('Registration submit error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: '登録送信中にエラーが発生しました'
    });
  }
});

export default router;