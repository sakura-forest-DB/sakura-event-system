#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('🔧 データベースセットアップ開始...');
    
    // データベース接続テスト
    await prisma.$connect();
    console.log('✅ データベース接続成功');
    
    // 基本的なクエリテスト
    const eventCount = await prisma.event.count();
    console.log(`📋 現在のイベント数: ${eventCount}`);
    
    console.log('✅ データベースセットアップ完了');
  } catch (error) {
    console.error('❌ データベースセットアップエラー:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();