import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestData() {
  try {
    // イベント取得
    const events = await prisma.event.findMany();
    const event = events[0];

    if (!event) {
      console.log('イベントが見つかりません');
      return;
    }

    // テスト出店申込
    const stallApp = await prisma.stallApplication.create({
      data: {
        groupName: 'テスト出店団体',
        representative: '山田太郎',
        address: '横浜市港北区菊名1-1-1',
        email: 'test@example.com',
        phone: '090-1234-5678',
        eventId: event.id,
        boothType: '飲食',
        items: 'たこ焼き、焼きそば',
        priceRangeMin: 300,
        priceRangeMax: 500,
        boothCount: 2,
        tentWidth: 3.0,
        tentDepth: 3.0,
        tentHeight: 2.5,
        vehicleCount: 1,
        vehicleNumbers: '横浜123あ4567',
        rentalTables: 2,
        rentalChairs: 4,
        questions: 'テスト申込です'
      }
    });

    // テスト出演申込
    const performerApp = await prisma.performerApplication.create({
      data: {
        groupName: 'テスト出演団体',
        representative: '佐藤花子',
        address: '横浜市港北区菊名2-2-2',
        email: 'performer@example.com',
        phone: '090-8765-4321',
        eventId: event.id,
        performance: '合唱とダンス',
        performerCount: 10,
        slotCount: 1,
        vehicleCount: 1,
        vehicleNumbers: '横浜456か7890',
        rentalAmp: 1,
        rentalMic: 2,
        questions: 'テスト出演申込です'
      }
    });

    console.log('✅ テストデータを作成しました:');
    console.log('  出店申込:', stallApp.id);
    console.log('  出演申込:', performerApp.id);

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();