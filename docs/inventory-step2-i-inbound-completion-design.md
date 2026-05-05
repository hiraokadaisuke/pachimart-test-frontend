# 在庫管理 STEP2-I 設計レビュー: 購入取引由来 InboundSchedule の入庫完了設計

## 0. 前提と目的

本ドキュメントは、STEP2-Hで導入済みの「購入取引(Dealing)→InboundSchedule自動作成」を前提に、**入庫完了時の在庫生成・紐付け戦略**と**既定倉庫設定方針**を整理するための設計レビューです。

今回は調査・設計のみ（非実装）とし、現行コードの挙動確認と、次実装ステップの提案を行います。

---

## 1. 現在の実装整理

### 1-1. `completeInboundSchedule` の現行挙動

- 対象 `InboundSchedule` を ownerUserId で取得し、`RECEIVED/CANCELED` は完了不可。
- `dedupeKey = inbound:{schedule.id}:received` の `InventoryMovement` が既にあれば冪等扱いで `InboundSchedule.status=RECEIVED` のみ更新して終了。
- 未処理時は以下を実行：
  - `inventoryItemId` がある場合：既存在庫へ `quantityOnHand += schedule.quantity`。
  - `inventoryItemId` がない場合：`InventoryItem` 新規作成（`ownershipType=STOCK`, `inventoryStatus=IN_STOCK`, `listingStatus=NOT_LISTED`, `purchaseUnitPrice=null`, `plannedSaleUnitPrice=null`）。
  - `InventoryMovement(INBOUND, COMMITTED, +quantity)` を作成。
  - `InboundSchedule.status=RECEIVED` と `inventoryItemId` を更新。

### 1-2. `inventoryItemId` あり/なしの差分

- **あり**：既存 `InventoryItem` を更新し、`storageLocationId` は `schedule.destinationLocationId ?? existingItem.storageLocationId`。
- **なし**：`InboundSchedule` のスナップショット情報をベースに新規 `InventoryItem` を作成し、`storageLocationId = schedule.destinationLocationId`。

### 1-3. `destinationLocationId = null` 時の挙動

- 完了処理に `destinationLocationId` 必須バリデーションはない。
- 既存在庫紐付け時は既存在庫の `storageLocationId` が残る。
- 新規在庫作成時は `storageLocationId=null` のまま作成されうる。
- スキーマ上も `InboundSchedule.destinationLocationId` および `InventoryItem.storageLocationId` は nullable。

### 1-4. 自動作成 InboundSchedule（sourceType=DEALING）の挙動

- `createInboundScheduleFromDealing` は `destinationLocationId=null` で自動作成。
- `sourceType=DEALING`, `sourceId=dealing.id`, `dedupeKey=inbound-from-dealing:{id}` を設定。
- `completeInboundSchedule` 側は `sourceType` を分岐条件にしておらず、**手動作成と同じ完了ロジック**で処理される。

### 1-5. 価格項目 (`purchaseUnitPrice` / `plannedSaleUnitPrice`) の現状

- `inventoryItemId` なしで新規作成される `InventoryItem` は、
  - `purchaseUnitPrice = null`
  - `plannedSaleUnitPrice = null`
- つまり現時点では購入由来で入庫完了しても、原価は確定しない。

### 1-6. 入庫完了取消（reverse movement）の現状

- `cancelCompletedInboundSchedule` では、元 movement(`inbound:{id}:received`) の存在確認後、
  - 在庫数量を `-schedule.quantity`
  - `InventoryMovement(ADJUSTMENT, COMMITTED, -quantity)` を reverse として作成（`dedupeKey=inbound:{id}:received:reverse`）
  - `InboundSchedule.status=CANCELED`
- movement削除ではなく reverse で戻す方針は実装済み。

---

## 2. 推奨方針

### 2-1. InventoryItem 新規作成ルール（購入由来）

**推奨（MVP）**

- `ownershipType = STOCK`：妥当。
- `inventoryStatus = IN_STOCK`：妥当（入庫完了時点で販売可能在庫として扱う前提）。
- `listingStatus = NOT_LISTED`：妥当（入庫時点は未出品が自然）。
- スナップショット引継ぎ：`itemType/makerNameSnapshot/modelNameSnapshot/frameColor` は引継ぐ。
- `purchaseUnitPrice`：**当面 null 固定**を推奨。
  - 理由：Exhibit価格は「売値文脈」であり、実仕入原価と乖離しうる。
  - Dealing/LedgerEntryも現時点で「在庫原価確定ソース」として統一されていない。
- `plannedSaleUnitPrice`：null で開始。
- `note`：`dealingId/sourceType/sourceId` の監査追跡情報を残す（ただし重複記載よりsource系フィールド正規化を優先）。

### 2-2. 既存在庫への加算/統合方針

**推奨（MVP）**：購入由来の自動完了では、原則「常に新規InventoryItem作成」。

