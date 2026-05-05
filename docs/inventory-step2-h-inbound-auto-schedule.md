# STEP2-H: 購入取引からの入庫予定自動作成

## 全体像

- seller側では成約時に `OutboundSchedule` を自動作成する。
- buyer側では購入取引時に `InboundSchedule` を自動作成する。
- これにより取引ナビ/成約情報から倉庫側の予定を起票し、二重入力を減らす。

## source追跡カラム

`InboundSchedule` に以下を追加した。

- `sourceType`: 自動作成元の分類 (`DEALING` など)
- `sourceId`: 元データID (dealing id 文字列)
- `dedupeKey`: 同一取引の二重起票防止キー

`dedupeKey` は `inbound-from-dealing:{dealingId}` 形式で保存し、unique 制約で重複作成を防ぐ。

## ownerUserId の考え方

- buyer側に入る予定なので `InboundSchedule.ownerUserId = dealing.buyerUserId`。
- seller側は従来通り `OutboundSchedule.ownerUserId = dealing.sellerUserId`。

## 在庫数量を増やすタイミング

- 購入成立時点では `InboundSchedule (PLANNED)` のみを作る。
- この時点では `InventoryMovement` を作らない。
- この時点では `quantityOnHand` を増やさない。
- 在庫増加は既存仕様通り「入庫完了」ボタン実行時にのみ行う。

## destinationLocationId の扱い

- 現時点では自動決定できないため `destinationLocationId = null` を許容。
- noteには「入庫先未設定」を残す。
- 将来拡張としてユーザー既定倉庫設定を検討する。
