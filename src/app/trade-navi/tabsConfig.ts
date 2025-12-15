export type TradeTabKey = "requestInput" | "progress" | "salesHistory" | "purchaseHistory";

export const TRADE_NAVI_TABS = [
  { key: "requestInput", label: "新規取引", href: "/trade-navi?tab=requestInput" },
  { key: "progress", label: "取引中一覧", href: "/trade-navi?tab=progress" },
  { key: "salesHistory", label: "売却履歴", href: "/trade-navi?tab=salesHistory" },
  { key: "purchaseHistory", label: "購入履歴", href: "/trade-navi?tab=purchaseHistory" },
] as const satisfies { key: TradeTabKey; label: string; href: string }[];
