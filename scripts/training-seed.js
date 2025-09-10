import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 研修用サンプルデータを作成中...');

  // 既存データをクリア
  await prisma.changeLog.deleteMany({});
  await prisma.applicationNote.deleteMany({});
  await prisma.stallApplication.deleteMany({});
  await prisma.performerApplication.deleteMany({});
  await prisma.signup.deleteMany({});
  await prisma.volunteerTag.deleteMany({});
  await prisma.volunteer.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.event.deleteMany({});

  // イベントデータ作成
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
    }),
    prisma.event.create({
      data: {
        title: '菊名桜山公園 夏祭り 2024',
        slug: 'summer-festival-2024',
        date: new Date('2024-07-20T10:00:00Z'),
        applicationStartDate: new Date('2024-06-01T00:00:00Z'),
        location: '菊名桜山公園',
        description: '夏の暑さを吹き飛ばす楽しいイベントです。'
      }
    })
  ]);

  // タグデータ作成
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: '経験豊富', kind: 'skill' } }),
    prisma.tag.create({ data: { name: '初心者歓迎', kind: 'skill' } }),
    prisma.tag.create({ data: { name: 'リーダー経験', kind: 'skill' } }),
    prisma.tag.create({ data: { name: '要フォロー', kind: 'note' } }),
    prisma.tag.create({ data: { name: 'VIP対応', kind: 'note' } })
  ]);

  // ボランティアデータ作成（研修用サンプル）
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
    }),
    prisma.volunteer.create({
      data: {
        type: 'org',
        name: '菊名商店街振興会',
        orgName: '菊名商店街振興会',
        email: 'info@kikuna-shopping.jp',
        phone: '045-123-4567',
        address: '横浜市港北区菊名3-3-3',
        skills: JSON.stringify(['イベント企画', '地域連携', '資金調達']),
        interests: JSON.stringify(['地域活性化', 'コミュニティ作り']),
        notes: '地域の商店街として継続的に協力いただいている団体。'
      }
    }),
    prisma.volunteer.create({
      data: {
        type: 'individual',
        name: '鈴木一郎',
        email: 'suzuki@example.com',
        phone: '070-5555-1234',
        address: '横浜市港北区綱島4-4-4',
        skills: JSON.stringify(['写真撮影', 'SNS運用']),
        interests: JSON.stringify(['写真', 'PR活動']),
        notes: '今回初参加。写真撮影とSNS発信を担当希望。'
      }
    }),
    prisma.volunteer.create({
      data: {
        type: 'individual',
        name: '高橋美咲',
        email: 'takahashi@example.com',
        phone: '090-7777-8888',
        address: '横浜市港北区日吉5-5-5',
        skills: JSON.stringify(['子ども対応', '安全管理']),
        interests: JSON.stringify(['子育て支援', '安全対策']),
        notes: '保育士資格保有。子ども向けイベントの安全管理を希望。'
      }
    })
  ]);

  // サインアップデータ作成
  const signups = await Promise.all([
    prisma.signup.create({
      data: {
        volunteerId: volunteers[0].id,
        eventId: events[0].id,
        role: '運営',
        detailsJson: JSON.stringify({
          experience: '3年',
          preferredTasks: ['会場設営', '音響担当'],
          availableTime: '全日'
        }),
        availability: '全日参加可能',
        freq: 'monthly',
        status: 'accepted',
        memo: 'リーダー経験があり、頼りになる方です。'
      }
    }),
    prisma.signup.create({
      data: {
        volunteerId: volunteers[1].id,
        eventId: events[0].id,
        role: '出店',
        detailsJson: JSON.stringify({
          experience: '初回',
          preferredTasks: ['食事ブース', '接客'],
          availableTime: '午前のみ'
        }),
        availability: '10:00-14:00',
        freq: 'ad-hoc',
        status: 'applied',
        memo: '料理が得意な方。初回参加。'
      }
    })
  ]);

  // 出店者申込データ作成
  const stallApplications = await Promise.all([
    prisma.stallApplication.create({
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
    }),
    prisma.stallApplication.create({
      data: {
        groupName: '手作りアクセサリー「きらきら工房」',
        representative: '佐々木恵子',
        address: '横浜市港北区大倉山2-15-8',
        email: 'kirakira@example.com',
        phone: '080-3333-4444',
        boothType: '物販',
        items: '手作りアクセサリー、ハンドメイド雑貨',
        priceRangeMin: 300,
        priceRangeMax: 2000,
        boothCount: 1,
        tentWidth: 2.0,
        tentDepth: 2.0,
        tentHeight: 2.0,
        vehicleCount: 1,
        vehicleType: '搬入・搬出車',
        vehicleNumbers: '横浜300す5678',
        rentalTables: 1,
        rentalChairs: 2,
        questions: '雨天時の対策について相談させてください。',
        eventId: events[0].id,
        privacyConsent: true,
        marketingConsent: false,
        originalPayload: JSON.stringify({
          submitted_at: '2024-03-15T14:20:00Z',
          ip_address: '192.168.1.101'
        }),
        originalSubmittedAt: new Date('2024-03-15T14:20:00Z')
      }
    })
  ]);

  // 出演者申込データ作成
  const performerApplications = await Promise.all([
    prisma.performerApplication.create({
      data: {
        groupName: '菊名太鼓保存会',
        representative: '中村次郎',
        address: '横浜市港北区菊名2-20-10',
        email: 'kikuna-taiko@example.com',
        phone: '045-555-6666',
        performance: '和太鼓演奏（約15分）',
        performerCount: 8,
        slotCount: 1,
        vehicleCount: 2,
        vehicleNumbers: '横浜100ち1111, 横浜200ち2222',
        audioSourceOnly: 0,
        rentalAmp: 1,
        rentalMic: 2,
        questions: '太鼓の搬入に時間がかかるため、早めの会場入りをお願いします。',
        eventId: events[0].id,
        privacyConsent: true,
        marketingConsent: true,
        originalPayload: JSON.stringify({
          submitted_at: '2024-03-05T16:45:00Z',
          ip_address: '192.168.1.102'
        }),
        originalSubmittedAt: new Date('2024-03-05T16:45:00Z')
      }
    }),
    prisma.performerApplication.create({
      data: {
        groupName: 'ダンスチーム「KIKUNA STARS」',
        representative: '林美穂',
        address: '横浜市港北区綱島3-8-12',
        email: 'kikuna-stars@example.com',
        phone: '090-9999-0000',
        performance: 'キッズダンス（約10分）',
        performerCount: 12,
        slotCount: 2,
        vehicleCount: 1,
        vehicleNumbers: '横浜800と3333',
        audioSourceOnly: 2,
        rentalAmp: 0,
        rentalMic: 1,
        questions: '子どもたちの出演なので、安全面の配慮をお願いします。',
        eventId: events[0].id,
        privacyConsent: true,
        marketingConsent: true,
        originalPayload: JSON.stringify({
          submitted_at: '2024-03-12T11:15:00Z',
          ip_address: '192.168.1.103'
        }),
        originalSubmittedAt: new Date('2024-03-12T11:15:00Z')
      }
    })
  ]);

  // 管理者ノート作成
  await Promise.all([
    prisma.applicationNote.create({
      data: {
        content: '電話確認済み。キッチンカーの駐車場所を第1駐車場に確保。電源延長コードの準備も完了。',
        adminName: '事務局・田村',
        stallApplicationId: stallApplications[0].id
      }
    }),
    prisma.applicationNote.create({
      data: {
        content: '雨天対応について相談。テント下にビニールシート敷設で対応予定。了承いただきました。',
        adminName: '事務局・佐藤',
        stallApplicationId: stallApplications[1].id
      }
    }),
    prisma.applicationNote.create({
      data: {
        content: '太鼓搬入のため8:30から会場開放。駐車場も確保済み。音響チェックは9:30から実施予定。',
        adminName: '事務局・田村',
        performerApplicationId: performerApplications[0].id
      }
    })
  ]);

  // 変更履歴作成（サンプル）
  await Promise.all([
    prisma.changeLog.create({
      data: {
        entity: 'StallApplication',
        entityId: stallApplications[0].id,
        field: 'rentalTables',
        oldValue: '1',
        newValue: '2',
        reason: '追加のテーブルが必要になったため',
        editor: '事務局・田村',
        stallApplicationId: stallApplications[0].id
      }
    }),
    prisma.changeLog.create({
      data: {
        entity: 'Volunteer',
        entityId: volunteers[0].id,
        field: 'phone',
        oldValue: '090-1234-5679',
        newValue: '090-1234-5678',
        reason: '電話番号の訂正',
        editor: '事務局・佐藤',
        volunteerId: volunteers[0].id
      }
    })
  ]);

  console.log('✅ 研修用サンプルデータの作成完了！');
  console.log('');
  console.log('📊 作成されたデータ:');
  console.log(`- イベント: ${events.length}件`);
  console.log(`- ボランティア: ${volunteers.length}件`);
  console.log(`- サインアップ: ${signups.length}件`);
  console.log(`- 出店申込: ${stallApplications.length}件`);
  console.log(`- 出演申込: ${performerApplications.length}件`);
  console.log('');
  console.log('🔐 研修用ログイン情報:');
  console.log('パスワード: training2024');
  console.log('URL: http://localhost:3000/admin');
  console.log('');
  console.log('🚀 研修環境起動コマンド:');
  console.log('npm run training');
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });