"use client";

import { useMemo, useState } from "react";

import { formatCurrency } from "@/lib/currency";
import type { BalanceSummary } from "@/types/balance";

const balanceSummary: BalanceSummary = {
  plannedPurchase: 1_000_000,
  plannedSales: 2_000_000,
  available: 1_500_000,
};

const BALANCE_TABS = [
  {
    key: "summary",
    label: "残高",
    title: "パチマート残高",
    description:
      "パチマート残高を確認する本番画面のスタブです。入出金や取引反映後の残高をここで表示する想定です。",
  },
  {
    key: "history",
    label: "入出金履歴",
    title: "入出金履歴",
    description: "パチマート残高の入出金履歴を表示するスタブページです。振込や出金の履歴をここに集約します。",
  },
  {
    key: "virtualAccount",
    label: "入金口座",
    title: "パチマートへの入金口座",
    description: "パチマートへの入金口座情報を表示するスタブです。実装時に振込先口座の詳細を案内します。",
  },
  {
    key: "withdraw",
    label: "出金申請",
    title: "パチマートからの出金申請",
    description: "出金申請の一覧と申請フローを扱うスタブです。今後の実装で申請状況を確認できるようにします。",
  },
  {
    key: "payeeAccounts",
    label: "振込先口座登録",
    title: "振込先口座登録・変更",
    description: "本番の振込先口座設定に対応するスタブです。銀行口座の登録や変更を行う画面をここで受け止めます。",
  },
] as const;

type BalanceTabKey = (typeof BALANCE_TABS)[number]["key"];

function BalanceSummaryCard({ summary }: { summary: BalanceSummary }) {
  const items = useMemo(
    () => [
      { label: "購入予定残高", value: formatCurrency(summary.plannedPurchase) },
      { label: "売却予定残高", value: formatCurrency(summary.plannedSales) },
      { label: "利用可能残高", value: formatCurrency(summary.available) },
    ],
    [summary.available, summary.plannedPurchase, summary.plannedSales]
  );

  return (
    <div className="rounded-lg border border-sky-100 bg-white px-4 py-3 shadow-sm">
      <div className="grid gap-2 text-sm text-slate-800">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between gap-3">
            <span className="font-semibold text-sky-700">{item.label}</span>
            <span className="font-bold text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BalanceTabPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-700">{description}</p>
    </div>
  );
}

export default function BalancePage() {
  const [activeTab, setActiveTab] = useState<BalanceTabKey>("summary");

  const activeContent = BALANCE_TABS.find((tab) => tab.key === activeTab) ?? BALANCE_TABS[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">残高</h1>
          <p className="text-sm text-slate-700">
            残高カテゴリの操作をタブで切り替えられるよう整理しました。各タブはモックの内容を表示しています。
          </p>
        </div>
        <BalanceSummaryCard summary={balanceSummary} />
      </div>

      <nav className="border-b border-slate-200">
        <ul className="-mb-px flex flex-wrap gap-3 text-sm font-semibold">
          {BALANCE_TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <li key={tab.key}>
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`h-10 rounded-t-md border-b-2 px-3 transition ${
                    isActive
                      ? "border-blue-600 text-blue-700"
                      : "border-transparent text-slate-600 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <BalanceTabPanel title={activeContent.title} description={activeContent.description} />
    </div>
  );
}
