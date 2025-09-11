import express from 'express';
import fs from 'fs/promises';
import createCsvWriter from 'csv-writer';

const router = express.Router();

// 認証ミドルウェア（完全無効化）
const requireAuth = (req, res, next) => {
  console.log('認証無効化中 - 直接通過:', req.url);
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
    const { search, event, role, page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;

    let whereClause = {};
    let include = {
      signups: {
        include: {
          event: true
        }
      },
      changeLogs: {
        orderBy: { createdAt: 'desc' },
        take: 1  // 最新の変更のみ
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

    // イベント・役割での絞り込み
    if (event || role) {
      whereClause.signups = {
        some: {}
      };
      if (event) whereClause.signups.some.eventId = event;
      if (role) whereClause.signups.some.role = role;
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
        skills: (() => {
          try {
            return JSON.parse(v.skills || '[]');
          } catch {
            return [];
          }
        })(),
        interests: (() => {
          try {
            return JSON.parse(v.interests || '[]');
          } catch {
            return [];
          }
        })()
      })),
      events,
      filters: { search, event, role },
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
      スキル: (() => {
        try {
          return JSON.parse(volunteer.skills || '[]').join(', ');
        } catch {
          return '';
        }
      })(),
      興味: (() => {
        try {
          return JSON.parse(volunteer.interests || '[]').join(', ');
        } catch {
          return '';
        }
      })(),
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

// ボランティア詳細
router.get('/volunteers/:id', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const volunteer = await prisma.volunteer.findUnique({
      where: { id: req.params.id },
      include: {
        signups: {
          include: {
            event: true
          }
        },
        changeLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!volunteer) {
      return res.status(404).render('404', { title: 'ボランティアが見つかりません' });
    }

    res.render('admin/volunteer-detail', {
      title: 'ボランティア詳細',
      volunteer
    });

  } catch (error) {
    console.error('Volunteer detail error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: 'ボランティア詳細の取得中にエラーが発生しました'
    });
  }
});

// ボランティア編集フォーム
router.get('/volunteers/:id/edit', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const volunteer = await prisma.volunteer.findUnique({
      where: { id: req.params.id }
    });

    if (!volunteer) {
      return res.status(404).render('404', { title: 'ボランティアが見つかりません' });
    }

    res.render('admin/volunteer-edit', {
      title: 'ボランティア編集',
      volunteer,
      errors: []
    });

  } catch (error) {
    console.error('Volunteer edit error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: 'ボランティア編集画面の表示中にエラーが発生しました'
    });
  }
});

