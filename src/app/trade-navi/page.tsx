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
  if (tab === "new" || tab === "progress" || tab === "sell-history" || tab === "buy-history") return tab;
  if (tab === "requestInput") return "new";
  if (tab === "salesHistory") return "sell-history";
  if (tab === "purchaseHistory") return "buy-history";
  return "progress";
};

export default function TradeNaviPage() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-900">読み込み中…</div>}>
      <TradeNaviContent />
    </Suspense>
  );
}

function TradeNaviContent() {
  const searchParams = useSearchParams();
  const activeTab = useMemo(() => resolveActiveTab(searchParams ?? new URLSearchParams()), [searchParams]);

  return (
    <main>
      <section>
        {activeTab === "new" && <RequestTabContent />}
        {activeTab === "progress" && <InProgressTabContent />}
        {activeTab === "sell-history" && <SalesHistoryTabContent />}
        {activeTab === "buy-history" && <PurchaseHistoryTabContent />}
      </section>
    </main>
  );
}
