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
- `GET /api/trades/in-progress/[id]` : `Trade.id` を指定して IN_PROGRESS 取引の詳細を取得（`navi`、`sellerUser`、`buyerUser` を含む）

レスポンスは DTO 形式で返し、日時は ISO8601 文字列です。

`GET /api/trades/in-progress/[id]` の例:

```bash
curl "https://<your-domain>/api/trades/in-progress/1"
# =>
# {
#   "id": 1,
#   "sellerUserId": "dev_user_2",
#   "buyerUserId": "dev_user_1",
#   "status": "IN_PROGRESS",
#   "payload": { ... },
#   "naviId": 10,
#   "createdAt": "2024-04-01T00:00:00.000Z",
#   "updatedAt": "2024-04-01T01:23:45.000Z",
#   "navi": { "id": 10, "ownerUserId": "dev_user_2", ... },
#   "sellerUser": { "id": "dev_user_2", "companyName": "株式会社かきくけこ" },
#   "buyerUser": { "id": "dev_user_1", "companyName": "株式会社あいおえお" }
# }
```

### 取引Navi 保存ポリシー

- 未送信の下書きはブラウザの `sessionStorage` のみで管理し、DB には保存しません。
- ナビの「送信」操作時にのみ `/api/trades` へ POST し、`TradeNavi` レコードを作成します。

## DB 運用 (migrate/seed)

ローカルでは DB に接続せず、マイグレーションは GitHub Actions の運用を維持します。
- `prisma/schema.prisma` への変更はコミットに含め、`prisma migrate` は実行しません。
- GitHub Actions Secrets に `PRISMA_DATABASE_URL` を設定し、Actions の “DB Init” ワークフローを手動実行するとDBを初期化できます。

### Seed ポリシーと実行手順

- seed では開発用の固定 ID ユーザーを **5 名 upsert** します（冪等）。
- 本番事故を防ぐため、`SEED_MODE` が `preview` または `dev` のときのみ投入します（未設定時は何もしません）。
- ローカルで seed を叩く導線は作りません。DB への適用は GitHub Actions 経由でのみ実行します。
- 手動実行手順: GitHub の Actions タブ → `DB Init` ワークフロー → `Run workflow` を押下（`PRISMA_DATABASE_URL` が設定されたリポジトリにおいて、ワークフロー内で `SEED_MODE=preview` が渡されます）。

#### 開発用ユーザー ID 一覧（ownerUserId 等で利用できます）

- `dev_user_1` / 株式会社あいおえお
- `dev_user_2` / 株式会社かきくけこ
- `dev_user_3` / 株式会社さしすせそ
- `dev_user_4` / 株式会社たちつてと
- `dev_user_5` / 株式会社なにぬねの

API への POST 例（Trade 作成）:

```bash
curl -X POST "https://<your-domain>/api/trades" \
  -H "Content-Type: application/json" \
  -d '{
    "ownerUserId": "dev_user_1",
    "sellerUserId": "dev_user_2",
    "buyerUserId": "dev_user_1",
    "status": "IN_PROGRESS"
  }'
```
