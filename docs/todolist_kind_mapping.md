# TodoList.kind 対応表（本番Rails ⇄ テストNext.js）

## 目的
本ドキュメントは、パチマート本番（Rails）の「TodoList.kind 駆動UI」の考え方を基準に、
テスト用パチマート（Next.js）を同じ思考モデルで設計・実装するための対応表です。

- 本番Rails：Dealingの複数enum + AASMイベント → afterフックで TodoList を生成/更新
- フロントUI：Dealing enum を直接見るのではなく **TodoList.kind（今やること）** を起点に表示・操作を決定する

テストNext.jsも同様に、
- 取引（TradeRecord）が `todos[]` を持つ
- 進行中一覧や詳細画面は **Todo.kind** を起点に表示・ボタン・遷移を決める
- TradeStatus（単一ステータス）が必要な場合は **todosから派生する補助情報**として扱う

---

## 更新ルール（重要）
1. **本番コア TodoKind** は `src/lib/todo/todoKinds.prod.ts` を正とし、原則として名称変更しない
2. テスト都合の追加は `src/lib/todo/todoKinds.ext.ts` に `x_` prefix 付きで追加し、差分として管理する
3. UI文言・ボタン文言・セクション分類は `src/lib/todo/todoUiMap.ts` に集約し、画面側へ直書きしない
4. 本番Rails側の enum / AASMイベント名は、ソース確認が取れるまで **候補 / TBD** として扱う

---

## 用語
- **Todo.kind**：ユーザーに提示される「今やるべきこと（タスク種別）」のキー
- **Assignee**：そのTodoを実行すべき主体（buyer / seller）
- **Primary Action**：UI上の主ボタン（このTodoを進める操作）
- **Next Todo**：Primary Action 完了後に立つ次のTodo（テストNext.jsでの擬似AASM）

---

## 本番コア TodoKind（5種）
テストNext.jsは、まずこの5種を本番と同名で扱う（最小MVP）。

- application_sent
- application_approved
- payment_confirmed
- trade_completed
- trade_canceled

---

# 対応表（本番Rails ⇄ テストNext.js）

> 注：本番Rails側の「AASMイベント名」「関連enum」は現時点では確定情報が無いため候補/TBDです。
> 本番の該当コード（AASM定義、Todo生成箇所、Dealing enum）を確認でき次第、確定版に更新します。

---

## 1) application_sent（承認待ち）

### 意味（UI）
- 承認待ち（買手が承認するフェーズ）
- 取引成立（成約）は **買手が承認した瞬間**とする（テスト方針）

### Assignee（本番想定）
- buyer（買手）

### 表示文言（Next.js：todoUiMap の正）
- buyer：売主から依頼が届いています。内容を確認し、承認してください。
- seller：依頼を送りました。買主様からの承認をお待ちください。

### Primary Action（Next.js）
- label：承認
- role：buyer
- nextTodo：application_approved

### 本番Rails（候補/TBD）
- 関連しそうな内部状態（候補）
  - application_status（申込/承認）
- 想定AASMイベント（TBD）
  - buyerが承認するイベント（例：approve_application 等）※名称は未確定
- Todo生成・更新（TBD）
  - sellerが依頼送信 → buyerに application_sent のTodoを生成

---

## 2) application_approved（入金待ち）

### 意味（UI）
- 入金待ち（買手が入金を行うフェーズ）

### Assignee（本番想定）
- buyer（買手）

### 表示文言（Next.js：todoUiMap の正）
- buyer：発送予定日までに振込をお願いします。
- seller：買主様からの入金をお待ちください。

### Primary Action（Next.js）
- label：入金完了
- role：buyer
- nextTodo：payment_confirmed

### 本番Rails（候補/TBD）
- 関連しそうな内部状態（候補）
  - application_status（承認済み）
  - （入金系の状態が別enumなら payment_status 相当が存在する可能性）※TBD
