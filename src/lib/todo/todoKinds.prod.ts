export type ProdTodoKind =
  | "application_sent" // 購入申請への回答待ち（承認待ち）
  | "application_approved" // 入金完了報告（入金待ち）
  | "payment_confirmed" // 動作確認（確認待ち）
  | "trade_completed" // 完了
  | "trade_canceled"; // キャンセル