// ボランティア更新処理
router.post('/volunteers/:id/update', requireAuth, async (req, res) => {
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
      editor,
      reason
    } = req.body;

    const errors = [];

    // バリデーション
    if (!name) errors.push('氏名は必須です');
    if (!email) errors.push('メールアドレスは必須です');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('有効なメールアドレスを入力してください');
    }
    if (!editor) errors.push('編集者名は必須です');
    if (!reason) errors.push('変更理由は必須です');

    if (errors.length > 0) {
      const volunteer = await prisma.volunteer.findUnique({
        where: { id: req.params.id }
      });
      return res.render('admin/volunteer-edit', {
        title: 'ボランティア編集',
        volunteer,
        errors
      });
    }

    // 現在の値を取得（変更履歴用）
    const currentVolunteer = await prisma.volunteer.findUnique({
      where: { id: req.params.id }
    });

    // ボランティア情報更新
    const updatedVolunteer = await prisma.volunteer.update({
      where: { id: req.params.id },
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

    // 変更履歴を記録
    const changes = [];
    if (currentVolunteer.name !== name) changes.push({ field: '氏名', oldValue: currentVolunteer.name, newValue: name });
    if (currentVolunteer.email !== email) changes.push({ field: 'メールアドレス', oldValue: currentVolunteer.email, newValue: email });
    if ((currentVolunteer.phone || '') !== (phone || '')) changes.push({ field: '電話番号', oldValue: currentVolunteer.phone || '', newValue: phone || '' });
    
    for (const change of changes) {
      await prisma.changeLog.create({
        data: {
          entity: 'Volunteer',
          entityId: req.params.id,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          reason,
          editor,
          volunteerId: req.params.id
        }
      });
    }

    res.redirect(`/admin/volunteers/${updatedVolunteer.id}`);

  } catch (error) {
    console.error('Volunteer update error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: 'ボランティア情報の更新中にエラーが発生しました'
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
        event: true,
        adminNotes: true,
        changeLogs: true
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

    // CSVデータ準備（データがない場合は空配列）
    const csvData = stallApplications.length > 0 ? stallApplications.map(stall => ({
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
      車両ナンバー: stall.vehicleNumbers || '',
      レンタルテーブル: stall.rentalTables || '',
      レンタル椅子: stall.rentalChairs || '',
      連絡事項: stall.questions || '',
      運営利用同意: stall.privacyConsent ? '同意' : '未同意',
      マーケティング利用同意: stall.marketingConsent ? '同意' : '同意しない',
      申込日: stall.createdAt.toISOString().split('T')[0]
    })) : [];

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
        {id: '車両ナンバー', title: '車両ナンバー'},
        {id: 'レンタルテーブル', title: 'レンタルテーブル数'},
        {id: 'レンタル椅子', title: 'レンタル椅子数'},
        {id: '連絡事項', title: '連絡事項'},
        {id: '運営利用同意', title: '運営利用同意'},
        {id: 'マーケティング利用同意', title: 'マーケティング利用同意'},
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

// 出店申込詳細表示
router.get('/stalls/:id', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const stallApplication = await prisma.stallApplication.findUnique({
      where: { id: req.params.id },
      include: { 
        event: true,
        adminNotes: {
          orderBy: { createdAt: 'desc' }
        },
        changeLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
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
        event: true,
        adminNotes: true,
        changeLogs: true
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

// 出演申込CSVエクスポート
router.get('/performers/export', requireAuth, async (req, res) => {
  try {
    console.log('出演申込CSV出力開始');
    const prisma = req.prisma;
    
    const performerApplications = await prisma.performerApplication.findMany({
      include: {
        event: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // CSVデータ準備（データがない場合は空配列）
    const csvData = performerApplications.length > 0 ? performerApplications.map(performer => ({
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
      車両ナンバー: performer.vehicleNumbers || '',
      拡声装置: performer.rentalAmp || '',
      追加マイク: performer.rentalMic || '',
      連絡事項: performer.questions || '',
      運営利用同意: performer.privacyConsent ? '同意' : '未同意',
      マーケティング利用同意: performer.marketingConsent ? '同意' : '同意しない',
      申込日: performer.createdAt.toISOString().split('T')[0]
    })) : [];

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
        {id: '車両ナンバー', title: '車両ナンバー'},
        {id: '拡声装置', title: '拡声装置レンタル数'},
        {id: '追加マイク', title: '追加マイク本数'},
        {id: '連絡事項', title: '連絡事項'},
        {id: '運営利用同意', title: '運営利用同意'},
        {id: 'マーケティング利用同意', title: 'マーケティング利用同意'},
        {id: '申込日', title: '申込日'}
      ]
    });

    const csvString = csvWriter.getHeaderString() + csvWriter.stringifyRecords(csvData);
    
    res.setHeader('Content-disposition', `attachment; filename=performer-applications-${new Date().toISOString().split('T')[0]}.csv`);
    res.set('Content-Type', 'text/csv; charset=UTF-8');
    res.status(200).send('\uFEFF' + csvString);

  } catch (error) {
    console.error('Performers CSV export error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).render('error', {
      title: 'エラー',
      message: '出演申込CSVエクスポート中にエラーが発生しました',
      error: error
    });
  }
});

// 出演申込詳細表示
router.get('/performers/:id', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const performerApplication = await prisma.performerApplication.findUnique({
      where: { id: req.params.id },
      include: { 
        event: true,
        adminNotes: {
          orderBy: { createdAt: 'desc' }
        },
        changeLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
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

// 出店申込編集画面
router.get('/stalls/:id/edit', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const stallApplication = await prisma.stallApplication.findUnique({
      where: { id: req.params.id },
      include: {
        event: true,
        adminNotes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!stallApplication) {
      return res.status(404).render('error', {
        title: 'エラー',
        message: '出店申込が見つかりません'
      });
    }

    res.render('admin/stall-edit', {
      title: '出店申込編集',
      stall: stallApplication,
      errors: []
    });

  } catch (error) {
    console.error('Stall edit page error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: '出店申込編集画面の表示中にエラーが発生しました'
    });
  }
});

// 出店申込更新処理
router.post('/stalls/:id/update', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const {
      groupName,
      representative,
      address,
      email,
      phone,
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
      editor,
      reason
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
    if (!boothType) errors.push('出店内容を選択してください');
    if (!editor) errors.push('編集者名は必須です');
    if (!reason) errors.push('変更理由は必須です');

    if (errors.length > 0) {
      const stallApplication = await prisma.stallApplication.findUnique({
        where: { id: req.params.id },
        include: { event: true, adminNotes: { orderBy: { createdAt: 'desc' } } }
      });
      
      return res.render('admin/stall-edit', {
        title: '出店申込編集',
        stall: stallApplication,
        errors
      });
    }

    // 現在のデータを取得
    const currentStall = await prisma.stallApplication.findUnique({
      where: { id: req.params.id }
    });

    if (!currentStall) {
      return res.status(404).render('error', {
        title: 'エラー',
        message: '出店申込が見つかりません'
      });
    }

    // 新しいデータ
    const newData = {
      groupName,
      representative,
      address: address || null,
      email,
      phone,
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
      questions: questions || null
    };

    // 差分検出とChangeLog作成
    const changes = [];
    const fieldNames = {
      groupName: '参加団体名',
      representative: '代表者名',
      address: '住所',
      email: 'メールアドレス',
      phone: '電話番号',
      boothType: '出店内容',
      items: '販売品目',
      priceRangeMin: '価格帯（最低）',
      priceRangeMax: '価格帯（最高）',
      boothCount: '希望出店枠数',
      tentWidth: 'テント横幅',
      tentDepth: 'テント奥行',
      tentHeight: 'テント高さ',
      vehicleCount: '車両台数',
      vehicleType: '車両種別',
      vehicleNumbers: '車両ナンバー',
      rentalTables: 'レンタルテーブル数',
      rentalChairs: 'レンタル椅子数',
      questions: '連絡事項'
    };

    for (const [field, newValue] of Object.entries(newData)) {
      const oldValue = currentStall[field];
      
      // 空文字列とnullを正規化して比較
      const normalizeValue = (val) => {
        if (val === null || val === undefined || val === '') return null;
        return val;
      };
      
      const normalizedOld = normalizeValue(oldValue);
      const normalizedNew = normalizeValue(newValue);
      
      if (JSON.stringify(normalizedOld) !== JSON.stringify(normalizedNew)) {
        changes.push({
          entity: 'StallApplication',
          entityId: req.params.id,
          field: fieldNames[field] || field,
          oldValue: normalizedOld ? String(normalizedOld) : null,
          newValue: normalizedNew ? String(normalizedNew) : null,
          reason,
          editor,
          stallApplicationId: req.params.id
        });
      }
    }

    // 変更があった場合のみ更新
    if (changes.length > 0) {
      // ChangeLog作成
      await prisma.changeLog.createMany({
        data: changes
      });

      // データ更新
      await prisma.stallApplication.update({
        where: { id: req.params.id },
        data: newData
      });
    }

    res.redirect(`/admin/stalls/${req.params.id}`);

  } catch (error) {
    console.error('Stall update error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: '出店申込更新中にエラーが発生しました'
    });
  }
});

// 追記メモ投稿（出店申込）
router.post('/stalls/:id/notes', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const { content, adminName } = req.body;
    
    if (!content || !adminName) {
      return res.redirect(`/admin/stalls/${req.params.id}?error=メモ内容と記録者名を入力してください`);
    }

    await prisma.applicationNote.create({
      data: {
        content: content.trim(),
        adminName: adminName.trim(),
        stallApplicationId: req.params.id
      }
    });

    res.redirect(`/admin/stalls/${req.params.id}`);

  } catch (error) {
    console.error('Stall note creation error:', error);
    res.redirect(`/admin/stalls/${req.params.id}?error=メモの保存に失敗しました`);
  }
});

// 出演申込編集画面
router.get('/performers/:id/edit', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const performerApplication = await prisma.performerApplication.findUnique({
      where: { id: req.params.id },
      include: {
        event: true,
        adminNotes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!performerApplication) {
      return res.status(404).render('error', {
        title: 'エラー',
        message: '出演申込が見つかりません'
      });
    }

    res.render('admin/performer-edit', {
      title: '出演申込編集',
      performer: performerApplication,
      errors: []
    });

  } catch (error) {
    console.error('Performer edit page error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: '出演申込編集画面の表示中にエラーが発生しました'
    });
  }
});

// 出演申込更新処理
router.post('/performers/:id/update', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const {
      groupName,
      representative,
      address,
      email,
      phone,
      performance,
      performerCount,
      slotCount,
      audioSourceOnly,
      rentalAmp,
      rentalMic,
      vehicleCount,
      vehicleNumbers,
      questions,
      editor,
      reason
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
    if (!performance) errors.push('出演内容は必須です');
    if (!editor) errors.push('編集者名は必須です');
    if (!reason) errors.push('変更理由は必須です');

    if (errors.length > 0) {
      const performerApplication = await prisma.performerApplication.findUnique({
        where: { id: req.params.id },
        include: { event: true }
      });
      
      return res.render('admin/performer-edit', {
        title: '出演申込編集',
        performer: performerApplication,
        errors
      });
    }

    // 既存データを取得
    const currentData = await prisma.performerApplication.findUnique({
      where: { id: req.params.id }
    });

    if (!currentData) {
      return res.status(404).render('error', {
        title: 'エラー',
        message: '出演申込が見つかりません'
      });
    }

    // 新しいデータを準備
    const newData = {
      groupName,
      representative,
      address: address || null,
      email,
      phone,
      performance,
      performerCount: performerCount ? parseInt(performerCount) : null,
      slotCount: slotCount ? parseInt(slotCount) : null,
      audioSourceOnly: audioSourceOnly ? parseInt(audioSourceOnly) : null,
      rentalAmp: rentalAmp ? parseInt(rentalAmp) : null,
      rentalMic: rentalMic ? parseInt(rentalMic) : null,
      vehicleCount: vehicleCount ? parseInt(vehicleCount) : null,
      vehicleNumbers: vehicleNumbers || null,
      questions: questions || null
    };

    // 差分検出とChangeLog作成
    const fieldNames = {
      groupName: '参加団体名',
      representative: '代表者名',
      address: '住所',
      email: 'メールアドレス',
      phone: '電話番号',
      performance: '出演内容',
      performerCount: '出演者数',
      slotCount: '希望出演枠数',
      audioSourceOnly: '音源再生利用',
      rentalAmp: '音源拡声装置レンタル希望数',
      rentalMic: '追加マイク本数',
      vehicleCount: '車両台数',
      vehicleNumbers: '車両ナンバー',
      questions: '連絡事項'
    };

    const changes = [];
    for (const [field, newValue] of Object.entries(newData)) {
      const oldValue = currentData[field];
      
      // 空文字列とnullを正規化して比較
      const normalizeValue = (val) => {
        if (val === null || val === undefined || val === '') return null;
        return val;
      };
      
      const normalizedOld = normalizeValue(oldValue);
      const normalizedNew = normalizeValue(newValue);
      
      if (JSON.stringify(normalizedOld) !== JSON.stringify(normalizedNew)) {
        changes.push({
          entity: 'PerformerApplication',
          entityId: req.params.id,
          field: fieldNames[field] || field,
          oldValue: normalizedOld ? String(normalizedOld) : null,
          newValue: normalizedNew ? String(normalizedNew) : null,
          reason,
          editor,
          performerApplicationId: req.params.id
        });
      }
    }

    // 変更があった場合のみ更新
    if (changes.length > 0) {
      // ChangeLog作成
      await prisma.changeLog.createMany({
        data: changes
      });

      // データ更新
      await prisma.performerApplication.update({
        where: { id: req.params.id },
        data: newData
      });
    }

    res.redirect(`/admin/performers/${req.params.id}`);

  } catch (error) {
    console.error('Performer update error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: '出演申込更新中にエラーが発生しました'
    });
  }
});

// 追記メモ投稿（出演申込）
router.post('/performers/:id/notes', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const { content, adminName } = req.body;
    
    if (!content || !adminName) {
      return res.redirect(`/admin/performers/${req.params.id}?error=メモ内容と記録者名を入力してください`);
    }

    await prisma.applicationNote.create({
      data: {
        content: content.trim(),
        adminName: adminName.trim(),
        performerApplicationId: req.params.id
      }
    });

    res.redirect(`/admin/performers/${req.params.id}`);

  } catch (error) {
    console.error('Performer note creation error:', error);
    res.redirect(`/admin/performers/${req.params.id}?error=メモの保存に失敗しました`);
  }
});

