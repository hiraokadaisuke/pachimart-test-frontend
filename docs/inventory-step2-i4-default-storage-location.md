# 在庫管理 STEP2-I4: 既定倉庫の自動補完

## 概要
- `User.defaultStorageLocationId` を追加し、ユーザー単位で既定倉庫を保持する。
- 購入取引 (`Dealing`) から `InboundSchedule` を自動作成する際、`buyerUser.defaultStorageLocationId` を `destinationLocationId` に自動補完する。
- 既定倉庫未設定の場合は従来通り `destinationLocationId = null` とし、手動設定を必要とする。

## User 単位で採用した理由
- 実運用では同一 Company 内でも担当者・拠点ごとに主利用倉庫が異なる。
- STEP2 時点では最小実装を優先し、設定/権限の影響範囲を「ログインユーザー」に閉じることで安全に導入できる。
- 既存の `StorageLocation.ownerUserId` と整合しやすく、他ユーザー倉庫の誤設定を防止しやすい。

## Company 単位を採用しなかった理由
- Company 既定値は組織権限・上書き優先順位（Company > User）設計が必要になり、今回のスコープを超える。
- 現行課題は「入庫先 null を減らす」ことなので、まずは User 既定値で効果を得る。

## 自動補完の挙動
- `createInboundScheduleFromDealing` 実行時に buyer ユーザーを参照する。
- `defaultStorageLocationId` があれば `destinationLocationId` に設定し、note に `既定倉庫を入庫先に自動設定` を残す。
- 未設定なら note に `入庫先未設定` を残し、従来通り未設定バッジ/未設定フィルタの対象とする。
- 自動補完後も編集画面で入庫先変更は可能。
- 入庫完了時の destination 必須バリデーションは従来通り維持する。

## 将来拡張
- 将来的には `Company.defaultStorageLocationId` を追加し、
  - Company 既定値
  - User 既定値（上書き）
  の二段階解決へ拡張可能。
