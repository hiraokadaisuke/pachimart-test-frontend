# 在庫管理 STEP2 事前設計レビュー（DB設計方針）

> 対象画面: `/inventory`, `/inventory/items`, `/inventory/items/[id]`, `/inventory/inbound`, `/inventory/outbound`  
> スコープ: **今回は設計のみ**（Prisma schema / migration / 接続変更 / 実装変更なし）

## 1. 既存DB構造の整理（現状把握）

## 1-1. 在庫管理に関連する既存モデル

- `User`
  - テナント分離の実質キー（現状 `companyId` はなく `userId` 単位）。
  - `StorageLocation`（保管場所）や `Exhibit`（出品）との関係の起点。
- `Exhibit`
  - 既存の「パチマート出品」実体。
  - `maker`, `machineName`, `quantity`, `unitPriceExclTax`, `status`, `storageLocationId` 等を保持。
- `Navi`
  - 取引ナビ情報。`listingId` を保持し、`Dealing` と1:1相当。
- `Dealing`
  - 売買進行ステータス実体（支払・完了・取消の時系列含む）。
- `OnlineInquiry`
  - オンライン問い合わせ。将来の受注前イベントとして連携余地あり。
- `LedgerEntry`
  - 将来の粗利計算・費用集計の基盤になり得る台帳。
- `Maker` / `MachineModel`
  - マスタとしてそのまま再利用しやすい。
- `StorageLocation`
  - 在庫保管場所として再利用可能（命名上は倉庫/ロケーションに近い）。

## 1-2. 使い回せそうなモデル

- `Maker`, `MachineModel`: 在庫品目の正規化に再利用。
- `StorageLocation`: 在庫ロケーションとして再利用。
- `Exhibit`: 在庫から出品した実体を紐づける先として再利用。
- `Dealing`, `Navi`: 発送予定・成約連動の外部イベント元として再利用。
- `LedgerEntry`: 将来の利益管理集計に利用（在庫側イベントから転記/連動）。

## 1-3. 新規追加が必要そうな領域

- 在庫実体（InventoryItem）
- 在庫変動（入庫/出庫/調整）履歴（InventoryMovement）
- 入庫予定・発送予定の計画レイヤー
- 購入伝票・販売伝票（ヘッダ/明細）
- 取引連携の中間リンク（Exhibit/Dealing/Naviとの同一性管理）

---

## 2. 推奨DB設計案

## 結論（先に）

- **在庫物件一覧 / 設置物件一覧 / 非在庫物件一覧は別テーブルにしない**。  
  `InventoryItem` を単一テーブルにし、`inventoryStatus` と `ownershipType`（在庫/設置/非在庫）で表現する。
- **入庫予定と発送予定は基底を共通化しつつ、業務属性は分離**。  
  具体的には `InventoryMovement`（実績）を共通化し、予定は `InboundSchedule` / `OutboundSchedule` を別に持つ。
- **購入伝票・販売伝票はヘッダ/明細で分離**し、明細が在庫変動・在庫アイテムへ接続する。

## 2-1. `InventoryItem`（新規）

- 役割
  - 在庫管理の主キーとなる「物件」実体。
- 主なカラム（案）
  - `id`（cuid）
  - `ownerUserId`（必須）
  - `makerId`（nullable, `Maker` FK）
  - `machineModelId`（nullable, `MachineModel` FK）
  - `makerNameSnapshot`, `modelNameSnapshot`（名称スナップショット）
  - `itemType`（enum: `PACHINKO`/`SLOT`）
  - `frameColor`（nullable）
  - `ownershipType`（enum: 在庫/設置/非在庫）
  - `inventoryStatus`（enum）
  - `quantityOnHand`（必須）
  - `storageLocationId`（nullable, `StorageLocation` FK）
  - `purchaseUnitPrice`, `plannedSaleUnitPrice`（nullable）
  - `listingStatus`（enum）
  - `note`（nullable）
  - `createdAt`, `updatedAt`
- 既存モデルとのリレーション
  - `User(1) - (N) InventoryItem`
  - `Maker` / `MachineModel` / `StorageLocation` と任意FK
- nullableにするべき項目
  - `makerId`, `machineModelId`, `frameColor`, `storageLocationId`, `purchaseUnitPrice`, `plannedSaleUnitPrice`, `note`
- enumにするべき項目
  - `itemType`, `ownershipType`, `inventoryStatus`, `listingStatus`
