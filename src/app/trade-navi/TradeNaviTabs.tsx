"use client";

export type TradeNaviTabKey =
  | "request"
  | "inProgress"
  | "salesHistory"
  | "purchaseHistory";

export const TRADE_NAVI_TABS: { key: TradeNaviTabKey; label: string }[] = [
  { key: "request", label: "依頼入力" },
  { key: "inProgress", label: "進行中一覧" },
  { key: "salesHistory", label: "売却履歴" },
  { key: "purchaseHistory", label: "購入履歴" },
];

export type TradeNaviTabsProps = {
  activeTab: TradeNaviTabKey;
  onTabChange: (nextTab: TradeNaviTabKey) => void;
};

export function TradeNaviTabs({ activeTab, onTabChange }: TradeNaviTabsProps) {
  return (
    <nav className="mt-6 border-b border-slate-200">
      <ul className="-mb-px flex gap-6">
        {TRADE_NAVI_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <li key={tab.key}>
              <button
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`h-10 border-b-2 px-1 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
