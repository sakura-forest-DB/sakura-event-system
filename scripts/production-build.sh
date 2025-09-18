#!/bin/bash
set -e

echo "🚀 Production Build Started..."

# Prisma Client 生成
echo "📦 Generating Prisma Client..."
npx prisma generate

# データベーススキーマを同期（既存データを保持しつつスキーマ更新）
echo "🗄️  Syncing database schema (safe mode)..."
npx prisma db push

# イベントデータ作成（既存データがない場合のみ）
echo "🎯 Creating event data if needed..."
node scripts/create-events.js

echo "✅ Production Build Completed Successfully!"