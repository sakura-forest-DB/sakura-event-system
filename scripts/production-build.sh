#!/bin/bash
set -e

echo "🚀 Production Build Started..."

# Prisma Client 生成
echo "📦 Generating Prisma Client..."
npx prisma generate

# マイグレーション適用（安全版 - データを保持）
echo "🗄️  Applying database migrations (safe mode)..."
npx prisma migrate deploy

# イベントデータ作成（既存データがない場合のみ）
echo "🎯 Creating event data if needed..."
node scripts/create-events.js

echo "✅ Production Build Completed Successfully!"