- 注意点
  - 名称変更耐性のため、`makerId`/`machineModelId` + snapshot 併用推奨。

## 2-2. `InventoryMovement`（新規）

- 役割
  - 在庫数量の単一真実源（SoT）となる増減履歴。
- 主なカラム（案）
  - `id`, `ownerUserId`, `inventoryItemId`
  - `movementType`（INBOUND / OUTBOUND / ADJUSTMENT / TRANSFER）
  - `status`（PLANNED / COMMITTED / CANCELED）
  - `quantityDelta`（+/-）
  - `scheduledAt`, `committedAt`（nullable）
  - `sourceType`, `sourceId`（伝票/取引連携元）
  - `dedupeKey`（unique）
  - `note`, `createdByUserId`
- 既存モデルとのリレーション
  - `InventoryItem`、将来 `Dealing`, `Navi`, `Exhibit`, 伝票明細へ論理リンク
- nullable
  - `committedAt`, `sourceId`, `note`
- enum
  - `movementType`, `status`, `sourceType`
- 注意点
  - 二重反映防止のため `dedupeKey` を必須運用。

## 2-3. `InboundSchedule` / `OutboundSchedule`（新規）

- 役割
  - UI上の予定管理（業務入力）レイヤー。
- 方針
  - 共通テーブル化よりも、業務項目差が大きいため当面分離が安全。
- 主なカラム（案）
  - 共通: `id`, `ownerUserId`, `inventoryItemId(nullable)`, `expectedDate`, `status`, `quantity`
  - Inbound固有: `supplierName`, `destinationLocationId`, `purchaseRecordLineId(nullable)`
  - Outbound固有: `buyerName`, `originLocationId`, `shippingMethod`, `salesRecordLineId(nullable)`, `dealingId(nullable)`
- リレーション
  - `InventoryItem` 任意リンク（入庫前は未確定のためnullable）
- 注意点
  - 「予定確定時」に `InventoryMovement(PLANNED)` を作成し、完了時に `COMMITTED` 化。

## 2-4. `PurchaseRecord` / `PurchaseRecordLine`（新規）

- 役割
  - 購入伝票（仕入）ヘッダ/明細。
- 主なカラム
  - Header: `id`, `ownerUserId`, `supplier`, `recordDate`, `status`, `currency`, `memo`
  - Line: `id`, `recordId`, `inventoryItemId(nullable)`, `maker/model snapshot`, `quantity`, `unitPrice`, `tax`, `fee`
- 注意点
  - 入庫前仕入もあるため `inventoryItemId` はnullable許容。

## 2-5. `SalesRecord` / `SalesRecordLine`（新規）

- 役割
  - 販売伝票（売上）ヘッダ/明細。
- 主なカラム
  - Header: `id`, `ownerUserId`, `buyer`, `recordDate`, `status`, `memo`
  - Line: `id`, `recordId`, `inventoryItemId`, `quantity`, `unitPrice`, `shippingFee`, `handlingFee`, `otherCost`
- 注意点
  - 発送完了前に売上計上するケースを想定し、状態遷移を保持。

## 2-6. `InventoryExternalLink`（新規、統合リンク）

- 役割
  - 在庫と既存パチマート実体（`Exhibit`, `Dealing`, `Navi`, 将来TradeID）の関連を正規化。
- 主なカラム
  - `id`, `ownerUserId`, `inventoryItemId`
  - `externalType`（EXHIBIT / DEALING / NAVI / TRADE）
  - `externalId`（string）
  - `linkStatus`（ACTIVE / CLOSED / INVALID）
  - `syncedAt`, `payloadSnapshot`
- 注意点
  - 外部ID型差異（Int/String）吸収のため `externalId` はstring推奨。

---

## 3. ステータス設計（提案）

## 3-1. 在庫ステータス `InventoryStatus`

- `DRAFT`（登録途中）
- `IN_STOCK`（在庫中）
- `NEGOTIATING`（商談中）
- `RESERVED`（引当済）
- `OUTBOUND_SCHEDULED`（発送予定あり）
- `SOLD`（売却済）
- `INSTALLED`（設置中）
- `NON_STOCK`（非在庫管理対象）
- `ARCHIVED`（論理保管）

## 3-2. 出品ステータス `InventoryListingStatus`

- `NOT_LISTED`
- `LISTED`
- `NEGOTIATING`
- `CONTRACTED`
- `SUSPENDED`
- `CLOSED`

