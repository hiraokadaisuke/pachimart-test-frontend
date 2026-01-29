export type CashflowTabKey =
  | "inProgress"
  | "completed"
  | "canceled"
  | "history"
  | "withdraw"
  | "depositAccount"
  | "transferAccount";

export const CASHFLOW_NAVI_TABS = [
  { key: "inProgress", label: "進行中一覧", href: "/payments?tab=inProgress", matchPrefixes: ["/payments"] },
  { key: "completed", label: "成約一覧", href: "/payments?tab=completed" },
  { key: "canceled", label: "キャンセル一覧", href: "/payments?tab=canceled" },
  { key: "history", label: "入出金履歴", href: "/payments?tab=history" },
  { key: "withdraw", label: "出金申請", href: "/payments?tab=withdraw" },
  { key: "depositAccount", label: "入金口座", href: "/payments?tab=depositAccount" },
  { key: "transferAccount", label: "振込先口座", href: "/payments?tab=transferAccount" },
] as const satisfies { key: CashflowTabKey; label: string; href: string; matchPrefixes?: string[] }[];
