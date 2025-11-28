export type TradeStatusKey =
  | "draft"
  | "navi_in_progress"
  | "waiting_payment"
  | "payment_confirmed"
  | "shipped"
  | "completed"
  | "canceled";

export type TradeStatusDisplay = {
  key: TradeStatusKey;
  label: string;
  color: "gray" | "blue" | "yellow" | "green" | "red";
};

export const TRADE_STATUS_DEFINITIONS: TradeStatusDisplay[] = [
  { key: "draft", label: "下書き", color: "gray" },
  { key: "navi_in_progress", label: "取引Navi進行中", color: "blue" },
  { key: "waiting_payment", label: "入金待ち", color: "yellow" },
  { key: "payment_confirmed", label: "入金確認済", color: "green" },
  { key: "shipped", label: "発送済", color: "blue" },
  { key: "completed", label: "完了", color: "green" },
  { key: "canceled", label: "キャンセル", color: "red" },
];

export const IN_PROGRESS_STATUS_KEYS: TradeStatusKey[] = [
  "navi_in_progress",
  "waiting_payment",
  "payment_confirmed",
  "shipped",
];

export const COMPLETED_STATUS_KEYS: TradeStatusKey[] = ["completed", "canceled"];