## 3-3. 入庫ステータス `InboundStatus`

- `PLANNED`
- `ARRIVAL_WAITING`
- `PARTIALLY_RECEIVED`
- `RECEIVED`
- `CANCELED`

## 3-4. 発送ステータス `OutboundStatus`

- `PLANNED`
- `PICKING`
- `READY_TO_SHIP`
- `SHIPPED`
- `DELIVERED`
- `CANCELED`

## 3-5. 取引連携ステータス `IntegrationStatus`

- `UNLINKED`
- `LINKED`
- `SYNC_PENDING`
- `SYNCED`
- `SYNC_ERROR`
- `DETACHED`

---

## 4. 実装順序（STEP2以降）

## STEP2-A（最小の実データ化）
- `InventoryItem` + 最低限enum追加。
- `/inventory/items` と `/inventory/items/[id]` をDB取得へ切替。
- 既存mockとの並走期間を設け、Feature Flagで切替可能にする。

## STEP2-B（在庫メンテ運用）
- 在庫登録/編集/ステータス更新/保管場所更新。
- `Maker` `MachineModel` `StorageLocation` の参照連携。

## STEP2-C（入庫予定→入庫実績）
- `InboundSchedule` 導入。
- 入庫完了時に `InventoryMovement(COMMITTED)` を作成して数量反映。

## STEP2-D（発送予定→発送実績）
- `OutboundSchedule` 導入。
- 発送完了時に `InventoryMovement(COMMITTED)` を作成して数量減算。

## STEP2-E（伝票化）
- `PurchaseRecord` / `SalesRecord` のヘッダ・明細導入。
- 予定・実績・伝票の突合ロジックを追加。

## STEP2-F（パチマート連携）
- `InventoryExternalLink` 導入。
- `Exhibit` / `Dealing` / `Navi` との同期ジョブ（片方向→双方向）を段階導入。

## STEP2-G（利益管理）
- 粗利（売上-仕入-送料-手数料-その他）計算ビュー/集計API。
- 必要に応じて `LedgerEntry` との接続。

---

## 5. リスク・注意点

- 既存本番DBへの影響
  - 既存 `Exhibit`/`Dealing` のスキーマに直接依存しすぎると影響が大きいため、在庫側は独立テーブルで追加する。
- migration注意点
  - 大量データ化を見越して、`ownerUserId + status + updatedAt` 系インデックスを初期から設計。
  - enum変更頻度が高い場合は運用手順（追加のみ先行、削除は後方互換期間後）を定義。
- preview/prod運用
  - previewはマイグレーション自動適用、prodは手動承認＋ロールバック計画を必須化。
- `companyId` / `userId` 分離
  - 現状は `userId` が境界。将来 `Company` 導入を見越して、全新規テーブルに `ownerUserId` を必須化し、`ownerCompanyId` 追加余地を確保。
- 在庫数量整合性
  - 数量は `InventoryMovement` 由来で再計算可能にする（直接更新を最小化）。
- 取引連携の二重反映防止
  - `dedupeKey` と `sourceType+sourceId` ユニーク制約で冪等性を担保。
- 既存 `Exhibit` / `Dealing` との関係
  - 在庫に外部キーを直接埋め込むより中間リンク推奨（1在庫:多外部イベント対応）。
- 将来拡張（CSV/QR/棚卸）
  - CSV取込は `InboundSchedule` へのバルク投入が自然。
  - QRは `InventoryItem.id` もしくは管理番号をエンコード。
  - 棚卸は `InventoryMovement` の `ADJUSTMENT` で監査証跡を残せる。

---

## 6. 「次に実装するなら最初に作るべきモデル・migration案」

最初は **Inventoryの核だけを小さく導入**する。

1. 追加モデル
- `InventoryItem`
- `InventoryMovement`

2. 追加enum
- `InventoryStatus`
- `InventoryListingStatus`
- `InventoryMovementType`
- `InventoryMovementStatus`

3. 初回migrationの要点
- `InventoryItem(ownerUserId, inventoryStatus, updatedAt)` 複合index
- `InventoryMovement(inventoryItemId, committedAt)` index
- `InventoryMovement.dedupeKey` unique

4. アプリ反映
- `/inventory/items` 一覧・詳細のみDB化（作成/更新は次段階）

この順で進めると、既存機能への影響を抑えつつ、入庫/発送/利益連携の土台を先に確立できる。
