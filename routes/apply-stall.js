import express from 'express';
const router = express.Router();

// 出店申込フォーム表示
router.get('/', async (req, res) => {
  try {
    const prisma = req.prisma;
    
    // 募集中のイベント取得（指定された3つのイベントのみ）
    const currentDate = new Date();
    const events = await prisma.event.findMany({
      where: {
        AND: [
          {
            date: {
              gte: currentDate
            }
          },
          {
            title: {
              in: ['🌸桜まつり', '🍁感謝祭', '🎄Forest Christmas']
            }
          }
        ]
      },
      orderBy: { date: 'asc' }
    });

    // 申込可能かどうかを各イベントに追加
    const eventsWithApplicationStatus = events.map(event => ({
      ...event,
      canApply: !event.applicationStartDate || event.applicationStartDate <= currentDate,
      applicationStartMessage: event.applicationStartDate && event.applicationStartDate > currentDate 
        ? `申込開始: ${event.applicationStartDate.toLocaleDateString('ja-JP')}から`
        : null
    }));

    console.log('出店申込: 取得されたイベント数:', events.length);

    res.render('apply_stall', {
      title: '出店申込',
      events: eventsWithApplicationStatus,
      errors: [],
      formData: {}
    });
  } catch (error) {
    console.error('Apply stall page error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: 'イベント情報の取得中にエラーが発生しました'
    });
  }
});

// 出店申込フォーム表示（修正用）
router.post('/edit', async (req, res) => {
  try {
    const prisma = req.prisma;
    
    // 募集中のイベント取得（指定された3つのイベントのみ）
    const currentDate = new Date();
    const events = await prisma.event.findMany({
      where: {
        AND: [
          {
            date: {
              gte: currentDate
            }
          },
          {
            title: {
              in: ['🌸桜まつり', '🍁感謝祭', '🎄Forest Christmas']
            }
          }
        ]
      },
      orderBy: { date: 'asc' }
    });

    // 申込可能かどうかを各イベントに追加
    const eventsWithApplicationStatus = events.map(event => ({
      ...event,
      canApply: !event.applicationStartDate || event.applicationStartDate <= currentDate,
      applicationStartMessage: event.applicationStartDate && event.applicationStartDate > currentDate 
        ? `申込開始: ${event.applicationStartDate.toLocaleDateString('ja-JP')}から`
        : null
    }));

    res.render('apply_stall', {
      title: '出店申込',
      events: eventsWithApplicationStatus,
      errors: [],
      formData: req.body
    });
  } catch (error) {
    console.error('Apply stall edit error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: 'イベント情報の取得中にエラーが発生しました'
    });
  }
});

// 出店申込処理
router.post('/', async (req, res) => {
  try {
    const prisma = req.prisma;
    const {
      groupName,
      representative,
      address,
      email,
      phone,
      eventId,
      boothType,
      items,
      priceRangeMin,
      priceRangeMax,
      boothCount,
      tentWidth,
      tentDepth,
      tentHeight,
      vehicleCount,
      vehicleType,
      vehicleNumbers,
      rentalTables,
      rentalChairs,
      questions,
      privacyConsent,
      marketingConsent
    } = req.body;

    const errors = [];

    // バリデーション
    if (!groupName) errors.push('参加団体名は必須です');
    if (!representative) errors.push('代表者名は必須です');
    if (!email) errors.push('メールアドレスは必須です');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('有効なメールアドレスを入力してください');
    }
    if (!phone) errors.push('電話番号は必須です');
    if (!eventId) errors.push('イベントを選択してください');
    if (!boothType) errors.push('出店内容を選択してください');
    if (!privacyConsent) errors.push('個人情報の利用について同意が必要です');

    // イベントの申込開始日チェック
    if (eventId) {
      const selectedEvent = await prisma.event.findUnique({
        where: { id: eventId }
      });
      if (selectedEvent && selectedEvent.applicationStartDate && selectedEvent.applicationStartDate > new Date()) {
        errors.push(`${selectedEvent.title}の申込開始は${selectedEvent.applicationStartDate.toLocaleDateString('ja-JP')}からです`);
      }
    }

    // 数値バリデーション
    if (priceRangeMin && priceRangeMax && parseInt(priceRangeMin) > parseInt(priceRangeMax)) {
      errors.push('価格帯の設定が正しくありません');
    }

    if (errors.length > 0) {
      const events = await prisma.event.findMany({
        where: {
          AND: [
            {
              date: { gte: new Date() }
            },
            {
              title: {
                in: ['🌸桜まつり', '🍁感謝祭', '🎄Forest Christmas']
              }
            }
          ]
        },
        orderBy: { date: 'asc' }
      });
      
      return res.render('apply_stall', {
        title: '出店申込',
        events,
        errors,
        formData: req.body
      });
    }

    // エラーがない場合は確認画面を表示
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    res.render('apply_stall_confirm', {
      title: '出店申込内容確認',
      formData: req.body,
      event,
      isPreview: false
    });

  } catch (error) {
    console.error('Apply stall error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: '申込中にエラーが発生しました'
    });
  }
});

// 出店申込最終送信処理
router.post('/submit', async (req, res) => {
  try {
    const prisma = req.prisma;
    const {
      groupName,
      representative,
      address,
      email,
      phone,
      eventId,
      boothType,
      items,
      priceRangeMin,
      priceRangeMax,
      boothCount,
      tentWidth,
      tentDepth,
      tentHeight,
      vehicleCount,
      vehicleType,
      vehicleNumbers,
      rentalTables,
      rentalChairs,
      questions,
      privacyConsent,
      marketingConsent
    } = req.body;

    // 初回申込スナップショット用データ
    const originalPayload = JSON.stringify(req.body);
    const submittedAt = new Date();

    // 出店申込作成
    const stallApplication = await prisma.stallApplication.create({
      data: {
        groupName,
        representative,
        address: address || null,
        email,
        phone: phone || null,
        eventId,
        boothType,
        items: items || null,
        priceRangeMin: priceRangeMin ? parseInt(priceRangeMin) : null,
        priceRangeMax: priceRangeMax ? parseInt(priceRangeMax) : null,
        boothCount: boothCount ? parseInt(boothCount) : null,
        tentWidth: tentWidth ? parseFloat(tentWidth) : null,
        tentDepth: tentDepth ? parseFloat(tentDepth) : null,
        tentHeight: tentHeight ? parseFloat(tentHeight) : null,
        vehicleCount: vehicleCount ? parseInt(vehicleCount) : null,
        vehicleType: vehicleType || null,
        vehicleNumbers: vehicleNumbers || null,
        rentalTables: rentalTables ? parseInt(rentalTables) : null,
        rentalChairs: rentalChairs ? parseInt(rentalChairs) : null,
        questions: questions || null,
        privacyConsent: privacyConsent === 'on',
        marketingConsent: marketingConsent === 'on',
        originalPayload,
        originalSubmittedAt: submittedAt
      }
    });

    // イベント情報を取得
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    res.render('thanks', {
      title: '出店申込完了',
      type: 'stall',
      application: stallApplication,
      event
    });

  } catch (error) {
    console.error('Apply stall submit error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: '申込送信中にエラーが発生しました'
    });
  }
});

export default router;