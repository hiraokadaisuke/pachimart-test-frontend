export type TradeTabKey = "new" | "inProgress" | "salesHistory" | "purchaseHistory";

export const TRADE_NAVI_TABS = [
  { key: "new", label: "新規取引" },
  { key: "inProgress", label: "取引中一覧" },
  { key: "salesHistory", label: "売却履歴" },
  { key: "purchaseHistory", label: "購入履歴" },
] as const satisfies { key: TradeTabKey; label: string }[];
