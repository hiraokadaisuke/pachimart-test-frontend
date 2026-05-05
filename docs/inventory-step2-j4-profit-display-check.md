# 在庫管理 STEP2-J4: 利益表示 確認チェックリスト

## 目的
- 新機能追加ではなく、既存の「見込み粗利」表示ロジックの確認観点を固定化し、回帰（将来の壊れ）を防ぐ。
- `/inventory/items` 一覧、`/inventory/items/[id]` 詳細、`/inventory/items/[id]/edit` での価格入力導線を含め、表示と計算の期待値を共通化する。

## 対象画面・対象実装
- 画面
  - `/inventory/items`（一覧の粗利ミニ表示）
  - `/inventory/items/[id]`（詳細の粗利サマリー表示）
  - `/inventory/items/[id]/edit`（価格入力の更新導線）
- 関数 / コンポーネント
  - `calculateProjectedProfit`
  - `InventoryProfitSummary`
  - `InventoryProfitMini`

## 計算ルール（現行仕様の固定化）

### 1) 入力有無判定
- `hasPurchasePrice = purchaseUnitPrice != null`
- `hasPlannedSalePrice = plannedSaleUnitPrice != null`
- `hasQuantity = quantity > 0`

### 2) missingReason 判定優先順位
以下の順で最初に該当したものを採用する（上が優先）。
1. 両価格未入力: `MISSING_BOTH_PRICES`
2. 原価未入力: `MISSING_PURCHASE_PRICE`
3. 販売予定価格未入力: `MISSING_PLANNED_SALE_PRICE`
4. 数量0以下: `NO_QUANTITY`
5. 販売予定価格が0円: `NO_REVENUE`
6. 上記以外: `NONE`

### 3) 見込み値の算出
- `projectedRevenue = plannedSaleUnitPrice * quantity`（販売予定価格が入力されている場合のみ）
- `projectedCost = purchaseUnitPrice * quantity`（原価が入力されている場合のみ）
- `canCalculate = hasPurchasePrice && hasPlannedSalePrice && hasQuantity`
- `projectedProfit = projectedRevenue - projectedCost`（`canCalculate === true` の場合のみ）
- `projectedProfitRate = round((projectedProfit / projectedRevenue) * 100, 小数1桁)`
  - 実装上は `Math.round(x * 1000) / 10`
  - `projectedRevenue > 0` の場合のみ算出

### 4) 表示ルール（要点）
- 一覧ミニ（`InventoryProfitMini`）
  - `projectedProfit != null` の場合は粗利金額表示。
  - それ以外は `missingReason` に応じた短いラベル表示。
- 詳細サマリー（`InventoryProfitSummary`）
  - `projectedProfit` / `projectedProfitRate` が取れない場合はプレースホルダとガイダンスを表示。
  - `missingReason` に応じてメッセージを切り替える。

## missingReason 一覧
- `MISSING_PURCHASE_PRICE`: 原価未入力
- `MISSING_PLANNED_SALE_PRICE`: 販売予定価格未入力
- `MISSING_BOTH_PRICES`: 原価・販売予定価格とも未入力
- `NO_QUANTITY`: 数量0以下
- `NO_REVENUE`: 販売予定価格0円
- `NONE`: 欠損理由なし（通常計算可能）

## 表示期待値チェック（確認ケース）

