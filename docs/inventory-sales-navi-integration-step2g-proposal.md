# 在庫管理 × 販売管理・取引ナビ 接続設計レビュー（STEP2-G 事前）

## 前提と今回のスコープ
- 本ドキュメントは **実装前の調査・設計提案** のみを目的とする。
- 今回は **schema変更 / migration / 実装 / UI変更** は行わない。
- 対象は既存の `InventoryItem / InventoryMovement / InboundSchedule / OutboundSchedule` と、`Exhibit / Navi / Dealing / LedgerEntry` の接続設計。

---

## 1. 既存モデル整理（販売管理・取引ナビ側）

### 1-1. Exhibit（出品）
- 主キーは `id: String(cuid)`。
- 出品主体は `sellerUserId`。
- 状態は `status: ExhibitStatus`（`DRAFT` 既定）。
- 商材情報は `type / kind / maker / machineName / quantity / unitPriceExclTax / isNegotiable`。
- 物流関連は `storageLocationId / storageLocation(snapshot) / shippingFeeCount / handlingFeeCount / allowPartial / pickupAvailable`。
- 撤去管理は `removalStatus / removalDate`。
- 出品API更新時、**取引が進んだ出品に対する撤去日変更を抑止** している（`Navi`と`Dealing`参照）。

**示唆**
- 在庫→出品の初期連携に必要な必須系は、少なくとも `kind`・`quantity`・`storageLocationId` 周辺。
- `maker / machineName / unitPriceExclTax` は在庫のsnapshot値から埋められる可能性が高い。

### 1-2. Navi（取引ナビ）
- 主キー `id: Int`。
- `ownerUserId`（ナビ作成側）と `buyerUserId`（買い手）が分離。
- `listingId` でExhibitに論理接続。
- `status: NaviStatus`、`naviType: NaviType`、`payload: Json` に明細・配送情報等を保持。
- `trade: Dealing?`（1:1寄り、`Dealing.naviId` 側がunique）。

**示唆**
- 出品成約から発送予定を起票する際、`listingId` 経由連携は可能。
- ただしナビにはJSON payload依存があるため、型保証が弱い項目（配送先/連絡先）は防御的に扱う必要がある。

### 1-3. Dealing（成約・取引）
- 主キー `id: Int`。
- `sellerUserId / buyerUserId` を明示保持。
- `status: DealingStatus`（`APPROVAL_REQUIRED -> PAYMENT_REQUIRED -> CONFIRM_REQUIRED -> COMPLETED`、または`CANCELED`）。
- `paymentAt / completedAt / canceledAt` の時点情報あり。
- `naviId` は `@unique`。

**示唆**
- 「成約判定」は最低でも `PAYMENT_REQUIRED` 以降を候補にできる。
- 「実発送寄りの確定」は `CONFIRM_REQUIRED` 以降、売上確定は `COMPLETED` が妥当。

### 1-4. LedgerEntry（台帳・入出金）
- `tradeId`（Dealing連携）を持つ。
- `category`（PURCHASE/SALE等）、`kind`（PLANNED/ACTUAL）を保持。
- `source` と `tradeStatusAtCreation` を保持。
- `dedupeKey` は unique。
- サーバ実装で `tradeId + category + kind + source` 起点のdedupe運用が実装済み。

**示唆**
- 在庫イベントと同等に、利益管理連携でも dedupe キー設計を合わせるべき。
- 将来の粗利計算で `InventoryMovement` と `LedgerEntry` を突合しやすい。

### 1-5. その他関連モデル
- `User`：`companyName` を持ち、売買当事者判定・取引先表示に利用可能。
- `StorageLocation`：`ownerUserId` とロケーション費用情報を持つ。
- `Maker / MachineModel`：在庫・出品双方の機種正規化候補。
- `OnlineInquiry`：`listingId / buyerUserId / sellerUserId / desiredShipDate` 等を持ち、将来の自動予定生成候補。

---

## 2. 在庫管理側の現状整理

### 2-1. InventoryItem
- 在庫マスタ。`ownerUserId`、`quantityOnHand`、`inventoryStatus`、`listingStatus`、価格スナップショット（仕入/販売予定）を保持。
- `makerId / machineModelId` 参照と `makerNameSnapshot / modelNameSnapshot` を併用。
- `storageLocationId` を保持。

