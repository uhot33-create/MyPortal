# MyPortal

Next.js (App Router) で以下を提供します。
- `/portal`: 表示時点でRSSニュースを取得して表示（保存しない）
- `/portal`: X公式埋め込みタイムライン（Profile Timeline）をタブ表示
- `/settings`: ニュース設定とX対象ユーザー設定を編集し Firestore に保存

## セットアップ

1. 依存関係をインストール
```bash
npm install
```

2. `.env.local` を作成して Firebase Admin SDK 用の値を設定
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

3. 開発サーバー起動
```bash
npm run dev
```

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

## Firestore ルール（開発時の注意）

- 本実装は認証なしを想定し、サーバー経由で Firestore を更新します。
- 本番では以下を必ず実施してください。
  - Firebase Authentication を追加して管理者のみ更新可能にする
  - セキュリティルールでクライアントからの直接書き込みを原則拒否する
  - サービスアカウントキーは Vercel の Environment Variables のみで管理する

## Vercel デプロイ

1. GitHub に push
2. Vercel でプロジェクトを import
3. Environment Variables に `.env.local` の3項目を設定
4. デプロイ後に `/settings` で設定保存、`/portal` で表示確認

## 動作確認ポイント

- `/settings` でニュース・X設定を追加して保存できる
- `/portal` でニュースが表示時に取得される（更新で再取得される）
- RSS失敗時に該当キーワードのみ失敗表示される
- Xタブ切替で埋め込みタイムラインが切り替わる
