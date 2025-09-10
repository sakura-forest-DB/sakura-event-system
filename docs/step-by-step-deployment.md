# 📚 超初心者向け デプロイ手順書

このガイドでは、技術的な知識がない方でもWebアプリケーションをインターネットに公開できるよう、一歩ずつ丁寧に説明します。

## 🎯 最終目標
- 研修用のWebサイトをインターネット上に公開
- スタッフが外部からアクセスして研修可能にする
- 1週間後に本番環境に切り替える

---

## 📋 準備するもの
- [ ] メールアドレス（GitHubとRender用）
- [ ] インターネット接続
- [ ] このプロジェクトのファイル

---

## Step 1: GitHubアカウント作成 ⏱️ 5分

### 1-1. GitHubにアクセス
1. ブラウザで https://github.com を開く
2. 右上の「Sign up」をクリック

### 1-2. アカウント情報入力
1. **Username**: 覚えやすい名前（例：kikuna-admin）
2. **Email**: 連絡可能なメールアドレス
3. **Password**: 強固なパスワード
4. 「Create account」をクリック

### 1-3. メール認証
1. 受信メールのリンクをクリック
2. 画面の指示に従って認証完了

✅ **完了チェック**: GitHubにログインできる状態

---

## Step 2: リポジトリ作成 ⏱️ 3分

### 2-1. 新しいリポジトリ作成
1. GitHubにログイン
2. 右上の「+」マーク → 「New repository」
3. 以下を入力：
   - **Repository name**: `sakura-event-system`
   - **Description**: `菊名桜山公園イベント管理システム`
   - **Public** を選択（無料プランのため）
   - **Add a README file** は**チェックしない**

4. 「Create repository」をクリック

✅ **完了チェック**: 空のリポジトリが作成される

---

## Step 3: コードのアップロード ⏱️ 5分

### 3-1. Git設定（初回のみ）
ターミナル（コマンドプロンプト）で以下を実行：

```bash
# 名前とメールアドレスを設定
git config --global user.name "あなたの名前"
git config --global user.email "あなたのメールアドレス"
```

### 3-2. プロジェクトフォルダでGit初期化
```bash
# プロジェクトフォルダに移動
cd /Users/morohope/sakura-prj

# Git初期化
git init

# すべてのファイルを追加
git add .

# コミット作成
git commit -m "Initial commit: 菊名桜山公園イベント管理システム"
```

### 3-3. GitHubにアップロード
```bash
# GitHubリポジトリと連携（URLは作成したリポジトリのもの）
git remote add origin https://github.com/あなたのユーザー名/sakura-event-system.git

# アップロード実行
git branch -M main
git push -u origin main
```

⚠️ **注意**: ユーザー名とパスワードを求められた場合は、GitHubのログイン情報を入力

✅ **完了チェック**: GitHubページでファイルが表示される

---

## Step 4: Renderアカウント作成 ⏱️ 5分

### 4-1. Renderにアクセス
1. ブラウザで https://render.com を開く
2. 右上の「Get Started」をクリック

### 4-2. GitHubでログイン
1. 「Continue with GitHub」を選択
2. GitHubのログイン情報を入力
3. 権限の許可を求められたら「Authorize」をクリック

### 4-3. アカウント設定
1. プロフィール情報を入力（任意）
2. 無料プランを選択

✅ **完了チェック**: Renderダッシュボードが表示される

---

## Step 5: Webサービス作成 ⏱️ 10分

### 5-1. 新しいWebサービス作成
1. Renderダッシュボードで「New +」をクリック
2. 「Web Service」を選択
3. 「Connect to GitHub」で先ほど作成したリポジトリを選択

### 5-2. サービス設定
以下の設定を入力：

| 項目 | 値 |
|------|-----|
| **Name** | `kikuna-event-system` |
| **Environment** | `Node` |
| **Region** | `Oregon (US West)` |
| **Branch** | `main` |
| **Build Command** | `npm install && npm run db:generate && npx prisma db push && npm run setup:render` |
| **Start Command** | `npm start` |
| **Plan Type** | `Free` |

### 5-3. 環境変数設定
「Environment」セクションで以下を追加：

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `ADMIN_PASSWORD` | `training2024` |
| `SESSION_SECRET` | `kikuna-session-secret-2024` |

### 5-4. デプロイ開始
1. 「Create Web Service」をクリック
2. ビルドプロセスが開始される（5-10分）

✅ **完了チェック**: 緑色の「Live」ステータスが表示される

---

## Step 6: 動作確認 ⏱️ 5分

### 6-1. Webサイトアクセス
1. RenderダッシュボードでサービスURLをクリック
2. Webサイトが表示されることを確認

### 6-2. 管理画面テスト
1. URLの末尾に `/admin` を追加してアクセス
2. パスワード `training2024` でログイン
3. ボランティア一覧が表示されることを確認

✅ **完了チェック**: 管理画面で研修用データが表示される

---

## 🎉 研修環境完成！

### 📋 研修用情報
- **Webサイト**: https://あなたのサービス名.onrender.com
- **管理画面**: https://あなたのサービス名.onrender.com/admin
- **パスワード**: `training2024`
- **研修期間**: 1週間

### 📚 研修資料
- [操作マニュアル](./staff-training-manual.md)
- [よくある質問](./staff-faq.md)
- [研修環境ガイド](./training-setup.md)

---

## 🔄 1週間後：本番切り替え

### 本番移行手順
1. Renderダッシュボードで「Environment」を開く
2. `ADMIN_PASSWORD` を `Kikuna2025$Sakura#Admin` に変更
3. 「Save Changes」でサービスを再起動
4. 新しいパスワードでログインテスト

### 確認事項
- [ ] 新しいパスワードでログイン可能
- [ ] 研修データが本番用に切り替わっている
- [ ] すべての機能が正常動作している

---

## 🆘 困ったときは

### よくある問題
- **「Site can't be reached」**: デプロイ中の可能性。5-10分待ってから再アクセス
- **「Application Error」**: ログを確認。環境変数の設定ミスの可能性
- **ログインできない**: パスワードを再確認。大文字小文字も正確に

### サポートが必要な場合
1. Renderのログを確認（ダッシュボード → Logs）
2. エラーメッセージをメモ
3. 開発者に具体的な状況を報告

---

**🎯 この手順通りに進めれば、約30分でWebアプリケーションがインターネットに公開されます！**