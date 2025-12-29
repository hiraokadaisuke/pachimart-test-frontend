# Pachimart Test Frontend

Next.js (App Router) と Tailwind CSS を利用したサンプルフロントエンドです。モックデータを使ってアイテム一覧と詳細ページを表示します。

## セットアップ

ローカル DB を前提とせず、Preview（Vercel）での動作確認を基準にしています。フロントエンドの開発用には次のコマンドを利用できます。

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

Prisma と PostgreSQL を利用したナビ API が app router で提供されています。

- `GET /api/health/db` : DB へ簡易クエリを実行し、`{ ok: true }` を返却
- `GET /api/trades` : 取引一覧を作成日時の降順で返却
- `POST /api/trades` : 取引を作成（最低限 `ownerUserId` が必須。`status` 未指定時は `DRAFT`）
- `GET /api/trades/[id]` : 単一取引の詳細取得
- `PATCH /api/trades/[id]` : `status` を enum で更新
- `GET /api/trades/in-progress/[id]` : `Trade.id` を指定して IN_PROGRESS 取引の詳細を取得（`navi`、`sellerUser`、`buyerUser` を含む）

進行中取引の詳細ページ（`/transactions/navi/[id]`）も上記の `GET /api/trades/in-progress/[id]` を参照し、Trade と Navi の両方を DB から読み取ります。

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

### ナビ保存ポリシー

- 未送信の下書きはブラウザの `sessionStorage` のみで管理し、DB には保存しません。
- ナビの「送信」操作時にのみ `/api/trades` へ POST し、`Navi` レコードを作成します。

## Preview 環境での E2E 体験手順（ローカル DB 不要）

目的: 開発者が **GitHub Actions → Vercel Preview** のみで「出品 → ナビ作成 → 送信 → 承認 → Trade 生成 → SOLD 表示 → 決済管理 → 明細書」までを再現できる状態を維持します。

### 1. PR 作成とシード実行

1. PR を作成すると GitHub Actions が `prisma migrate`/`prisma db seed` を実行します（`SEED_MODE=preview`）。
2. seed は冪等で、ローカル DB や手動 migrate/seed は不要です。

### 2. Vercel Preview の準備

1. Actions 完了後、PR の Vercel Preview を開きます。
2. 画面右下の 👥 アイコンから開発用ユーザーを切り替えます（A〜E が `dev_user_1`〜`dev_user_5` に対応）。
   - `x-dev-user-id` ヘッダーはフロント側で自動付与済みです。
   - `/inventory` 配下は操作・編集しません。

### 3. Seed に含まれる E2E 用データ概要

- DevUser: 5 名（`dev_user_1`〜`dev_user_5`）。
- 倉庫: dev_user_1 に 2 件、dev_user_2 と dev_user_3 に各 1 件。
- 出品例:
  - dev_user_1: オンライン問い合わせ可の PUBLISHED 出品、承認済みで SOLD になった出品、応相談（問い合わせ不可）の出品。
  - dev_user_2: PUBLISHED 出品（オンライン問い合わせ送信先）。
  - dev_user_4: SOLD 表示確認用の出品。
- Navi / Trade:
  - 「送信済み・承認待ち」の電話ナビ（dev_user_1 → dev_user_2）。
  - 「オンライン問い合わせ＋メッセージ往復付き」のナビ（dev_user_1 ↔ dev_user_2）。
  - 「承認済みで Trade 生成済み」のナビ+取引（決済管理・明細に表示、関連 Listing は SOLD）。

### 4. 画面での E2E 操作フロー（例）

1. **dev_user_1 に切替** → `/sell` で新規出品（非応相談・単価あり）。
2. **dev_user_2 に切替** → `/products` から対象商品を開き「ナビ作成」→ 条件入力して送信。
3. **dev_user_2 のまま** → `/navi` で承認待ちナビを確認、必要事項を入力して承認。
4. 承認後 `/products` で対象出品が **成約済み（グレーアウト）** になることを確認。
5. `/payments` → 進行中タブで生成済み Trade を確認、行の「メッセージ」から往復ログを参照。
6. `/payments` から明細書を開き、金額や条件が表示されることを確認。
7. **オンライン問い合わせ確認**: `/products` → dev_user_2 の出品詳細からオンライン問い合わせを送信し、dev_user_2/1 間でメッセージが 2 往復入っていることを `/navi` で確認。
8. **応相談の例**: dev_user_1 の「応相談」出品ではオンライン問い合わせボタンが利用できないことを確認。

### 5. DB 運用 (migrate/seed)

- `prisma/schema.prisma` への変更はコミットに含め、`prisma migrate` はローカルで実行しません。
- GitHub Actions Secrets に `PRISMA_DATABASE_URL` を設定し、Actions からのみ DB を初期化します。
- seed は `preview`/`dev` モードでのみ動作し、冪等です（重複投入や二重実行で壊れません）。

#### 開発用ユーザー ID 一覧（ownerUserId 等で利用できます）

- `dev_user_1` / 株式会社あいおえお
- `dev_user_2` / 株式会社かきくけこ
- `dev_user_3` / 株式会社さしすせそ
- `dev_user_4` / 株式会社たちつてと
- `dev_user_5` / 株式会社なにぬねの
