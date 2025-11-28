"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import SubTabs from "@/components/ui/SubTabs";
import { InProgressTabContent } from "./tabs/InProgressTabContent";
import { PurchaseHistoryTabContent } from "./tabs/PurchaseHistoryTabContent";
import { RequestTabContent } from "./tabs/RequestTabContent";
import { SalesHistoryTabContent } from "./tabs/SalesHistoryTabContent";

type TradeTabKey = "request" | "inProgress" | "salesHistory" | "purchaseHistory";

const TRADE_TABS = [
  { key: "request", label: "依頼入力", href: "/trade-navi?tab=request" },
  { key: "inProgress", label: "進行中一覧", href: "/trade-navi" },
  { key: "salesHistory", label: "売却履歴", href: "/trade-navi?tab=salesHistory" },
  { key: "purchaseHistory", label: "購入履歴", href: "/trade-navi?tab=purchaseHistory" },
] as const;

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
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-slate-900">取引Navi</h1>
        <p className="text-sm text-slate-700">
          電話などで合意した取引内容を、パチマート上で確認・管理するための画面です。
        </p>
      </div>

      <SubTabs
        tabs={TRADE_TABS.map((tab) => ({ ...tab, isActive: tab.key === activeTab }))}
        className="-mb-2"
      />

      <section className="space-y-6">
        {activeTab === "request" && <RequestTabContent />}
        {activeTab === "inProgress" && <InProgressTabContent />}
        {activeTab === "salesHistory" && <SalesHistoryTabContent />}
        {activeTab === "purchaseHistory" && <PurchaseHistoryTabContent />}
      </section>
    </main>
  );
}
