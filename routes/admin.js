import express from 'express';
import fs from 'fs/promises';
import createCsvWriter from 'csv-writer';

const router = express.Router();

// 認証ミドルウェア
const requireAuth = (req, res, next) => {
  if (!req.session.isAdmin) {
    return res.render('admin-login', { title: '管理者ログイン', error: null });
  }
  next();
};

// 管理者ログイン画面
router.get('/login', (req, res) => {
  if (req.session.isAdmin) {
    return res.redirect('/admin/volunteers');
  }
  res.render('admin-login', { title: '管理者ログイン', error: null });
});

// 管理者ログイン処理
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.redirect('/admin/volunteers');
  } else {
    res.render('admin-login', { 
      title: '管理者ログイン', 
      error: 'パスワードが正しくありません' 
    });
  }
});

// ログアウト
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// 管理者トップ（ボランティア一覧にリダイレクト）
router.get('/', requireAuth, (req, res) => {
  res.redirect('/admin/volunteers');
});

// ボランティア一覧・検索
router.get('/volunteers', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const { search, event, role, freq, page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;

    let whereClause = {};
    let include = {
      signups: {
        include: {
          event: true
        }
      }
    };

    // 検索条件
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ];
    }

    // イベント・役割・頻度での絞り込み
    if (event || role || freq) {
      whereClause.signups = {
        some: {}
      };
      if (event) whereClause.signups.some.eventId = event;
      if (role) whereClause.signups.some.role = role;
      if (freq) whereClause.signups.some.freq = freq;
    }

    const volunteers = await prisma.volunteer.findMany({
      where: whereClause,
      include,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const totalCount = await prisma.volunteer.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / limit);

    // 絞り込み用データ
    const events = await prisma.event.findMany({
      orderBy: { date: 'desc' }
    });

    res.render('admin/volunteers', {
      title: 'ボランティア名簿管理',
      volunteers: volunteers.map(v => ({
        ...v,
        skills: JSON.parse(v.skills || '[]'),
        interests: JSON.parse(v.interests || '[]')
      })),
      events,
      filters: { search, event, role, freq },
      pagination: {
        current: parseInt(page),
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Volunteers list error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: 'ボランティア一覧の取得中にエラーが発生しました'
    });
  }
});

// ボランティアCSVエクスポート
router.get('/volunteers/export', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    
    const volunteers = await prisma.volunteer.findMany({
      include: {
        signups: {
          include: {
            event: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // CSVデータ準備
    const csvData = volunteers.map(volunteer => ({
      ID: volunteer.id,
      種別: volunteer.type === 'individual' ? '個人' : '団体',
      氏名: volunteer.name,
      団体名: volunteer.orgName || '',
      メール: volunteer.email,
      電話: volunteer.phone || '',
      住所: volunteer.address || '',
      スキル: JSON.parse(volunteer.skills || '[]').join(', '),
      興味: JSON.parse(volunteer.interests || '[]').join(', '),
      備考: volunteer.notes || '',
      登録日: volunteer.createdAt.toISOString().split('T')[0],
      申込件数: volunteer.signups.length
    }));

    const csvWriter = createCsvWriter.createObjectCsvStringifier({
      header: [
        {id: 'ID', title: 'ID'},
        {id: '種別', title: '種別'},
        {id: '氏名', title: '氏名'},
        {id: '団体名', title: '団体名'},
        {id: 'メール', title: 'メールアドレス'},
        {id: '電話', title: '電話番号'},
        {id: '住所', title: '住所'},
        {id: 'スキル', title: 'スキル'},
        {id: '興味', title: '興味'},
        {id: '備考', title: '備考'},
        {id: '登録日', title: '登録日'},
        {id: '申込件数', title: '申込件数'}
      ]
    });

    const csvString = csvWriter.getHeaderString() + csvWriter.stringifyRecords(csvData);
    
    res.setHeader('Content-disposition', `attachment; filename=volunteers-${new Date().toISOString().split('T')[0]}.csv`);
    res.set('Content-Type', 'text/csv; charset=UTF-8');
    res.status(200).send('\uFEFF' + csvString); // BOM for Excel compatibility

  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: 'CSVエクスポート中にエラーが発生しました'
    });
  }
});

// イベント一覧
router.get('/events', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    
    const events = await prisma.event.findMany({
      include: {
        _count: {
          select: { signups: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.render('admin/events', {
      title: 'イベント管理',
      events
    });

  } catch (error) {
    console.error('Events list error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: 'イベント一覧の取得中にエラーが発生しました'
    });
  }
});

// イベント作成フォーム
router.get('/events/new', requireAuth, (req, res) => {
  res.render('admin/event-form', {
    title: 'イベント作成',
    event: {},
    errors: []
  });
});

// イベント編集フォーム
router.get('/events/:id/edit', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const event = await prisma.event.findUnique({
      where: { id: req.params.id }
    });

    if (!event) {
      return res.status(404).render('404', { title: 'イベントが見つかりません' });
    }

    res.render('admin/event-form', {
      title: 'イベント編集',
      event,
      errors: []
    });

  } catch (error) {
    console.error('Event edit error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: 'イベント情報の取得中にエラーが発生しました'
    });
  }
});

