# MyPortal

Next.js (App Router) で以下を提供します。
- `/portal`: 表示時点でRSSニュースを取得して表示（保存しない）
- `/portal`: X公式埋め込みタイムライン（Profile Timeline）をタブ表示
- `/settings`: Googleログイン後にニュース設定とX対象ユーザー設定を編集し Firestore に保存

## セットアップ

1. 依存関係をインストール
```bash
npm install
```

2. `.env.local` を作成して Firebase 用の値を設定
```env
# Firebase Admin SDK (server only)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Web SDK (client)
NEXT_PUBLIC_FIREBASE_API_KEY=xxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=1:xxxxx:web:xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxx

# cupnudle static login (for /cupnudle)
AUTH_LOGIN_ID=your-login-id
AUTH_LOGIN_PASSWORD=your-login-password
```

3. 開発サーバー起動
```bash
npm run dev
```

## Firebase コンソール設定

1. **Firestore Database を作成**
- Firebase Console -> 構築 -> Firestore Database -> データベース作成

2. **Authentication の Google ログインを有効化**
- Firebase Console -> 構築 -> Authentication -> Sign-in method
- Google を有効化して保存

3. **サービスアカウント鍵を発行 (Admin SDK)**
- Firebase Console -> プロジェクト設定 -> サービスアカウント
- 新しい秘密鍵を生成し JSON をダウンロード
- JSON の `project_id`, `client_email`, `private_key` を `.env.local`/Vercel に設定

## Firestore 設計

- `settings/newsKeywords/items/{id}`
  - `keyword: string`
  - `enabled: boolean`
  - `order: number`
  - `limit: number` (各キーワードの表示上限)
  - `rssUrl?: string` (任意フォールバック)
  - `createdAt`, `updatedAt`

- `settings/xTargets/items/{id}`
  - `name: string`
  - `username?: string`
  - `profileUrl?: string`
  - `enabled: boolean`
  - `order: number`
  - `createdAt`, `updatedAt`

## Firestore ルール（推奨）

- この実装はサーバー側 Admin SDK で読み書きするため、クライアント直接アクセスは不要です。
- まずは次のように閉じて運用できます。

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Vercel デプロイ

1. GitHub に push
2. Vercel でプロジェクトを import
3. Environment Variables に `.env.local` の項目を設定（Admin SDK + Web SDK）
4. デプロイ後、`/settings` にアクセスして Google ログイン -> 設定保存
5. `/portal` で表示確認

## 動作確認ポイント

- `/settings` 未ログイン時に Google ログインボタンが表示される
- ログイン後にニュース・X設定を追加して保存できる
- `/portal` でニュースが表示時に取得される（更新で再取得される）
- RSS失敗時に該当キーワードのみ失敗表示される
- Xタブ切替で埋め込みタイムラインが切り替わる

## cupnudle 統合

- `/cupnudle`: 在庫一覧
- `/cupnudle/login`: ID/パスワードログイン
- `/cupnudle/items`: 品名マスタ管理
- `/cupnudle/stocks/new`: 在庫登録

`/cupnudle` 配下は middleware で保護され、`AUTH_LOGIN_ID` / `AUTH_LOGIN_PASSWORD` と一致した場合のみアクセスできます。
