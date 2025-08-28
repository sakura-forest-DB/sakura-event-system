import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 テストを開始します...\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Database connection
  try {
    await prisma.$connect();
    console.log('✅ Test 1: データベース接続成功');
    passed++;
  } catch (error) {
    console.log('❌ Test 1: データベース接続失敗', error.message);
    failed++;
  }

  // Test 2: Event creation and retrieval
  try {
    const eventsBefore = await prisma.event.count();
    
    const testEvent = await prisma.event.create({
      data: {
        title: 'テストイベント',
        slug: 'test-event-' + Date.now(),
        date: new Date(),
        location: 'テスト会場',
        description: 'これはテスト用のイベントです'
      }
    });
    
    const eventsAfter = await prisma.event.count();
    assert(eventsAfter === eventsBefore + 1, 'イベント数が増加していない');
    assert(testEvent.title === 'テストイベント', 'イベント名が正しくない');
    
    // Clean up
    await prisma.event.delete({ where: { id: testEvent.id } });
    
    console.log('✅ Test 2: イベントの作成・取得成功');
    passed++;
  } catch (error) {
    console.log('❌ Test 2: イベントの作成・取得失敗', error.message);
    failed++;
  }

  // Test 3: Volunteer creation
  try {
    const volunteersBefore = await prisma.volunteer.count();
    
    const testVolunteer = await prisma.volunteer.create({
      data: {
        type: 'individual',
        name: 'テスト太郎',
        email: 'test-' + Date.now() + '@example.com',
        phone: '090-1234-5678',
        skills: JSON.stringify(['テスト']),
        interests: JSON.stringify(['テスト活動'])
      }
    });
    
    const volunteersAfter = await prisma.volunteer.count();
    assert(volunteersAfter === volunteersBefore + 1, 'ボランティア数が増加していない');
    assert(testVolunteer.name === 'テスト太郎', 'ボランティア名が正しくない');
    
    // Clean up
    await prisma.volunteer.delete({ where: { id: testVolunteer.id } });
    
    console.log('✅ Test 3: ボランティア作成成功');
    passed++;
  } catch (error) {
    console.log('❌ Test 3: ボランティア作成失敗', error.message);
    failed++;
  }

  // Test 4: Signup creation
  try {
    // Create test data
    const testEvent = await prisma.event.create({
      data: {
        title: 'テストイベント2',
        slug: 'test-event-2-' + Date.now(),
        date: new Date(),
        location: 'テスト会場2',
        description: 'これもテスト用のイベントです'
      }
    });

    const testVolunteer = await prisma.volunteer.create({
      data: {
        type: 'individual',
        name: 'テスト花子',
        email: 'test-hanako-' + Date.now() + '@example.com',
        skills: JSON.stringify([]),
        interests: JSON.stringify([])
      }
    });

    const testSignup = await prisma.signup.create({
      data: {
        volunteerId: testVolunteer.id,
        eventId: testEvent.id,
        role: '保全',
        detailsJson: JSON.stringify({ tasks: ['草刈り'] }),
        freq: 'monthly'
      }
    });

    const signupWithRelations = await prisma.signup.findUnique({
      where: { id: testSignup.id },
      include: {
        volunteer: true,
        event: true
      }
    });

    assert(signupWithRelations.volunteer.name === 'テスト花子', 'ボランティア名が正しくない');
    assert(signupWithRelations.event.title === 'テストイベント2', 'イベント名が正しくない');
    assert(signupWithRelations.role === '保全', '役割が正しくない');

    // Clean up
    await prisma.signup.delete({ where: { id: testSignup.id } });
    await prisma.volunteer.delete({ where: { id: testVolunteer.id } });
    await prisma.event.delete({ where: { id: testEvent.id } });

    console.log('✅ Test 4: 申込作成・リレーション成功');
    passed++;
  } catch (error) {
    console.log('❌ Test 4: 申込作成・リレーション失敗', error.message);
    failed++;
  }

  // Results
  console.log(`\n📊 テスト結果:`);
  console.log(`  ✅ 成功: ${passed}`);
  console.log(`  ❌ 失敗: ${failed}`);
  console.log(`  📈 成功率: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed > 0) {
    console.log('\n⚠️  一部のテストが失敗しました。');
    process.exit(1);
  } else {
    console.log('\n🎉 全てのテストが成功しました！');
  }
}

runTests()
  .catch((e) => {
    console.error('テスト実行中にエラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });