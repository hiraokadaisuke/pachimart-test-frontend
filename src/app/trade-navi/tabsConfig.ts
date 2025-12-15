export type TradeTabKey = "new" | "progress" | "sell-history" | "buy-history";

export const TRADE_NAVI_TABS = [
  { key: "new", label: "新規取引", href: "/trade-navi?tab=new" },
  { key: "progress", label: "取引中一覧", href: "/trade-navi?tab=progress" },
  { key: "sell-history", label: "売却履歴", href: "/trade-navi?tab=sell-history" },
  { key: "buy-history", label: "購入履歴", href: "/trade-navi?tab=buy-history" },
] as const satisfies { key: TradeTabKey; label: string; href: string }[];