### 2-2. InventoryMovement
- 数量履歴の中核。`movementType`、`quantityDelta`、`committedAt`、`sourceType/sourceId/dedupeKey` を持つ。
- `dedupeKey` unique 実装済み。
- 取消時は reverse movement（ADJUSTMENT）作成で戻す運用が既にある。

### 2-3. InboundSchedule
- 入庫予定。`expectedDate / supplierName / quantity / destinationLocationId / status` 等。
- 完了で `INBOUND movement` を作成し在庫加算。
- 未紐付け時は完了時に `InventoryItem` 新規作成する実装。

### 2-4. OutboundSchedule
- 発送予定。`expectedDate / buyerName / shippingMethod / quantity / originLocationId / status` 等。
- 完了で `OUTBOUND movement` を作成し在庫減算。
- 取消時のreverse movementまで実装済み。

---

## 3. 接続ポイント案

### 3-1. Inventory → Exhibit
**やりたいこと**
- 在庫詳細から出品フォームへ遷移時、初期値プリセット。
- 出品作成後に在庫との関連を保存。

**引き継ぎ可能項目（高）**
- `itemType -> Exhibit.type`
- `modelNameSnapshot -> machineName`
- `makerNameSnapshot or maker.name -> maker`
- `quantityOnHand -> quantity`（上限制御あり）
- `plannedSaleUnitPrice -> unitPriceExclTax`
- `storageLocationId`
- `frameColor / note`（noteの一部として）

**不足しやすい項目**
- `kind`（出品フォームで必須寄り）
- `isNegotiable`
- `shippingFeeCount / handlingFeeCount / allowPartial`
- `removalStatus / removalDate`

**紐付け方式の推奨**
- `InventoryItem.exhibitId` 直持ちは避け、**リンクモデル（例: InventoryExternalLink）** を推奨。
- 理由: 1在庫→複数出品（再出品、分割出品、期間違い）や将来外部チャネル連携に耐えやすい。

### 3-2. Exhibit / Dealing / Navi → OutboundSchedule
**候補タイミング比較**
1. 成約時（Dealing `PAYMENT_REQUIRED` 到達）
   - 早く見える化できるが、配送条件未確定リスクあり。
2. 発送方法確定時（Navi payload shipping充足）
   - 実務に近い。推奨。
3. ナビ開始時
   - 早すぎてノイズ多い。
4. 決済完了時（`CONFIRM_REQUIRED` or `COMPLETED`）
   - 確実だが遅い。

**推奨**
- 初期は「`PAYMENT_REQUIRED` 以降かつ配送情報が必要条件を満たした時」に `OutboundSchedule(PLANNED)` 起票。
- 発送情報更新は既存scheduleを更新（再作成しない）。
- 出荷実績確定時のみ `completeOutboundSchedule` 経由で movement を発生。

**販売先・配送項目マッピング案**
- `buyerName` <- `buyerUser.companyName`（fallback: payloadの宛名）
- `expectedDate` <- `desiredShipDate`（Navi/OnlineInquiry payload）なければnull不可なので業務デフォルト日
- `shippingMethod` <- payload shipping methodマップ（未定時は`OTHER`）

### 3-3. Dealing / Navi → InboundSchedule（自社購入）
**判定案**
- 自社（current user）が `buyerUserId` のDealingを「購入側」と判定。
- NaviのみでDealing未生成の場合は、原則起票しない（誤検知防止）。

**入庫予定起票タイミング**
- `PAYMENT_REQUIRED` 到達時に `PLANNED` 作成（早期可視化）。
- 到着予定日は `desiredShipDate` or payloadの配送見込み日を候補。

**入庫先決定**
- 優先順位: ①ユーザー既定倉庫（将来） ②在庫側で選択必須 ③暫定手動選択。
- 自動決定が不十分な間は、下書き状態で担当者補完できる設計が安全。

### 3-4. InventoryMovement / LedgerEntry → 利益管理
- 現時点で `InventoryItem.purchaseUnitPrice` と `plannedSaleUnitPrice` から概算粗利は表示可能。
- 実績粗利は将来的に
  - 売上: `LedgerEntry(SALE, ACTUAL)`
  - 仕入: `LedgerEntry(PURCHASE, ACTUAL)`
  - 物流費/手数料: まずは `LedgerEntry` の `breakdown` or 独立費用レコード
 で集約。