- 中古機・個体差・取引単価差・仕入先差があるため、同型番統合は原価管理を壊しやすい。
- 将来粗利計算（売上対原価）を考えると、ロット/取引粒度を残す方が安全。
- 例外統合（同モデル同倉庫同単価）を導入するなら、原価台帳実装後に限定的に行う。

### 2-3. 入庫先未設定の扱い

**安全運用推奨**

1. `destinationLocationId` が null の場合、**入庫完了を禁止**（バリデーションエラー）。
2. 一覧/詳細で「入庫先未設定」警告表示を明示。
3. 入庫予定編集で倉庫設定後に完了可能。
4. 既定倉庫が設定済みなら自動補完（次STEP）。

> 目的：`storageLocationId=null` の在庫生成を防止し、棚卸・引当不能在庫を作らない。

### 2-4. 既定倉庫設定の持ち方（最小実装）

**最小案**

- まずは `User.defaultStorageLocationId` で実装（現行スキーマは ownerUserId 中心のため整合しやすい）。
- 補完ロジック：購入由来自動作成時に `destinationLocationId` が空なら `defaultStorageLocationId` を代入。
- 整合制約（アプリ層）：
  - `defaultStorageLocationId` は同一 `ownerUserId` の active な `StorageLocation` のみ許可。
- 無効化/削除時：
  - 参照先が無効になったら `defaultStorageLocationId=null` へクリア。
  - 以後の自動作成は未設定扱い（完了前に手入力必須）。

**将来拡張**

- Companyエンティティ導入済みで会社設定集約が必要になった段階で `Company.defaultStorageLocationId` に昇格。
- 当面は User単位で実装し、将来は「会社既定 + ユーザー上書き」の2階層へ。

### 2-5. purchaseUnitPrice / plannedSaleUnitPrice の扱い

- STEP2-I時点は両方null許容で進める。
- 原価確定は将来の `PurchaseRecord/PurchaseRecordLine` で行い、
  - `PurchaseRecordLine.unitCost` を正として、入庫済み `InventoryItem` に紐付け反映する設計が安全。
- `LedgerEntry` は会計仕訳・支払実績の管理軸として使い、在庫原価の一次ソースにしない（整合監査には利用）。

### 2-6. source tracking の引継ぎ

- 既存 enum で `InventoryMovementSourceType.DEALING` は存在。
- 推奨：入庫完了movement作成時、
  - `sourceType = schedule.sourceType ?? MANUAL`
  - `sourceId = schedule.sourceId ?? schedule.id`
- DEALING由来は `sourceType=DEALING` にすることで追跡性向上。
- `dedupeKey` は現行の `inbound:{schedule.id}:received` を維持して冪等を担保。

---

## 3. 次に実装するSTEP（提案）

### STEP2-I1（最優先：運用安全化）

- 入庫完了前に `destinationLocationId` 必須化（nullなら完了不可）。
- 自動作成入庫予定に「入庫先未設定」警告表示を明示。
- 入庫予定編集導線を強化し、完了前に倉庫補完させる。

### STEP2-I2（自動補完の導入）

- `User.defaultStorageLocationId` を追加。
- 購入取引→InboundSchedule自動作成時に既定倉庫を補完。
- 既定倉庫が無効/削除された場合のフォールバック（null化＋警告）を実装。

### STEP2-I3（原価・利益管理接続の土台）

- `PurchaseRecord/PurchaseRecordLine` 設計を追加。
- 入庫済在庫への原価反映フロー（後追い確定）を定義。
- `InventoryMovement` と `LedgerEntry` の突合キー（source系）を設計。

### STEP2-I4（source監査性の強化）

- `completeInboundSchedule` / reverse作成時の `movement.sourceType/sourceId` を `InboundSchedule` 由来へ寄せる。
- DEALING由来分析レポート（どの取引からどの在庫が増えたか）を取得可能にする。

---

## 4. リスク・注意点

- 在庫統合を早期導入すると、仕入価格混在により粗利計算が破綻しやすい。
- 入庫先未設定のまま在庫化を許容すると、倉庫別在庫管理・棚卸精度が低下する。
- buyer/seller判定の取り違えは、ownerUserIdの誤りによる重大データ汚染を招く。
- source dedupeの不備は二重在庫計上リスクになる。
- 原価を暫定値で埋めると、将来の会計/利益管理移行時に差分調整コストが増える。

---

## 5. 最終推奨（次に何から実装すべきか）

**最初に着手すべきは STEP2-I1（入庫完了時の入庫先必須化）です。**

理由：

1. データ品質（倉庫別在庫）を即時に守れる。
2. 既存スキーマ・既存業務ルールと整合しやすく、影響範囲が読みやすい。
3. 既定倉庫や原価台帳の導入前でも、運用事故（所在不明在庫）を大幅に減らせる。

次点で STEP2-I2（既定倉庫補完）を入れると、入力負荷を下げつつI1ルールを実運用しやすくできます。
