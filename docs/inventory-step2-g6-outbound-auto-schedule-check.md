# STEP2-G7: 成約由来の発送予定の重複防止をDB制約へ移行

## 今回実装したこと
- `OutboundSchedule` に `sourceType/sourceId/dedupeKey` を追加し、`dedupeKey` を unique 制約化。
- 自動作成は `sourceType=DEALING` / `sourceId=dealingId` / `dedupeKey=outbound-from-dealing:{dealingId}` を保存。
- `createOutboundScheduleFromDealing` の重複防止を `dedupeKey` 優先へ変更し、`P2002` を no-op 扱いに変更。
- `/inventory/outbound` の自動作成判定は `sourceType/sourceId` 優先、`note contains auto-from-dealing:{id}` は後方互換 fallback。

## 自動作成発送予定の判定方法
1. `sourceType === DEALING && sourceId != null` を正式判定。
2. 旧データは `note` の `auto-from-dealing:{id}` を fallback 判定。

## 二重起票防止
- 成約→発送予定は `dedupeKey=outbound-from-dealing:{dealingId}` の unique 制約でDBレベルにて排除。
- 同時実行などで競合した場合も `P2002` を no-op として安全に処理。

## 運用方針
- 手動作成は `sourceType` が `MANUAL` または `null`、`sourceId/dedupeKey` は `null` で運用可能。
- 既存の note 由来判定は移行期間の互換用途として維持。
- 発送完了時の在庫反映ロジック（movement作成と `quantityOnHand` 減算）は変更なし。