- 初期段階は **InventoryItem単位の概算粗利 + trade紐づき実績金額参照** で十分。

---

## 4. 推奨DB設計（段階導入）

### 4-1. 最小構成（STEP2-Gで先行）
1. `InventoryExternalLink`（推奨）
- 目的: 在庫と外部ドメイン（Exhibit/Navi/Dealing）を疎結合で接続。
- 想定カラム
  - `id`
  - `ownerUserId`
  - `inventoryItemId`
  - `linkType`（EXHIBIT / NAVI / DEALING / ONLINE_INQUIRY）
  - `externalId`（String化して保持）
  - `relationRole`（SOURCE / DESTINATION など任意）
  - `syncStatus`（ACTIVE / STALE / ERROR）
  - `createdAt / updatedAt`
- 制約
  - `unique(ownerUserId, linkType, externalId, relationRole)`
  - index(`inventoryItemId, linkType`)

2. `dedupeKey`方針統一
- 予定作成系は `outbound-from-dealing:{dealingId}` / `inbound-from-dealing:{dealingId}` のように deterministic 化。

### 4-2. 拡張構成（将来）
- `InventorySyncEvent`
  - 外部イベント受信・反映履歴（idempotency, retry, エラー追跡）。
- `InventoryTradeLink`
  - 取引ベース集約リンク（1取引に複数在庫をぶら下げる用途）。
- `PurchaseRecord / SalesRecord`
  - 利益計算を在庫粒度で厳密化する段階で導入。

---

## 5. 推奨実装順序（段階的）

### STEP2-G1
- `InventoryExternalLink` 追加。
- 在庫詳細→出品フォーム遷移時に初期値引継ぎ（URLパラメータ or server action入力）。

### STEP2-G2
- 出品作成後、`InventoryItem` と `Exhibit` をリンク登録。
- `InventoryItem.listingStatus` を同期（NOT_LISTED→LISTED）する最小反映。

### STEP2-G3
- `Dealing/Navi` の成約・配送条件を監視し `OutboundSchedule` 自動作成。
- dedupeで二重起票防止。

### STEP2-G4
- 自社が買い手の `Dealing` から `InboundSchedule` 自動作成。
- 入庫先未決定ケースの補完フローを追加。

### STEP2-G5
- `LedgerEntry` と在庫情報の突合で初期利益集計（概算→実績の2レイヤ）。

---

## 6. リスク・注意点
- 本番DB影響: 既存運用中の `Navi/Dealing` を直接更新する同期ロジックは影響範囲大。段階導入必須。
- ステータス解釈ズレ: `NaviStatus` と `DealingStatus` の意味を混同すると誤起票の温床。
- buyer/seller判定ミス: 自社ロール判定を `buyerUserId / sellerUserId` で一元化すべき。
- 二重起票: schedule生成、movement生成、ledger生成すべてdedupe設計を揃える。
- 在庫数量二重反映: 「予定作成時は数量変えない、完了時のみmovement」で統一。
- 取消/キャンセル: 既存reverse movement思想に合わせ、外部イベント取消も逆操作で扱う。
- 既存データ移行: 既存Exhibit/Dealingに対する初期リンク貼り（バックフィル）方針が必要。

---

## 7. 次に実装するなら何から始めるべきか
**最優先は STEP2-G1（InventoryExternalLink 導入 + 在庫→出品初期値引継ぎ）**。

理由:
1. 既存業務フローを壊さず、接続基盤だけ先に作れる。
2. 以降のOutbound/Inbound自動起票の参照キーが安定する。
3. 二重反映防止（dedupe, source追跡）を最初に設計へ織り込める。

---

## 調査で残った不明点（実装前に要確認）
1. 出品フォームで `kind` を在庫から自動決定できる業務ルールの有無。
2. `shippingMethod` の正規マッピング元（Navi payload内の実フィールド名）。
3. 購入取引の「入庫予定日」確定ルール（desiredShipDateベースか、別項目か）。
4. 1取引で複数在庫を扱うケースの最小要件（分割発送・分割入庫）。
5. 既存運用データへのバックフィル対象範囲（いつ以降の取引をリンクするか）。
