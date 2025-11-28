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
    <nav className="border-b border-slate-200">
      <ul className="-mb-px flex gap-2">
        {TRADE_NAVI_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <li key={tab.key}>
              <button
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`relative rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white text-slate-900 shadow-inner"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {tab.label}
                <span
                  className={`absolute inset-x-0 -bottom-px block h-0.5 ${
                    isActive ? "bg-blue-600" : "bg-transparent"
                  }`}
                  aria-hidden
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