// イベント作成・更新処理
router.post('/events', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const { id, title, slug, date, location, description } = req.body;
    const errors = [];

    // バリデーション
    if (!title) errors.push('イベント名は必須です');
    if (!slug) errors.push('スラッグは必須です');
    if (!date) errors.push('日付は必須です');
    if (!location) errors.push('場所は必須です');

    // スラッグの重複チェック（編集時は自身を除く）
    const existingEvent = await prisma.event.findUnique({
      where: { slug }
    });
    if (existingEvent && existingEvent.id !== id) {
      errors.push('このスラッグは既に使用されています');
    }

    if (errors.length > 0) {
      return res.render('admin/event-form', {
        title: id ? 'イベント編集' : 'イベント作成',
        event: req.body,
        errors
      });
    }

    const eventData = {
      title,
      slug,
      date: new Date(date),
      location,
      description: description || ''
    };

    if (id) {
      // 更新
      await prisma.event.update({
        where: { id },
        data: eventData
      });
    } else {
      // 作成
      await prisma.event.create({
        data: eventData
      });
    }

    res.redirect('/admin/events');

  } catch (error) {
    console.error('Event save error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: 'イベントの保存中にエラーが発生しました'
    });
  }
});

// 出店申込一覧・検索
router.get('/stalls', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const { search, boothType, page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;

    let whereClause = {};

    // 検索条件
    if (search) {
      whereClause.OR = [
        { groupName: { contains: search } },
        { representative: { contains: search } },
        { email: { contains: search } }
      ];
    }

    if (boothType) {
      whereClause.boothType = boothType;
    }

    const stallApplications = await prisma.stallApplication.findMany({
      where: whereClause,
      include: {
        event: true
      },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const totalCount = await prisma.stallApplication.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / limit);

    res.render('admin/stalls', {
      title: '出店申込管理',
      stallApplications,
      filters: { search, boothType },
      pagination: {
        current: parseInt(page),
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Stalls list error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: '出店申込一覧の取得中にエラーが発生しました'
    });
  }
});

// 出店申込詳細表示
router.get('/stalls/:id', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const stallApplication = await prisma.stallApplication.findUnique({
      where: { id: req.params.id },
      include: { event: true }
    });

    if (!stallApplication) {
      return res.status(404).render('error', {
        title: 'エラー',
        message: '出店申込が見つかりません'
      });
    }

    res.render('admin/stall-detail', {
      title: '出店申込詳細',
      stall: stallApplication
    });

  } catch (error) {
    console.error('Stall detail error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: '出店申込詳細の取得中にエラーが発生しました'
    });
  }
});

// 出店申込CSVエクスポート
router.get('/stalls/export', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    
    const stallApplications = await prisma.stallApplication.findMany({
      include: {
        event: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // CSVデータ準備
    const csvData = stallApplications.map(stall => ({
      ID: stall.id,
      参加団体名: stall.groupName,
      代表者名: stall.representative,
      メール: stall.email,
      電話: stall.phone || '',
      住所: stall.address || '',
      イベント: stall.event?.title || '',
      出店内容: stall.boothType,
      販売品目: stall.items || '',
      価格帯最低: stall.priceRangeMin || '',
      価格帯最高: stall.priceRangeMax || '',
      希望枠数: stall.boothCount || '',
      テント横幅: stall.tentWidth || '',
      テント奥行: stall.tentDepth || '',
      テント高さ: stall.tentHeight || '',
      車両台数: stall.vehicleCount || '',
      レンタルテーブル: stall.rentalTables || '',
      レンタル椅子: stall.rentalChairs || '',
      連絡事項: stall.questions || '',
      申込日: stall.createdAt.toISOString().split('T')[0]
    }));

    const csvWriter = createCsvWriter.createObjectCsvStringifier({
      header: [
        {id: 'ID', title: 'ID'},
        {id: '参加団体名', title: '参加団体名'},
        {id: '代表者名', title: '代表者名'},
        {id: 'メール', title: 'メールアドレス'},
        {id: '電話', title: '電話番号'},
        {id: '住所', title: '住所'},
        {id: 'イベント', title: 'イベント'},
        {id: '出店内容', title: '出店内容'},
        {id: '販売品目', title: '販売品目'},
        {id: '価格帯最低', title: '価格帯（最低）'},
        {id: '価格帯最高', title: '価格帯（最高）'},
        {id: '希望枠数', title: '希望枠数'},
        {id: 'テント横幅', title: 'テント横幅（m）'},
        {id: 'テント奥行', title: 'テント奥行（m）'},
        {id: 'テント高さ', title: 'テント高さ（m）'},
        {id: '車両台数', title: '車両台数'},
        {id: 'レンタルテーブル', title: 'レンタルテーブル数'},
        {id: 'レンタル椅子', title: 'レンタル椅子数'},
        {id: '連絡事項', title: '連絡事項'},
        {id: '申込日', title: '申込日'}
      ]
    });

    const csvString = csvWriter.getHeaderString() + csvWriter.stringifyRecords(csvData);
    
    res.setHeader('Content-disposition', `attachment; filename=stall-applications-${new Date().toISOString().split('T')[0]}.csv`);
    res.set('Content-Type', 'text/csv; charset=UTF-8');
    res.status(200).send('\uFEFF' + csvString);

  } catch (error) {
    console.error('Stalls CSV export error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: '出店申込CSVエクスポート中にエラーが発生しました'
    });
  }
});