- 想定AASMイベント（TBD）
  - buyerが入金完了を報告するイベント（例：report_payment 等）※名称未確定
- Todo生成・更新（TBD）
  - application_sent が完了（承認）→ application_approved のTodoを buyer に生成

---

## 3) payment_confirmed（確認待ち）

### 意味（UI）
- 動作確認（買手が確認し、問題なければ完了するフェーズ）
- MVPでは返品/減額交渉/NGルートは扱わない

### Assignee（本番想定）
- buyer（買手）

### 表示文言（Next.js：todoUiMap の正）
- buyer：動作確認を行い、問題なければ完了してください。
- seller：買主様の確認をお待ちください。

### Primary Action（Next.js）
- label：確認完了
- role：buyer
- nextTodo：trade_completed

### 本番Rails（候補/TBD）
- 関連しそうな内部状態（候補）
  - buyer_evaluation_status / seller_evaluation_status（評価系）
  - delivery_status（受取/確認フェーズに関係する可能性）※TBD
- 想定AASMイベント（TBD）
  - buyerが受取/確認完了を報告するイベント（例：confirm_received / confirm_ok 等）※名称未確定
- Todo生成・更新（TBD）
  - application_approved が完了（入金完了）→ payment_confirmed のTodoを buyer に生成

---

## 4) trade_completed（完了）

### 意味（UI）
- 取引完了（操作なし、閲覧のみ）

### Assignee
- なし（openなTodoではなく、完了状態の記録として扱う）

### 表示文言（Next.js：todoUiMap の正）
- buyer：取引が完了しました。
- seller：取引が完了しました。

### Primary Action（Next.js）
- なし

### 本番Rails（候補/TBD）
- 関連しそうな内部状態（候補）
  - dealingの完了状態（COMPLETED相当）
  - evaluation_status が完了条件に含まれる可能性 ※TBD
- 想定AASMイベント（TBD）
  - 完了確定イベント（例：complete_trade 等）※名称未確定
- Todo生成・更新（TBD）
  - payment_confirmed 完了（確認完了）→ trade_completed を記録（Todoとして残すか、Dealing完了のみかは本番次第）

---

## 5) trade_canceled（キャンセル）

### 意味（UI）
- 取引キャンセル（どの段階でも双方キャンセル可能：電話合意前提）
- キャンセル後は操作不可

### Assignee
- buyer / seller どちらでも（双方に権限）

### 表示文言（Next.js：todoUiMap の正）
- buyer：この取引はキャンセルされました。
- seller：この取引はキャンセルされました。

### Primary Action（Next.js）
- なし（キャンセルボタンは各画面の共通操作として扱い、実行後に trade_canceled に遷移）

### 本番Rails（候補/TBD）
- 関連しそうな内部状態（候補）
  - cancel_request_status（キャンセル申請）
  - Dealingのcancelフラグ/状態
- 想定AASMイベント（TBD）
  - buyer_cancel / seller_cancel / request_cancel 等 ※名称未確定
- Todo生成・更新（TBD）
  - キャンセル実行 → trade_canceled を記録（Todoとして残すか、Dealing状態のみかは本番次第）

---

# テスト拡張 TodoKind（x_ prefix）
現時点：なし（必要になったら `todoKinds.ext.ts` に追加し、ここにも追記する）

例：
- x_test_shipping_address_fix
  - 理由：テスト用の入力フロー補助
  - 本番に戻す/消す条件：本番のTodo/画面に同等機能がある場合は削除

---

# メモ：次に精度を上げるために必要な本番確認（任意）
- TodoList生成・更新箇所（AASMイベント後のafter hook）
- Dealingモデルの enum 定義一覧
- 進行中一覧・要承認・要入金のUIが Todo.kind とどう結びついているか（画面 or 実装）

以上を確認でき次第、「本番Rails（候補/TBD）」欄を確定値に更新する。