// ボランティア登録完了画面プレビュー
router.get('/preview/volunteer-complete', requireAuth, async (req, res) => {
  // サンプルデータ
  const sampleVolunteer = {
    id: 'sample-id',
    type: 'individual',
    name: '田中花子',
    orgName: null,
    email: 'hanako.tanaka@example.com',
    phone: '090-1234-5678',
    address: '神奈川県横浜市港北区菊名1-2-3',
    skills: '["園芸", "イベント運営"]',
    interests: '["自然保護", "地域交流"]|["草刈り作業", "花壇整備"]',
    notes: 'よろしくお願いします。',
    createdAt: new Date()
  };

  res.render('register-success', {
    title: 'ボランティア登録完了（プレビュー）',
    volunteer: sampleVolunteer,
    isPreview: true
  });
});

// 申込確認画面プレビュー
router.get('/preview/application-confirm', requireAuth, async (req, res) => {
  const { type } = req.query; // 'stall' or 'performer'
  
  if (type === 'stall') {
    const sampleFormData = {
      groupName: 'サンプル出店団体',
      representative: '山田太郎',
      email: 'sample@example.com',
      phone: '090-1234-5678',
      address: '神奈川県横浜市港北区菊名1-2-3',
      boothType: '飲食',
      items: '手作りパン、コーヒー',
      priceRangeMin: '200',
      priceRangeMax: '800',
      boothCount: '2',
      tentWidth: '3.0',
      tentDepth: '3.0',
      tentHeight: '2.5',
      vehicleCount: '1',
      vehicleNumbers: '横浜123あ4567',
      rentalTables: '2',
      rentalChairs: '4',
      questions: 'よろしくお願いします。',
      privacyConsent: 'on',
      marketingConsent: 'on'
    };

    res.render('apply_stall_confirm', {
      title: '出店申込確認（プレビュー）',
      formData: sampleFormData,
      event: {
        title: '🌸桜まつり',
        date: new Date('2025-04-15')
      },
      isPreview: true
    });
  } else if (type === 'performer') {
    const sampleFormData = {
      groupName: 'サンプル出演団体',
      representative: '田中花子',
      email: 'sample@example.com',
      phone: '090-1234-5678',
      address: '神奈川県横浜市港北区菊名1-2-3',
      performance: 'アコースティックギター演奏とボーカル',
      performerCount: '3',
      slotCount: '1',
      vehicleCount: '1',
      vehicleNumbers: '横浜456う7890',
      rentalAmp: '1',
      rentalMic: '2',
      questions: 'よろしくお願いします。',
      privacyConsent: 'on',
      marketingConsent: 'on'
    };

    res.render('apply_performer_confirm', {
      title: '出演申込確認（プレビュー）',
      formData: sampleFormData,
      event: {
        title: '🌸桜まつり',
        date: new Date('2025-04-15')
      },
      isPreview: true
    });
  }
});

