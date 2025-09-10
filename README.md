# 🌸 菊名桜山公園 イベント管理システム

菊名桜山公園のボランティア募集・出店/出演者申込・名簿管理を行うWebアプリケーションです。

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

## 🚀 デプロイ済みURL
- **研修環境**: https://kikuna-event-system.onrender.com
- **管理画面**: https://kikuna-event-system.onrender.com/admin

## 🌟 機能概要

### 公開機能
- **ホームページ**: 最近の登録者と募集中イベントの表示
- **ボランティア登録** (`/register`): 個人・団体登録フォーム
- **イベント申込** (`/apply`): イベントごとの役割別申込フォーム

### 管理機能 (`/admin`)
- **名簿管理**: ボランティアの検索・絞り込み・一覧表示
- **CSVエクスポート**: 名簿データのCSV形式ダウンロード  
- **イベント管理**: イベントの作成・編集・一覧表示
- **認証**: 管理者パスワードによる保護

## 🚀 クイックスタート

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、必要に応じて値を変更してください:

```bash
cp .env.example .env
```

### 3. データベースの初期化

```bash
npx prisma generate
npx prisma db push
```

### 4. 初期データの投入

```bash
npm run seed
```

### 5. アプリケーションの起動

```bash
# 開発モード（ホットリロード）
npm run dev

# 本番モード
npm start
```

アプリケーションは http://localhost:3000 で利用できます。

## 📋 データモデル

### Volunteer（ボランティア）
- 個人/団体情報、連絡先、スキル、興味のある活動

### Event（イベント）
- タイトル、日時、場所、説明

### Signup（申込）
- ボランティアとイベントの紐付け、役割、詳細情報、参加頻度、ステータス

### Tag（タグ）・VolunteerTag
- ボランティアのカテゴリ分け（オプション）

## 🎭 イベントと役割

### 年間イベント
- **桜まつり** (4月): 春の桜を楽しむ地域イベント
- **Forest Jazz** (7月): 夏の夕涼みジャズイベント  
- **感謝祭** (10月): 一年間の活動を振り返る感謝イベント
- **Forest Christmas** (12月): イルミネーションとクリスマスコンサート

### 参加役割
- **保全**: 草刈り、花壇整備、清掃
- **出演**: ダンス、音楽、その他パフォーマンス
- **運営**: 厨房、ホール、PA、大道具
- **出店**: 地域特産品や手作り品の販売

## 🔧 技術スタック

- **Backend**: Node.js + Express
- **Database**: SQLite + Prisma ORM  
- **Frontend**: EJS テンプレート + Bootstrap 5
- **Session**: express-session
- **Authentication**: 単純パスワード認証（管理者のみ）

## 🛠️ 開発コマンド

```bash
# 開発サーバー起動（ホットリロード）
npm run dev

# 本番サーバー起動
npm start

# 初期データ投入
npm run seed

# テスト実行
npm test

# データベース操作
npx prisma studio      # 管理画面
npx prisma db push     # スキーマ反映
npx prisma generate    # クライアント生成
```

## 🔐 管理者機能

管理者機能にアクセスするには:

1. http://localhost:3000/admin にアクセス
2. 環境変数 `ADMIN_PASSWORD` で設定したパスワードでログイン（デフォルト: admin123）

### 管理機能
- `/admin/volunteers`: ボランティア名簿の閲覧・検索・CSVエクスポート
- `/admin/events`: イベントの作成・編集・一覧

## 📊 CSVエクスポート

管理者はボランティア情報をCSV形式でダウンロードできます:

- 基本情報: ID、氏名、連絡先、登録日など
- スキル・興味: カンマ区切りで出力
- 申込状況: 申込件数を表示

## 🧪 テスト

```bash
npm test
```

テストはNode.jsの標準 `assert` モジュールを使用し、以下をテストします:
- データベース接続
- モデルの作成・取得
- リレーション機能

## 🔄 バックアップとメンテナンス

### データベースバックアップ

```bash
# SQLiteファイルをコピー
cp dev.db backup-$(date +%Y%m%d).db
```

### ログとデバッグ
- アプリケーションは標準出力にログを出力
- エラーはコンソールに表示
- 本番環境では適切なログ管理システムの導入を推奨

## 🚀 デプロイ

### 必要な環境変数
```bash
DATABASE_URL="file:./prod.db"  # 本番用DB
ADMIN_PASSWORD="secure-password"  # 強固なパスワード
SESSION_SECRET="random-secret-key"  # セキュアなシークレット
NODE_ENV=production
PORT=3000
```

### デプロイ手順
1. 依存関係インストール: `npm install --production`
2. データベース初期化: `npx prisma db push`
3. 初期データ投入: `npm run seed`
4. アプリケーション起動: `npm start`

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 コントリビューション

バグ報告や機能要望は、GitHubのIssueにてお願いします。