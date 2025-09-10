import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Render環境のセットアップを開始...');
  
  // 環境変数の確認
  console.log('📊 環境変数確認:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ 設定済み' : '❌ 未設定');
  console.log('- ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? '✅ 設定済み' : '❌ 未設定');

  // データベース接続テスト
  try {
    await prisma.$connect();
    console.log('✅ データベース接続成功');
  } catch (error) {
    console.error('❌ データベース接続失敗:', error);
    process.exit(1);
  }

  // マイグレーション実行
  console.log('🔄 データベーススキーマの確認...');
  
  // 研修データ投入の判定
  const adminPassword = process.env.ADMIN_PASSWORD;
  const isTrainingMode = adminPassword === 'training2024';
  
  if (isTrainingMode) {
    console.log('📚 研修モード - サンプルデータを投入します');
    await setupTrainingData();
  } else {
    console.log('🏢 本番モード - 基本データのみ投入します');
    await setupProductionData();
  }

  console.log('✅ Render環境のセットアップ完了！');
}

async function setupTrainingData() {
  // 既存データをクリア
  await clearAllData();
  
  // 研修用サンプルデータを投入（training-seed.jsの内容を簡略化）
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: '菊名桜山公園 春祭り 2024',
        slug: 'spring-festival-2024',
        date: new Date('2024-04-15T10:00:00Z'),
        applicationStartDate: new Date('2024-03-01T00:00:00Z'),
        location: '菊名桜山公園',
        description: '毎年恒例の春祭りです。地域の皆さんと一緒に楽しいイベントを開催します。'
      }
    })
  ]);

  const volunteers = await Promise.all([
    prisma.volunteer.create({
      data: {
        type: 'individual',
        name: '田中太郎',
        email: 'tanaka@example.com',
        phone: '090-1234-5678',
        address: '横浜市港北区菊名1-1-1',
        skills: JSON.stringify(['イベント運営', '音響設備']),
        interests: JSON.stringify(['地域貢献', 'イベント企画']),
        notes: '過去3回参加の経験者。リーダー役も可能。'
      }
    }),
    prisma.volunteer.create({
      data: {
        type: 'individual',
        name: '佐藤花子',
        email: 'sato@example.com',
        phone: '080-9876-5432',
        address: '横浜市港北区大倉山2-2-2',
        skills: JSON.stringify(['料理', '接客']),
        interests: JSON.stringify(['料理', '地域交流']),
        notes: '料理が得意で、食事ブースのお手伝いを希望。'
      }
    })
  ]);

  await prisma.stallApplication.create({
    data: {
      groupName: 'たこやき屋「たこ太郎」',
      representative: '山田太郎',
      address: '横浜市港北区菊名1-10-5',
      email: 'tako-taro@example.com',
      phone: '045-111-2222',
      boothType: '飲食',
      items: 'たこやき、焼きそば、かき氷',
      priceRangeMin: 200,
      priceRangeMax: 600,
      boothCount: 1,
      tentWidth: 3.0,
      tentDepth: 3.0,
      tentHeight: 2.5,
      vehicleCount: 1,
      vehicleType: 'キッチンカー',
      vehicleNumbers: '横浜500あ1234',
      rentalTables: 2,
      rentalChairs: 4,
      questions: '電源が必要です。キッチンカーの駐車スペースの確保をお願いします。',
      eventId: events[0].id,
      privacyConsent: true,
      marketingConsent: true,
      originalPayload: JSON.stringify({
        submitted_at: '2024-03-10T09:30:00Z',
        ip_address: '192.168.1.100'
      }),
      originalSubmittedAt: new Date('2024-03-10T09:30:00Z')
    }
  });

  console.log('📊 研修用サンプルデータ投入完了');
}

async function setupProductionData() {
  // 本番用の基本設定のみ
  console.log('🏢 本番環境の基本設定を投入');
  
  // 基本的なイベントテンプレートのみ作成
  await prisma.event.upsert({
    where: { slug: 'sample-event' },
    update: {},
    create: {
      title: 'サンプルイベント',
      slug: 'sample-event',
      date: new Date('2024-12-31T10:00:00Z'),
      location: 'サンプル会場',
      description: 'これはサンプルイベントです。実際のイベント情報に置き換えてください。'
    }
  });
}

async function clearAllData() {
  await prisma.changeLog.deleteMany({});
  await prisma.applicationNote.deleteMany({});
  await prisma.stallApplication.deleteMany({});
  await prisma.performerApplication.deleteMany({});
  await prisma.signup.deleteMany({});
  await prisma.volunteerTag.deleteMany({});
  await prisma.volunteer.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.event.deleteMany({});
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });