"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { InProgressTabContent } from "./tabs/InProgressTabContent";
import { PurchaseHistoryTabContent } from "./tabs/PurchaseHistoryTabContent";
import { RequestTabContent } from "./tabs/RequestTabContent";
import { SalesHistoryTabContent } from "./tabs/SalesHistoryTabContent";
import { TRADE_NAVI_TABS, type TradeTabKey } from "./tabsConfig";

const resolveActiveTab = (searchParams: URLSearchParams): TradeTabKey => {
  const tab = searchParams.get("tab");
  if (tab === "new" || tab === "inProgress" || tab === "salesHistory" || tab === "purchaseHistory") return tab;
  return "inProgress";
};

const TRADE_TAB_VALUES: TradeTabKey[] = ["new", "inProgress", "salesHistory", "purchaseHistory"];

export default function TradeNaviPage() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-900">読み込み中…</div>}>
      <TradeNaviContent />
    </Suspense>
  );
}

function TradeNaviContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resolvedTab = useMemo(() => resolveActiveTab(searchParams ?? new URLSearchParams()), [searchParams]);
  const [activeTab, setActiveTab] = useState<TradeTabKey>(resolvedTab);

  useEffect(() => {
    setActiveTab(resolvedTab);
  }, [resolvedTab]);

  const handleTabChange = (nextTab: string) => {
    const next = TRADE_TAB_VALUES.includes(nextTab as TradeTabKey) ? (nextTab as TradeTabKey) : "inProgress";
    setActiveTab(next);
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("tab", next);
    const query = params.toString();
    router.replace(query ? `/navi?${query}` : "/navi", { scroll: false });
  };

  return (
    <main>
      <Tabs value={activeTab} defaultValue="inProgress" onValueChange={handleTabChange}>
        <TabsList className="overflow-x-auto pb-1">
          <div className="flex min-w-full gap-6 border-b border-slate-200 px-1">
            {TRADE_NAVI_TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="flex-shrink-0">
                {tab.label}
              </TabsTrigger>
            ))}
          </div>
        </TabsList>

        <div className="pt-4">
          <TabsContent value="new">
            <RequestTabContent />
          </TabsContent>
          <TabsContent value="inProgress">
            <InProgressTabContent />
          </TabsContent>
          <TabsContent value="salesHistory">
            <SalesHistoryTabContent />
          </TabsContent>
          <TabsContent value="purchaseHistory">
            <PurchaseHistoryTabContent />
          </TabsContent>
        </div>
      </Tabs>
    </main>
  );
}
