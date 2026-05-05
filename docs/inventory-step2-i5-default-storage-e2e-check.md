# 在庫管理 STEP2-I5: 既定倉庫まわり E2E確認・運用テスト固定化

## 目的
- 新機能追加ではなく、`購入取引 → 入庫予定 → 入庫完了 → 在庫化` の主要導線が壊れていないことを継続確認できる状態にする。
- STEP2-I4（`User.defaultStorageLocationId` を利用した入庫先自動補完）の運用確認観点を固定化する。

## 前提
- 対象画面: `/inventory/inbound`, `/inventory/inbound/[id]/edit`, `/inventory/items`。
- 購入取引作成時に `createInboundScheduleFromDealing` が呼ばれる導線を利用する。
- 今回は大規模E2E自動化は行わず、手動確認チェックリスト + 最低限の回帰確認を優先する。

---

## 1) 既定倉庫ありケース（`User.defaultStorageLocationId` 設定あり）

### セットアップ
1. テストユーザーの `defaultStorageLocationId` に有効な倉庫IDを設定する。
2. 同ユーザーを買い手とした購入 `Dealing` を作成する。

### 期待結果
- `InboundSchedule` が自動作成される。
- `InboundSchedule.destinationLocationId` にユーザー既定倉庫IDが入る。
- `/inventory/inbound` 一覧で対象予定が「入庫先未設定」表示にならない。
- 一覧または編集画面から「入庫完了」が実行できる。
- 完了後、`InventoryMovement` に `movementType=INBOUND`, `status=COMMITTED` のレコードが作成される。
- 対象 SKU + 倉庫の `InventoryItem` が未作成なら新規作成、既存なら数量加算される。

### 補足（実装上の根拠）
- 自動作成時の note は `destinationLocationId` の有無で `既定倉庫を入庫先に自動設定` / `入庫先未設定` が切り替わる。

---

## 2) 既定倉庫なしケース（`User.defaultStorageLocationId = null`）

### セットアップ
1. テストユーザーの `defaultStorageLocationId` を `null` にする。
2. 同ユーザーを買い手とした購入 `Dealing` を作成する。

### 期待結果
- `InboundSchedule` が自動作成される。
- `InboundSchedule.destinationLocationId` は `null`。
- `/inventory/inbound` 一覧で対象予定に「入庫先未設定」バッジが表示される。
- 「入庫完了」ボタンは disabled になり、未設定のまま完了できない。
- `/inventory/inbound/[id]/edit` で入庫先を設定・保存すると、完了可能状態になる。
- 入庫完了後の DB 変化は「既定倉庫ありケース」と同等（INBOUND/COMMITTED movement 作成 + InventoryItem 反映）。

---

## 3) 入庫完了取消ケース

### セットアップ
- 入庫完了済み（`status=RECEIVED`）の `InboundSchedule` を用意する。

### 期待結果
- `/inventory/inbound` 一覧に「入庫済みを取消」が表示される。
- 取消実行で reverse movement（実装上 `movementType=ADJUSTMENT`, `status=COMMITTED`, 数量マイナス）が作成される。
- `InventoryItem.quantity` が入庫前相当に戻る。
- 元の入庫 movement（INBOUND/COMMITTED）は削除されず監査証跡として残る。
- 同一予定に対する二重取消は防止される（逆仕訳重複作成が起きない）。

---

## 手動確認URL
- 入庫予定一覧: `/inventory/inbound`
- 入庫予定編集: `/inventory/inbound/[id]/edit`
- 在庫一覧: `/inventory/items`

---

## 期待されるDB変化（観点）

### 入庫予定自動作成時
- `InboundSchedule`
  - `sourceType=DEALING`
  - `sourceDealingId` が対象購入取引ID
  - `destinationLocationId` は既定倉庫設定有無に応じて `id / null`

### 入庫完了時
- `InboundSchedule.status`: `SCHEDULED` (or `IN_TRANSIT`) → `RECEIVED`
- `InventoryMovement`:
  - `movementType=INBOUND`
  - `status=COMMITTED`
  - `quantityDelta` は正
  - `dedupeKey=inbound:{scheduleId}:received`
- `InventoryItem`:
  - 対象 SKU + 倉庫で upsert
  - `quantity` が加算される

### 入庫完了取消時
- `InboundSchedule.status`: `RECEIVED` → `SCHEDULED`
- `InventoryMovement`:
  - reverse レコード追加（`dedupeKey=inbound:{scheduleId}:received:reverse`）
  - `quantityDelta` は負
- `InventoryItem.quantity` が減算され、入庫取消前の値に戻る
- 元の `INBOUND/COMMITTED` movement は保持される

---

## 今回の自動テスト追加方針
- 現状リポジトリにはテストランナー（Vitest/Jest等）と専用テストスクリプトが未整備のため、STEP2-I5ではまず運用チェックリストを固定化する。
- 次ステップで無理なく追加する候補:
  1. `src/features/inventory/inbound-auto.ts` の helper 単体テスト（dedupeKey・source metadata）
  2. `src/features/inventory/inbound-sync.ts` の自動作成ロジック統合テスト（既定倉庫あり/なし）
  3. `src/features/inventory/server.ts` の `completeInboundSchedule` / `cancelCompletedInboundSchedule` の in-memory DB統合テスト

---

## 今回やらないこと（スコープ外）
- schema変更
- migration
- Company既定倉庫
- 原価/利益管理
- CSV
- QR
- 棚卸
- 本番migration実行

