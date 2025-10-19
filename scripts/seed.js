import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 シードデータの作成を開始します...');

  try {
    // 既存のイベントを削除（開発環境のみ）
    await prisma.signup.deleteMany({});
    await prisma.event.deleteMany({});
    console.log('既存のイベントデータを削除しました');

    // 初期イベントを作成
    const events = [
      {
        title: '🌸桜まつり',
        slug: 'sakura-matsuri',
        date: new Date('2025-04-07T10:00:00'),
        applicationStartDate: new Date('2025-02-01T00:00:00'), // 2月1日から申込開始
        location: '菊名桜山公園 メインステージ',
        description: '春の桜を愛でながら、地域の皆様と一緒に楽しむお祭りです。出店、演奏会、保全活動など様々な形でご参加いただけます。'
      },
      {
        title: '♬ Forest Jazz',
        slug: 'forest-jazz',
        date: new Date('2025-07-20T18:00:00'),
        applicationStartDate: new Date('2025-05-01T00:00:00'), // 5月1日から申込開始
        location: '菊名桜山公園 野外ステージ',
        description: '夏の夕涼みとともに、緑に囲まれた公園でジャズを楽しむイベントです。ミュージシャンの演奏サポートや会場運営にご協力ください。'
      },
      {
        title: '🍁感謝祭',
        slug: 'thanksgiving-festival',
        date: new Date('2025-10-26T13:00:00'),
        applicationStartDate: new Date('2025-08-01T00:00:00'), // テスト用: 8月1日から申込開始
        location: '菊名桜山公園 全域',
        description: '一年間の活動を振り返り、地域の皆様への感謝を込めたお祭りです。収穫体験、展示、出店など多彩なプログラムをご用意しています。'
      },
      {
  title: '🎄Forest Christmas',
  slug: 'forest-christmas',
  date: new Date('2025-12-14'),
  isPublic: true,
  status: 'OPEN',
  description: `冬の森を彩るあかりとともに、ステージやクラフト、フード出店などが並ぶひととき。
あなたの力を生かして、一緒に「Forest Christmas」を盛り上げませんか？`,
  // ...他のフィールド
}ption: 'イルミネーション点灯式とクリスマスコンサート。温かい飲み物の提供やイルミネーション設営のお手伝いをお願いします。'
      }
    ];

    for (const eventData of events) {
      const event = await prisma.event.create({
        data: eventData
      });
      console.log(`✅ イベント「${event.title}」を作成しました`);
    }

    console.log('🎉 シードデータの作成が完了しました！');
    
    // 作成されたイベントの一覧を表示
    const createdEvents = await prisma.event.findMany({
      orderBy: { date: 'asc' }
    });
    
    console.log('\n📅 作成されたイベント:');
    createdEvents.forEach(event => {
      console.log(`  - ${event.title} (${event.date.toLocaleDateString('ja-JP')})`);
    });

  } catch (error) {
    console.error('❌ シードデータの作成中にエラーが発生しました:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });