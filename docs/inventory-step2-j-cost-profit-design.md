# 在庫管理 STEP2-J: 購入原価・販売価格・利益管理の入口設計

## 1. 既存モデル調査結果

### 1-1. Prisma上の実データモデル
- `InventoryItem` は `purchaseUnitPrice` と `plannedSaleUnitPrice` をすでに保持できる。どちらも任意（nullable）で、在庫単位での手入力保持に向いた最小構成。  
- `OutboundSchedule` / `InboundSchedule` / `InventoryMovement` は数量・予定・実績のトラッキングに特化し、価格カラムを持たない。  
- `Exhibit` は `unitPriceExclTax`（税抜単価）を持ち、出品価格ソースとして扱える。  
- `Dealing` は取引ステータス管理が主責務で、金額専用カラムを持たず `payload` に依存する構造。  
- `LedgerEntry` は `category`（PURCHASE/SALE/DEPOSIT/WITHDRAWAL）、`kind`（PLANNED/ACTUAL）、`amountYen`、`tradeId`、`source`、`dedupeKey` を持つ入出金台帳モデル。会計仕訳というより「取引状態遷移＋手動補正の資金記録」に近い。  
- Prisma schema内に `Payment` / `Transaction` / `SalesRecord` / `PurchaseRecord` モデルは未定義。

### 1-2. 既存コード上の実態（画面・ローカルデータ含む）
- `LedgerEntry` は API (`/api/ledger`) と server utility で運用され、`Dealing` 状態遷移時に planned/actual エントリを自動生成する設計。  
- `src/lib/balance/ledger.ts` はフロント向け台帳型で、`Payment` 専用ドメインモデルではない。  
- `sales` 配下には販売管理UIがあり、`SalesInvoice` 型と localStorage 永続（seedマージ）で運用される伝票群が存在する。DB永続の業務伝票モデルではない。  
- `purchase-invoices` / `sales-invoice` 画面は存在するが、現状は在庫原価計算の一次ソースとして一貫して参照できる状態ではない。

### 1-3. 責務整理（現状）
- 数量系（在庫実体）: `InventoryItem` / `InventoryMovement` / `InboundSchedule` / `OutboundSchedule`。
- 価格・取引系（不完全）: `Exhibit.unitPriceExclTax`、`Dealing.payload`、`LedgerEntry.amountYen`、sales系ローカル伝票。
- 現時点では「在庫原価の正本（single source of truth）」が未確立。

---

## 2. 購入原価の推奨設計

### MVP推奨（STEP2-J段階）
**方針D寄り（D + A）**: まず `InventoryItem.purchaseUnitPrice` を一次入力点にする。  
- 原価未入力でも数量運用は止めない（nullable維持）。
- 入力責任を在庫作成/編集時に明示。
- 仕入送料・手数料・その他費用は当面「取引単位費用」として別入力（将来モデル化前提）し、在庫原価に直加算しない。

### 将来推奨
**方針Bへ昇格**: `PurchaseRecord` / `PurchaseRecordLine` を導入し、`InventoryItem.purchaseUnitPrice` はキャッシュ/スナップショット化。  
- 1取引複数明細（複数機種・複数台）を line で表現。
- 送料/手数料/その他費用を header で保持し、按分ルール（数量按分・金額按分・固定配賦）を line に反映できる構成。
- `InventoryExternalLink` で `PURCHASE_RECORD_LINE` への関連を持たせ、在庫↔原価明細のトレーサビリティを確保。

### なぜこの方針か
- いきなりBを実装するとスキーマ変更・既存業務フロー改修が大きい。
- A単独のままでは費用配賦と監査性が弱い。
- D→Bの段階移行なら、MVPで入力開始しつつ将来の正確粗利へ無理なく接続できる。

---

## 3. 販売価格の推奨設計

### MVP推奨
**A + B + Dの組み合わせ**  
- 予定販売価格: `InventoryItem.plannedSaleUnitPrice` または `Exhibit.unitPriceExclTax` を参照。
- 実売価格: `Dealing` の実取引値（現状は `payload`/statement total）を参照。
- `OutboundSchedule` には価格を持たせない（数量責務を維持）。

### 将来推奨
**Cへ昇格**: `SalesRecord` / `SalesRecordLine` を導入。  
- ヘッダで販売先・成約日・入金予定/状態・費用保持。
- lineで `InventoryItem` / `Exhibit` / `Dealing` 参照を持たせる。
- 値引き、送料負担、手数料控除を line or header 調整項目として明示化。

### Dealing / Exhibitとの関係
- `Exhibit` は「売りたい価格（オファー）」。
- `Dealing` は「売れた取引コンテキスト」。
- `SalesRecord` は「確定売上伝票（監査対象）」として責務分離するのが望ましい。

---

## 4. PurchaseRecord / SalesRecord の必要性

### 結論
- **必要**。ただし即時フル実装ではなく段階導入。

### いつ作るべきか
- `InventoryItem` で原価入力運用を開始し、運用データで必須項目を確定した次段階（STEP2-J2）で最小モデル導入。

