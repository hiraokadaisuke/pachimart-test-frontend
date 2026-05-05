# STEP2-G6: 自動作成された発送予定の運用検証メモ

## 今回実装したこと
- `/inventory/outbound` 一覧で、`note` に `auto-from-dealing:{id}` を含む発送予定へ「パチマート成約から自動作成」バッジを表示。
- 同時に `Dealing ID` を表示して由来を追跡しやすくした。
- 自動作成判定を `getAutoCreatedOutboundInfo(note)` に共通化し、一覧表示と自動作成ロジックで使い回せる形にした。
- `createOutboundScheduleFromDealing` 側の note トークンを `buildAutoFromDealingNoteToken(dealingId)` で生成統一した。
- 二重作成チェック条件を `ownerUserId + inventoryItemId + note contains auto-from-dealing:{id}` に補強した。

## 自動作成発送予定の判定方法
- 正式な判定は `note` 文字列内に `auto-from-dealing:{number}` が存在するかどうか。
- 解析は `src/features/inventory/outbound-auto.ts` の helper に集約。

## 発送完了時の在庫反映（既存仕様の確認）
- 自動作成時点では `OutboundSchedule.status = PLANNED` のみ作成し、在庫数量は動かさない。
- `completeOutboundSchedule` 実行時にのみ `InventoryMovement(OUTBOUND/COMMITTED, quantityDelta=-quantity)` を作成。
- 同時に `InventoryItem.quantityOnHand` を減算し、0 なら `inventoryStatus = SOLD`・`listingStatus = CONTRACTED` に更新。
- `OutboundSchedule.status` は `SHIPPED` へ更新。
- `dedupeKey=outbound:{scheduleId}:shipped` により完了処理の二重実行を抑止。

## 現状の二重作成防止
- 成約→発送予定自動作成では、既存レコードの存在確認として
  `ownerUserId + inventoryItemId + note contains auto-from-dealing:{dealingId}` を使用。

## note contains 方式の限界
- `note` 編集によりトークンが消えると再作成防止が機能しなくなる。
- `contains` 検索はDBの厳密 unique 制約ではなく、完全な重複排除を保証しない。
- 文字列規約に依存するため、フォーマットの揺れや将来変更に弱い。

## 次STEPで検討すべき内容
- `OutboundSchedule` に `sourceType/sourceId/dedupeKey`（または同等）カラムを追加し、DB制約ベースで重複防止する。
- 特に `dedupeKey` の unique 制約で「dealingごとに1件」の不変条件を明示化する。

## 今回 schema/migration を変更しなかった理由
- STEP2-G6 の目的は運用検証と最小限補強であり、大きなデータモデル変更は次ステップへ分離する方針。
- 既存運用との互換性を保ったまま、UI可視化・helper共通化・検索条件補強を優先した。