| ケース | 入力例（原価 / 販売予定 / 数量） | missingReason | 一覧 `/inventory/items`（Mini） | 詳細 `/inventory/items/[id]`（Summary） |
|---|---:|---|---|---|
| 原価未入力 | `null / 12000 / 2` | `MISSING_PURCHASE_PRICE` | `原価未入力` | 見込み原価=`原価未入力`、見込み粗利=`価格入力で表示`、見込み粗利率=`-`、ガイダンス=`原価を入力してください` |
| 販売予定価格未入力 | `8000 / null / 2` | `MISSING_PLANNED_SALE_PRICE` | `販売予定未入力` | 見込み売上=`販売予定価格未入力`、見込み粗利=`価格入力で表示`、見込み粗利率=`-`、ガイダンス=`販売予定価格を入力してください` |
| 両方未入力 | `null / null / 2` | `MISSING_BOTH_PRICES` | `価格未入力` | 売上/原価とも未入力表示、見込み粗利=`価格入力で表示`、見込み粗利率=`-`、ガイダンス=`原価と販売予定価格を入力してください` |
| 数量0 | `8000 / 12000 / 0` | `NO_QUANTITY` | `数量なし` | 売上=`¥0`、原価=`¥0`、見込み粗利=`価格入力で表示`、粗利率=`-`、ガイダンス=`在庫数がないため計算できません` |
| 販売予定価格0 | `8000 / 0 / 2` | `NO_REVENUE` | `¥-16,000`（粗利は金額表示） | 見込み粗利=`¥-16,000`、見込み粗利率=`-`、ガイダンス=`販売予定価格が0円のため粗利率を表示できません` |
| 価格入力済み（通常） | `8000 / 12000 / 2` | `NONE` | `¥8,000` | 見込み売上=`¥24,000`、見込み原価=`¥16,000`、見込み粗利=`¥8,000`、見込み粗利率=`33.3%` |
| 粗利マイナス | `12000 / 10000 / 2` | `NONE` | `¥-4,000` | 見込み粗利=`¥-4,000`、見込み粗利率=`-20%` |
| 粗利率0% | `10000 / 10000 / 2` | `NONE` | `¥0` | 見込み粗利=`¥0`、見込み粗利率=`0%` |
| 粗利率100%に近い | `1 / 10000 / 1` | `NONE` | `¥9,999` | 見込み粗利率=`100%`（四捨五入により100.0%表示） |

> 注記1: `NO_REVENUE` でも `canCalculate === true` のため、粗利「金額」は表示される。表示不可なのは粗利率のみ。  
> 注記2: 表示書式（`¥`、桁区切り、丸め）は `formatCurrency` および実装側の丸めに従う。

## 手動確認手順
1. `npm run dev` でアプリを起動。
2. `/inventory/items` を開き、対象在庫のミニ表示がケース表どおりか確認。
3. 同じ在庫の `/inventory/items/[id]` を開き、サマリー表示（売上/原価/粗利/粗利率/ガイダンス）を確認。
4. `/inventory/items/[id]/edit` で原価・販売予定価格・数量（必要なら編集可能な導線）を更新し、詳細へ戻って再確認。
5. 各ケースで `missingReason` に対応した文言が出ることを確認。
6. 境界値として以下も確認。
   - `quantity = 0`
   - `plannedSaleUnitPrice = 0`
   - 原価/売価が同値（粗利0）
   - 極端に粗利率が高い値（100%付近）

## 将来の自動テスト候補（軽量）

### A. 単体テスト（最優先）
- 対象: `calculateProjectedProfit`
- 目的: `missingReason` 判定順序・利益率丸め・`NO_REVENUE` の扱い固定化
- ケース（最小）
  - 本ドキュメントの9ケースをそのままテーブル駆動化
  - 期待値: `missingReason`, `canCalculate`, `projectedRevenue`, `projectedCost`, `projectedProfit`, `projectedProfitRate`

### B. コンポーネントテスト
- 対象: `InventoryProfitMini`, `InventoryProfitSummary`
- 目的: `missingReason` ごとの表示文言・プレースホルダ・ガイダンス確認
- 期待値
  - Mini: 粗利ありは金額、粗利なしは短ラベル
  - Summary: メッセージマップどおりの文言表示

### C. 画面スモーク（任意）
- 対象: `/inventory/items`, `/inventory/items/[id]`
- 目的: 主要表示崩れの早期検知
- 内容
  - 固定seedデータで1〜2ケースのみ（通常ケース + 欠損ケース）を確認

## 今回やらないこと（スコープ外の明示）
- schema変更
- migration
- UI変更
- `PurchaseRecord` / `SalesRecord`
- `LedgerEntry` 連携
- 実粗利計算
- CSV / QR / 棚卸
- prod migration実行
