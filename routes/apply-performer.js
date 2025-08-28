import express from 'express';
const router = express.Router();

// 出演申込フォーム表示
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

    console.log('出演申込: 取得されたイベント数:', events.length);

    res.render('apply_performer', {
      title: '出演申込',
      events: eventsWithApplicationStatus,
      errors: [],
      formData: {}
    });
  } catch (error) {
    console.error('Apply performer page error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: 'イベント情報の取得中にエラーが発生しました'
    });
  }
});

// 出演申込処理
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
      performance,
      performerCount,
      slotCount,
      vehicleCount,
      rentalAmp,
      rentalMic,
      questions
    } = req.body;

    const errors = [];

    // バリデーション
    if (!groupName) errors.push('参加団体名は必須です');
    if (!representative) errors.push('代表者名は必須です');
    if (!email) errors.push('メールアドレスは必須です');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('有効なメールアドレスを入力してください');
    }
    if (!eventId) errors.push('イベントを選択してください');
    if (!performance) errors.push('出演内容は必須です');

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
    if (performerCount && parseInt(performerCount) < 1) {
      errors.push('出演者数は1以上で入力してください');
    }
    if (slotCount && parseInt(slotCount) < 1) {
      errors.push('希望出演枠数は1以上で入力してください');
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
      
      return res.render('apply_performer', {
        title: '出演申込',
        events,
        errors,
        formData: req.body
      });
    }

    // 出演申込作成
    const performerApplication = await prisma.performerApplication.create({
      data: {
        groupName,
        representative,
        address: address || null,
        email,
        phone: phone || null,
        eventId,
        performance,
        performerCount: performerCount ? parseInt(performerCount) : null,
        slotCount: slotCount ? parseInt(slotCount) : null,
        vehicleCount: vehicleCount ? parseInt(vehicleCount) : null,
        rentalAmp: rentalAmp ? parseInt(rentalAmp) : null,
        rentalMic: rentalMic ? parseInt(rentalMic) : null,
        questions: questions || null
      }
    });

    // イベント情報を取得
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    res.render('thanks', {
      title: '出演申込完了',
      type: 'performer',
      application: performerApplication,
      event
    });

  } catch (error) {
    console.error('Apply performer error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: '申込中にエラーが発生しました'
    });
  }
});

export default router;