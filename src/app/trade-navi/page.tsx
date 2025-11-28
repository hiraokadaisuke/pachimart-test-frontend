"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { InProgressTabContent } from "./tabs/InProgressTabContent";
import { PurchaseHistoryTabContent } from "./tabs/PurchaseHistoryTabContent";
import { RequestTabContent } from "./tabs/RequestTabContent";
import { SalesHistoryTabContent } from "./tabs/SalesHistoryTabContent";
import type { TradeTabKey } from "./tabsConfig";

const resolveActiveTab = (searchParams: URLSearchParams): TradeTabKey => {
  const tab = searchParams.get("tab");
  if (tab === "request" || tab === "salesHistory" || tab === "purchaseHistory") return tab;
  return "inProgress";
};

export default function TradeNaviPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-700">読み込み中…</div>}>
      <TradeNaviContent />
    </Suspense>
  );
}

function TradeNaviContent() {
  const searchParams = useSearchParams();
  const activeTab = useMemo(() => resolveActiveTab(searchParams ?? new URLSearchParams()), [searchParams]);

  return (
    <main className="space-y-6">
      <section className="space-y-6">
        {activeTab === "request" && <RequestTabContent />}
        {activeTab === "inProgress" && <InProgressTabContent />}
        {activeTab === "salesHistory" && <SalesHistoryTabContent />}
        {activeTab === "purchaseHistory" && <PurchaseHistoryTabContent />}
      </section>
    </main>
  );
}
