# Pachimart Test Frontend

Next.js (App Router) と Tailwind CSS を利用したサンプルフロントエンドです。モックデータを使ってアイテム一覧と詳細ページを表示します。

## セットアップ

```bash
npm install
npm run dev
```

- 開発サーバー: http://localhost:3000
- コード整形: `npm run format`
- Lint: `npm run lint`

## ページ構成

- `/` トップページ
- `/items` アイテム一覧（`src/lib/mockData.ts` のデータを表示）
- `/items/[id]` アイテム詳細
