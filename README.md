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

### 体験用データでの動作確認手順（売主→買主→売主）

1. 画面右上の DevUserContext で **売主A（dev_user_1）** に切り替える。
2. 「オンライン問い合わせ」からサンプルナビ（`NAVI-1001`）が SENT 状態で見えることを確認する。
3. 同じく **売主A** のまま、ナビ詳細を開いて送信済み内容（買主B宛て）を確認する。
4. DevUserContext を **買主B（dev_user_2）** に切り替え、受信トレイに `NAVI-1001` が届いていることを確認する。
5. 買主Bとして `NAVI-1002`（APPROVED 済み）を開き、取引中一覧に表示されることを確認する。
6. 同じ `NAVI-1002` でメッセージタブを開き、買主→売主→買主の往復が 1 往復分表示されることを確認する。
7. 取引詳細（/transactions/navi/1002）を開き、金額サマリーが表示されることを確認する。
8. 必要に応じて `PATCH /api/trades/1002` で APPROVED 状態を再送し、Trade が upsert されることを確認する。
9. 画面の UI・文言は変更せず、DevUserContext の切替だけで操作が追えることを確認する。
10. 体験後は再度売主Aに戻し、ナビ一覧・取引一覧が整合していることを確認する。

### Seed を更新したときの GitHub Actions 運用

- `prisma/seed.ts` を変更した場合は、PR マージ後に GitHub Actions の `DB Init` ワークフローを **手動実行** して seed を反映する。
- Actions の実行は `PRISMA_DATABASE_URL` が設定されたリポジトリでのみ有効。ローカル DB での migrate/seed は行わない。

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
