"use client";

import { useMemo } from "react";

import { PachipayInfoCard } from "@/components/pachipay/PachipayInfoCard";
import { formatCurrency } from "@/lib/currency";
import type { BalanceSummary } from "@/types/balance";

const balanceSummary: BalanceSummary = {
  plannedPurchase: 1_000_000,
  plannedSales: 2_000_000,
  available: 1_500_000,
};

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

export default function BalancePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-700 md:max-w-xl">
          残高カテゴリの操作をタブで切り替えられるよう整理しました。各タブはモックの内容を表示しています。
        </p>
        <BalanceSummaryCard summary={balanceSummary} />
      </div>

      <PachipayInfoCard
        title="パチマート残高"
        description="パチマート残高を確認する本番画面のスタブです。入出金や取引反映後の残高をここで表示する想定です。"
      />
    </div>
  );
}
