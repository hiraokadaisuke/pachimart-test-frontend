"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { PachipayInfoCard } from "@/components/pachipay/PachipayInfoCard";
import { formatCurrency } from "@/lib/currency";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { dummyBalances } from "@/lib/dummyBalances";
import type { BalanceSummary } from "@/types/balance";

import { CanceledTabContent } from "./tabs/CanceledTabContent";
import { CompletedTabContent } from "./tabs/CompletedTabContent";
import { DepositAccountTabContent } from "./tabs/DepositAccountTabContent";
import { HistoryTabContent } from "./tabs/HistoryTabContent";
import { InProgressTabContent } from "./tabs/InProgressTabContent";
import { TransferAccountTabContent } from "./tabs/TransferAccountTabContent";
import { WithdrawRequestTabContent } from "./tabs/WithdrawRequestTabContent";
import type { CashflowTabKey } from "./tabsConfig";

const resolveActiveTab = (searchParams: URLSearchParams): CashflowTabKey => {
  const tab = searchParams.get("tab");
  if (
    tab === "completed" ||
    tab === "canceled" ||
    tab === "history" ||
    tab === "withdraw" ||
    tab === "depositAccount" ||
    tab === "transferAccount"
  )
    return tab;
  return "inProgress";
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
    <div className="min-w-[280px] rounded-lg border border-sky-100 bg-white px-4 py-3 shadow-sm">
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

export default function CashflowNaviPage() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-900">読み込み中…</div>}>
      <CashflowNaviContent />
    </Suspense>
  );
}

function CashflowNaviContent() {
  const searchParams = useSearchParams();
  const activeTab = useMemo(
    () => resolveActiveTab(searchParams ?? new URLSearchParams()),
    [searchParams]
  );

  const currentUser = useCurrentDevUser();
  const balanceSummary: BalanceSummary =
    dummyBalances.find((balance) => balance.userId === currentUser.id) ?? dummyBalances[0];

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2 text-neutral-900">
          <h1 className="text-lg font-semibold">入出金管理</h1>
          <p className="text-sm text-neutral-700">
            取引で発生する入出金や口座情報をまとめたハブページです。上部の残高サマリーとタブ切り替えで、
            必要な項目へ素早くアクセスできます。
          </p>
        </div>
        <BalanceSummaryCard summary={balanceSummary} />
      </div>

      <PachipayInfoCard
        title="入出金ナビ"
        description="入出金の状況をタブでまとめたモック画面です。今後、入金・出金の申請や履歴がここから確認できるようになります。"
      />

      <section>
        {activeTab === "inProgress" && <InProgressTabContent />}
        {activeTab === "completed" && <CompletedTabContent />}
        {activeTab === "canceled" && <CanceledTabContent />}
        {activeTab === "history" && <HistoryTabContent />}
        {activeTab === "withdraw" && <WithdrawRequestTabContent />}
        {activeTab === "depositAccount" && <DepositAccountTabContent />}
        {activeTab === "transferAccount" && <TransferAccountTabContent />}
      </section>
    </main>
  );
}
