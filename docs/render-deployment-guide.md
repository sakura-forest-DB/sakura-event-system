# 🚀 Render デプロイメントガイド

## 📋 段階的デプロイ計画

### Phase 1: 研修環境（1週間）
- **URL**: `https://kikuna-event-system.onrender.com`
- **パスワード**: `training2024`
- **データ**: 研修用サンプルデータ

### Phase 2: 本番切り替え
- **URL**: 同じURL
- **パスワード**: `Kikuna2025$Sakura#Admin`
- **データ**: 本番データに切り替え

---

## 🚀 Phase 1: 研修環境デプロイ

### 1. Renderアカウント準備
1. [Render](https://render.com)でアカウント作成
2. GitHubアカウントとの連携

### 2. GitHubリポジトリ準備
```bash
# Gitリポジトリの初期化（まだの場合）
git init
git add .
git commit -m "Initial commit for Render deployment"

# GitHubリポジトリ作成後
git remote add origin https://github.com/YOUR-USERNAME/sakura-prj.git
git push -u origin main
```

### 3. Renderでのサービス作成
1. Render ダッシュボードで「New +」をクリック
2. 「Web Service」を選択
3. GitHubリポジトリを選択
4. 設定項目:
   - **Name**: `kikuna-event-system`
   - **Environment**: `Node`
   - **Plan**: `Free`
   - **Build Command**: `npm install && npm run db:generate && npx prisma db push && npm run setup:render`
   - **Start Command**: `npm start`

### 4. 環境変数設定
Renderの環境変数設定で以下を設定:
```
NODE_ENV=production
ADMIN_PASSWORD=training2024
SESSION_SECRET=[自動生成]
DATABASE_URL=[PostgreSQL接続文字列]
```

### 5. PostgreSQLデータベース設定
1. Render ダッシュボードで「New +」をクリック
2. 「PostgreSQL」を選択
3. 無料プランを選択
4. Web ServiceからDATABASE_URLで参照

---

## 🔄 Phase 2: 本番切り替え手順

### 研修完了後の本番移行（1週間後）

#### 1. 環境変数の更新
Render ダッシュボードで以下を変更:
```
ADMIN_PASSWORD=Kikuna2025$Sakura#Admin
```

#### 2. データの切り替え
```bash
# オプション A: データをクリアして本番運用開始
# 研修データを削除し、空の状態から開始

# オプション B: 本番データを投入
# 事前に準備した本番用データを投入
```

#### 3. 動作確認
- [ ] ログインテスト（新しいパスワード）
- [ ] 基本機能の動作確認
- [ ] セキュリティ設定の確認

#### 4. 一般公開開始
- [ ] URLの案内
- [ ] 申込受付開始のアナウンス

---

## ⚙️ Render設定の詳細

### 自動デプロイ設定
- **ブランチ**: `main`
- **自動デプロイ**: 有効（コード変更時に自動更新）

### ヘルスチェック
- **エンドポイント**: `/`
- **タイムアウト**: 30秒

### 環境固有の設定
```yaml
# render.yaml（研修期間中）
envVars:
  - key: ADMIN_PASSWORD
    value: training2024

# 本番切り替え時にRenderダッシュボードで変更
ADMIN_PASSWORD: Kikuna2025$Sakura#Admin
```

---

## 🔧 トラブルシューティング

### デプロイが失敗する場合
1. **ビルドログの確認**: Renderダッシュボードでログを確認
2. **依存関係**: `package.json`の整合性確認
3. **環境変数**: 必要な環境変数が設定されているか確認

### データベース接続エラー
1. **DATABASE_URL**: 正しく設定されているか確認
2. **Prisma設定**: `schema.prisma`の`datasource`設定確認
3. **マイグレーション**: ビルド時に正常実行されているか確認

### アプリケーションが起動しない
1. **ログ確認**: Renderのログでエラー内容を確認
2. **ポート設定**: `PORT`環境変数の確認
3. **起動コマンド**: `npm start`が正しく動作するか確認

---

## 💰 コスト管理

### 無料プランの制限
- **Web Service**: 1つまで無料
- **PostgreSQL**: $7/月（30日間の無料試用）
- **帯域幅**: 100GB/月
- **スリープ**: 15分間非アクティブで自動停止

### 制限への対応
- **スリープ対策**: 定期的なアクセスで起動状態を維持
- **データベース**: 研修完了後に有料プランへ移行検討
- **帯域幅**: 通常の使用量では問題なし

---

## 📅 スケジュール

### Week 1: 研修期間
- **Day 1-2**: デプロイ作業
- **Day 3-7**: スタッフ研修実施
- **研修内容**: 操作マニュアルに基づく実習

### Week 2: 本番切り替え
- **研修完了確認**: スタッフの習熟度確認
- **本番切り替え**: 環境変数・データの更新
- **一般公開**: 申込受付開始

---

## 🔐 セキュリティチェックリスト

### 研修環境
- [ ] 研修用パスワードの設定
- [ ] HTTPS接続の確認
- [ ] セッション設定の確認

### 本番環境
- [ ] 強固なパスワードへの変更
- [ ] セキュリティヘッダーの有効化
- [ ] レート制限の動作確認
- [ ] バックアップ設定の確認

---

*デプロイ作業で不明な点があれば、Renderのドキュメントも併せて確認してください。*