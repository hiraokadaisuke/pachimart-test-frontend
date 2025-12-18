# Todo.kind 対応表（本番 Rails 基準）

## 目的と前提
- 本番パチマート（Rails）の Todo / AASM の考え方を基準に、Next.js テスト実装での `Todo.kind` 対応を一覧化する。
- 今後のフロー変更は「本番からの差分」として追記しやすいよう、コアと拡張 (x_ prefix) を分けて記載する。
- 本番と Next.js の命名差分がある場合も、`todoKinds.prod.ts` の値を正として揃える。

## UI の起点は TodoList.kind
- 画面に表示するセクション・説明文・次アクションは `todoUiMap` が参照する `Todo.kind` を起点に決まる。
- `todoKinds.prod.ts` で定義された本番コア kind を基準に UI を組み立て、`todoKinds.ext.ts` の拡張はテスト用途として切り出す。

## Dealing の enum は内部状態（UI 直参照しない）
- 取引状態は `TradeStatus`（例: `APPROVAL_REQUIRED`）として保持し、UI はステータスから Todo に写像して表示する。
- `TradeStatus → Todo.kind` は `STATUS_TO_TODO_KIND`、逆写像は `TODO_KIND_TO_STATUS` で管理する。UI 文言は Todo 側でのみ管理し、Dealing enum には直接バインドしない。

## AASM イベント → after hook → Todo 生成/更新
- 本番 Rails では AASM イベント発火後に after hook で Todo を生成・更新する想定。
- Next.js テスト実装では `completeTodo` の結果を元に次の Todo を追加し、`deriveStatusFromTodos` でステータスを再計算している。AASM イベント名は推測ベースで記載する。

## Todo.kind 一覧（本番コア）
- `application_sent` — 購入申請への回答待ち（承認待ち）
- `application_approved` — 入金完了報告（入金待ち）
- `payment_confirmed` — 動作確認（確認待ち）
- `trade_completed` — 完了
- `trade_canceled` — キャンセル

## 対応表（メイン）
| kind 名（本番同名） | 画面セクション | 誰のタスクか | ユーザーに見せる説明 (buyer / seller) | 主ボタン (文言) | 押したら起きること（本番: AASM イベント, Next.js: nextTodo） | 関連しそうな Dealing enum（候補） |
| --- | --- | --- | --- | --- | --- | --- |
| `application_sent` | 承認待ち (`approval`) | buyer（買主が承認） | buyer: 依頼内容を確認して承認する。<br>seller: 承認を待つ。 | "承認" （買主側のみ） | 本番: `approve_application`? （TBD）<br>Next.js: `nextTodo = application_approved` | `TradeStatus.APPROVAL_REQUIRED`（申請中） |
| `application_approved` | 入金待ち (`payment`) | buyer（買主が入金） | buyer: 振込を実施する。<br>seller: 入金を待つ。 | "入金完了" （買主側のみ） | 本番: `confirm_payment`? （TBD）<br>Next.js: `nextTodo = payment_confirmed` | `TradeStatus.PAYMENT_REQUIRED`（入金待ち） |
| `payment_confirmed` | 確認待ち (`confirmation`) | buyer（買主が確認） | buyer: 動作確認後に完了する。<br>seller: 買主の確認を待つ。 | "確認完了" （買主側のみ） | 本番: `complete_confirmation`? （TBD）<br>Next.js: `nextTodo = trade_completed` | `TradeStatus.CONFIRM_REQUIRED`（確認待ち） |
| `trade_completed` | 完了 (`completed`) | 双方表示（タスクなし / デフォルト assignee は buyer） | buyer & seller: 取引完了通知のみ。 | なし | 本番: after hook で完了状態のまま。<br>Next.js: 次 Todo なし | `TradeStatus.COMPLETED` |
| `trade_canceled` | キャンセル (`canceled`) | 双方表示（タスクなし / デフォルト assignee は buyer） | buyer & seller: キャンセル済み。 | なし | 本番: `cancel_trade`? （TBD）<br>Next.js: 次 Todo なし（既存 Todo を done にして追加） | `TradeStatus.CANCELED` |

## テスト拡張（x_ prefix）
| kind 名 | 本番にはない理由 | いつ消す/戻すか |
| --- | --- | --- |
| `x_test_shipping_address_fix` | テスト環境で配送先住所の確認・修正フローを入れるための UI 拡張。 | 本番の配送先編集フローを AASM + Todo で実装・検証できた段階で削除予定。 |

## 更新ルール
- 本番コアの kind は `todoKinds.prod.ts` を基準にし、名前は原則変更しない。
- テスト都合の追加は `todoKinds.ext.ts` に追加し、`docs/todo_mapping.md` と `docs/todo_diff.md`（任意）に追記する。
- UI の文言・セクション変更は `todoUiMap.ts` を編集し、docs では概要のみを反映する。