// レイアウト確認用プレビューページ
router.get('/preview/application-complete', requireAuth, async (req, res) => {
  const { type } = req.query; // 'stall' or 'performer'
  
  // サンプルデータ
  const sampleStall = {
    id: 'sample-id',
    groupName: 'サンプル出店団体',
    representative: '山田太郎',
    email: 'sample@example.com',
    phone: '090-1234-5678',
    address: '神奈川県横浜市港北区菊名1-2-3',
    boothType: '飲食',
    items: '手作りパン、コーヒー',
    priceRangeMin: 200,
    priceRangeMax: 800,
    boothCount: 2,
    tentWidth: 3.0,
    tentDepth: 3.0,
    tentHeight: 2.5,
    vehicleCount: 1,
    vehicleNumbers: '横浜123あ4567',
    rentalTables: 2,
    rentalChairs: 4,
    questions: 'よろしくお願いします',
    privacyConsent: true,
    marketingConsent: false,
    createdAt: new Date()
  };

  const samplePerformer = {
    id: 'sample-id',
    groupName: 'サンプル演奏団体',
    representative: '佐藤花子',
    email: 'sample@example.com',
    phone: '090-1234-5678',
    address: '神奈川県横浜市港北区菊名1-2-3',
    performance: 'ジャズ演奏\nオリジナル楽曲中心',
    performerCount: 5,
    slotCount: 1,
    rentalAmp: 1,
    rentalMic: 2,
    vehicleCount: 1,
    vehicleNumbers: '横浜456い7890',
    questions: 'マイクの追加をお願いします',
    privacyConsent: true,
    marketingConsent: true,
    createdAt: new Date()
  };

  const sampleEvent = {
    title: 'サンプルイベント',
    date: new Date('2025-10-15'),
    location: '菊名桜山公園'
  };

  res.render('thanks', {
    title: 'レイアウト確認 - 申込完了画面',
    type: type || 'stall',
    application: type === 'performer' ? samplePerformer : sampleStall,
    event: sampleEvent,
    isPreview: true
  });
});

