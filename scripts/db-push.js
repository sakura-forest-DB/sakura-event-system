#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function pushDatabase() {
  try {
    console.log('🔧 データベーススキーマをプッシュ中...');
    
    const { stdout, stderr } = await execAsync('npx prisma db push --force-reset');
    
    console.log('✅ Prisma db push 成功:');
    console.log(stdout);
    
    if (stderr) {
      console.log('警告:', stderr);
    }
    
    console.log('✅ データベース初期化完了');
  } catch (error) {
    console.error('❌ データベース初期化エラー:', error.message);
    if (error.stdout) console.log('標準出力:', error.stdout);
    if (error.stderr) console.log('標準エラー:', error.stderr);
    process.exit(1);
  }
}

pushDatabase();