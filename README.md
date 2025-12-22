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

## ドキュメント

- [Todo.kind 対応表（本番基準）](docs/todo_mapping.md)
- [Todo.kind 差分ログ（テスト拡張）](docs/todo_diff.md)

## API 叩き方

Prisma と PostgreSQL を利用した取引(TradeNavi) API が app router で提供されています。

- `GET /api/health/db` : DB へ簡易クエリを実行し、`{ ok: true }` を返却
- `GET /api/trades` : 取引一覧を作成日時の降順で返却
- `POST /api/trades` : 取引を作成（最低限 `ownerUserId` が必須。`status` 未指定時は `DRAFT`）
- `GET /api/trades/[id]` : 単一取引の詳細取得
- `PATCH /api/trades/[id]` : `status` を enum で更新

レスポンスは DTO 形式で返し、日時は ISO8601 文字列です。

## DB 運用 (migrate/seed)

ローカルでは DB に接続せず、マイグレーションは GitHub Actions の運用を維持します。
- `prisma/schema.prisma` への変更はコミットに含め、`prisma migrate` は実行しません。
- GitHub Actions Secrets に `PRISMA_DATABASE_URL` を設定し、Actions の “DB Init” ワークフローを手動実行するとDBを初期化できます。
