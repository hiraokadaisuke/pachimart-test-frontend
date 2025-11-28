export type TradeTabKey = "request" | "inProgress" | "salesHistory" | "purchaseHistory";

export const TRADE_NAVI_TABS = [
  { key: "request", label: "依頼入力", href: "/trade-navi?tab=request" },
  { key: "inProgress", label: "進行中一覧", href: "/trade-navi" },
  { key: "salesHistory", label: "売却履歴", href: "/trade-navi?tab=salesHistory" },
  { key: "purchaseHistory", label: "購入履歴", href: "/trade-navi?tab=purchaseHistory" },
] as const satisfies { key: TradeTabKey; label: string; href: string }[];
