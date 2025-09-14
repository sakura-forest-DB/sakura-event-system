#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createEvents() {
  try {
    console.log('🎯 イベントデータ作成開始...');
    
    // 感謝祭イベントを作成
    const event = await prisma.event.create({
      data: {
        id: 'event-autumn-2025',
        title: '🍁感謝祭',
        slug: 'autumn-festival-2025',
        date: new Date('2025-10-26T10:00:00+09:00'), // 2025年10月26日
        applicationStartDate: new Date('2025-01-15T00:00:00+09:00'), // 申込開始日（過去に設定）
        location: '菊名桜山公園',
        description: 'カーボン山感謝祭 - 地域の皆様への感謝を込めたイベントです。出店・出演者を募集しています。'
      }
    });

    console.log('✅ イベント作成成功:', event.title);
    console.log('📅 開催日:', event.date.toLocaleDateString('ja-JP'));
    
    // 確認のため作成されたイベントを表示
    const allEvents = await prisma.event.findMany({
      orderBy: { date: 'asc' }
    });
    
    console.log('📋 作成されたイベント一覧:');
    allEvents.forEach(evt => {
      console.log(`- ${evt.title} (${evt.date.toLocaleDateString('ja-JP')})`);
    });
    
    console.log('✅ イベントデータ作成完了');
  } catch (error) {
    console.error('❌ イベント作成エラー:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createEvents();