// 削除エンドポイント - 出店申込
router.post('/stalls/:id/delete', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const stallId = req.params.id;

    // 削除対象が存在するか確認
    const stall = await prisma.stallApplication.findUnique({
      where: { id: stallId },
      select: { groupName: true }
    });

    if (!stall) {
      return res.status(404).render('error', {
        title: 'エラー',
        message: '削除対象の出店申込が見つかりません'
      });
    }

    // 関連データと一緒に削除（Cascadeで自動削除される）
    await prisma.stallApplication.delete({
      where: { id: stallId }
    });

    res.redirect('/admin/stalls?message=削除が完了しました');

  } catch (error) {
    console.error('Stall delete error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: '出店申込の削除中にエラーが発生しました'
    });
  }
});

// 削除エンドポイント - 出演申込
router.post('/performers/:id/delete', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const performerId = req.params.id;

    // 削除対象が存在するか確認
    const performer = await prisma.performerApplication.findUnique({
      where: { id: performerId },
      select: { groupName: true }
    });

    if (!performer) {
      return res.status(404).render('error', {
        title: 'エラー',
        message: '削除対象の出演申込が見つかりません'
      });
    }

    // 関連データと一緒に削除（Cascadeで自動削除される）
    await prisma.performerApplication.delete({
      where: { id: performerId }
    });

    res.redirect('/admin/performers?message=削除が完了しました');

  } catch (error) {
    console.error('Performer delete error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: '出演申込の削除中にエラーが発生しました'
    });
  }
});

// 削除エンドポイント - ボランティア
router.post('/volunteers/:id/delete', requireAuth, async (req, res) => {
  try {
    const prisma = req.prisma;
    const volunteerId = req.params.id;

    // 削除対象が存在するか確認
    const volunteer = await prisma.volunteer.findUnique({
      where: { id: volunteerId },
      select: { name: true }
    });

    if (!volunteer) {
      return res.status(404).render('error', {
        title: 'エラー',
        message: '削除対象のボランティアが見つかりません'
      });
    }

    // 関連データと一緒に削除（Cascadeで自動削除される）
    await prisma.volunteer.delete({
      where: { id: volunteerId }
    });

    res.redirect('/admin/volunteers?message=削除が完了しました');

  } catch (error) {
    console.error('Volunteer delete error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: 'ボランティア情報の削除中にエラーが発生しました'
    });
  }
});

export default router;