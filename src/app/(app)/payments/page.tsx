"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

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

  return (
    <main className="space-y-6">
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