### 最小モデル案（初期）
- `PurchaseRecord`: `id`, `ownerUserId`, `counterpartyName`, `recordDate`, `status`, `shippingFee`, `handlingFee`, `otherCost`, `memo`。
- `PurchaseRecordLine`: `id`, `purchaseRecordId`, `inventoryItemId?`, `maker/model snapshot`, `quantity`, `unitCost`, `lineAmount`。
- `SalesRecord`: `id`, `ownerUserId`, `counterpartyName`, `contractDate`, `paymentDueDate?`, `paymentStatus`, `shippingFee`, `handlingFee`, `otherCost`, `memo`。
- `SalesRecordLine`: `id`, `salesRecordId`, `inventoryItemId?`, `exhibitId?`, `dealingId?`, `quantity`, `unitPrice`, `lineAmount`。

### InventoryExternalLinkとの連携
- `linkType` 拡張で record/line を参照可能にし、既存の在庫↔外部エンティティ連結パターンを再利用。

---

## 5. 粗利計算方針

### MVPで出せる粗利（簡易）
- 在庫単位粗利（見込み）:  
  `plannedSaleUnitPrice - purchaseUnitPrice`。
- 取引単位粗利（簡易）:  
  `dealing実売合計 - 対応inventory原価合計`（費用は別表示または0扱い）。

### 将来の正確粗利
- 取引粗利:  
  `売上 - 仕入原価 - 送料 - 手数料 - その他費用`。
- 粗利率:  
  `粗利 / 売上`。
- 複数台・一部販売時は line 単位で数量対応し、配賦済み費用を合算。

### 税/送料/手数料の扱い
- 初期ルール: 税抜基準で統一（`unitPriceExclTax` と整合）。
- 税込入力が来る場合は入力時点で税抜/税込フラグを保持し、表示層で変換。
- 送料/手数料は header費用として保持し、明細按分ルールを明示（既定: 数量按分）。

---

## 6. 画面案

### 最初に作るべき画面
1. **在庫詳細（既存 `/inventory/items/[id]`）の利益見込みカード強化**  
   - 仕入単価、予定売価、見込み粗利、見込み粗利率。
2. **一覧型 `/inventory/profit`（新規）**  
   - 在庫単位の見込み粗利を俯瞰。営業デモで価値が伝わりやすい。

### 将来追加する画面
- `/inventory/purchases`: 購入伝票管理（header + line + 支払状態）。
- `/inventory/sales`: 販売伝票管理（header + line + 入金状態）。
- `Dealing詳細`: 成約価格、費用、粗利、入出金突合ステータス。

### Excel UI「販売管理」領域との対応
- 伝票一覧（購入/販売）= `/inventory/purchases` と `/inventory/sales`。
- 収益管理表 = `/inventory/profit`。
- 取引詳細 = Dealing詳細拡張。

---

## 7. 実装順序案

### STEP2-J1（最小価値）
- `InventoryItem.purchaseUnitPrice` / `plannedSaleUnitPrice` の入力導線強化。
- 在庫詳細に簡易粗利（見込み）表示。

### STEP2-J2（伝票の入口）
- `PurchaseRecord` / `SalesRecord` 最小モデル導入。
- 手入力伝票登録（header + line）を追加。

### STEP2-J3（自動連携）
- `Dealing` 成約から `SalesRecord` 自動生成。
- 購入Dealing（または相当イベント）から `PurchaseRecord` 自動生成。
- `InventoryExternalLink` で相互紐付け。

### STEP2-J4（資金実績突合）
- `LedgerEntry` / 将来 `Payment`（または既存入出金機能）と伝票突合。
- planned/actual差分、未入金・未払いの可視化。

---

## 8. リスク・注意点

- 原価確定タイミング（入庫時/検収時/請求確定時）を業務定義しないと数字がぶれる。
- 同一在庫カテゴリで仕入単価混在時、平均原価か個別原価かを先に決める必要がある。
- 送料按分ルールが曖昧だと粗利再計算で差異が発生する。
- 税込/税抜混在は表示・計算の不整合を生むため、基準通貨・税区分を固定する必要。
- `Dealing`価格と実入金額（振込手数料控除など）の差異管理は `LedgerEntry` 側だけでは不足しうる。
- 支払/入金状態と在庫移動状態は非同期なため、状態遷移を独立管理する必要がある。

---

## 9. 最終推奨（次に実装するなら）

**最優先は STEP2-J1**。  
理由: スキーマ追加なしで現行資産を活用し、在庫単位の見込み粗利を即時に可視化できるため。  
具体的には、`InventoryItem.purchaseUnitPrice` と `plannedSaleUnitPrice` の入力品質を上げ、在庫詳細/一覧で「見込み粗利・粗利率」を表示する。これが営業デモ価値と将来の伝票モデル導入の両方に直結する。

その後、実運用で出る費用・按分パターンを踏まえて STEP2-J2 の `PurchaseRecord/SalesRecord` 最小導入に進むのが安全。
