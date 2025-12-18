export type TradeStatusKey =
  | "requesting"
  | "waiting_payment"
  | "payment_confirmed"
  | "completed"
  | "canceled";

export type TradeStatusDisplay = {
  key: TradeStatusKey;
  label: string;
  color: "gray" | "blue" | "yellow" | "green" | "red";
};

export type TradeStatusDisplayContext = "inProgress" | "history";

export const TRADE_STATUS_DEFINITIONS: TradeStatusDisplay[] = [
  { key: "requesting", label: "承認待ち", color: "blue" },
  { key: "waiting_payment", label: "入金待ち", color: "yellow" },
  { key: "payment_confirmed", label: "確認待ち", color: "green" },
  { key: "completed", label: "完了", color: "green" },
  { key: "canceled", label: "キャンセル", color: "red" },
];

const TRADE_STATUS_LABEL_OVERRIDES: Record<
  TradeStatusDisplayContext,
  Partial<Record<TradeStatusKey, string>>
> = {
  inProgress: {},
  history: {},
};

export function getTradeStatusDisplay(
  statusKey: TradeStatusKey,
  context?: TradeStatusDisplayContext
): TradeStatusDisplay | undefined {
  const base = TRADE_STATUS_DEFINITIONS.find((status) => status.key === statusKey);
  if (!base) return undefined;

  const overrideLabel = context ? TRADE_STATUS_LABEL_OVERRIDES[context]?.[statusKey] : undefined;

  return {
    ...base,
    label: overrideLabel ?? base.label,
  };
}

export const IN_PROGRESS_STATUS_KEYS: TradeStatusKey[] = [
  "requesting",
  "waiting_payment",
  "payment_confirmed",
];

export const COMPLETED_STATUS_KEYS: TradeStatusKey[] = ["completed", "canceled"];
