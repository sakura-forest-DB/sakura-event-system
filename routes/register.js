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

// 個人登録処理
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
      title: '登録完了',
      volunteer
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: '登録中にエラーが発生しました'
    });
  }
});

export default router;