// 出演申込一覧・検索
router.get('/performers', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const { search, performance, page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;

    let whereClause = {};

    // 検索条件
    if (search) {
      whereClause.OR = [
        { groupName: { contains: search } },
        { representative: { contains: search } },
        { email: { contains: search } }
      ];
    }

    if (performance) {
      whereClause.performance = { contains: performance };
    }

    const performerApplications = await prisma.performerApplication.findMany({
      where: whereClause,
      include: {
        event: true
      },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const totalCount = await prisma.performerApplication.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / limit);

    res.render('admin/performers', {
      title: '出演申込管理',
      performerApplications,
      filters: { search, performance },
      pagination: {
        current: parseInt(page),
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Performers list error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: '出演申込一覧の取得中にエラーが発生しました'
    });
  }
});

// 出演申込詳細表示
router.get('/performers/:id', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const performerApplication = await prisma.performerApplication.findUnique({
      where: { id: req.params.id },
      include: { event: true }
    });

    if (!performerApplication) {
      return res.status(404).render('error', {
        title: 'エラー',
        message: '出演申込が見つかりません'
      });
    }

    res.render('admin/performer-detail', {
      title: '出演申込詳細',
      performer: performerApplication
    });

  } catch (error) {
    console.error('Performer detail error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: '出演申込詳細の取得中にエラーが発生しました'
    });
  }
});

// 出演申込CSVエクスポート
router.get('/performers/export', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    
    const performerApplications = await prisma.performerApplication.findMany({
      include: {
        event: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // CSVデータ準備
    const csvData = performerApplications.map(performer => ({
      ID: performer.id,
      参加団体名: performer.groupName,
      代表者名: performer.representative,
      メール: performer.email,
      電話: performer.phone || '',
      住所: performer.address || '',
      イベント: performer.event?.title || '',
      出演内容: performer.performance,
      出演者数: performer.performerCount || '',
      希望枠数: performer.slotCount || '',
      車両台数: performer.vehicleCount || '',
      拡声装置: performer.rentalAmp || '',
      追加マイク: performer.rentalMic || '',
      連絡事項: performer.questions || '',
      申込日: performer.createdAt.toISOString().split('T')[0]
    }));

    const csvWriter = createCsvWriter.createObjectCsvStringifier({
      header: [
        {id: 'ID', title: 'ID'},
        {id: '参加団体名', title: '参加団体名'},
        {id: '代表者名', title: '代表者名'},
        {id: 'メール', title: 'メールアドレス'},
        {id: '電話', title: '電話番号'},
        {id: '住所', title: '住所'},
        {id: 'イベント', title: 'イベント'},
        {id: '出演内容', title: '出演内容'},
        {id: '出演者数', title: '出演者数'},
        {id: '希望枠数', title: '希望枠数'},
        {id: '車両台数', title: '車両台数'},
        {id: '拡声装置', title: '拡声装置レンタル数'},
        {id: '追加マイク', title: '追加マイク本数'},
        {id: '連絡事項', title: '連絡事項'},
        {id: '申込日', title: '申込日'}
      ]
    });

    const csvString = csvWriter.getHeaderString() + csvWriter.stringifyRecords(csvData);
    
    res.setHeader('Content-disposition', `attachment; filename=performer-applications-${new Date().toISOString().split('T')[0]}.csv`);
    res.set('Content-Type', 'text/csv; charset=UTF-8');
    res.status(200).send('\uFEFF' + csvString);

  } catch (error) {
    console.error('Performers CSV export error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: '出演申込CSVエクスポート中にエラーが発生しました'
    });
  }
});

export default router;