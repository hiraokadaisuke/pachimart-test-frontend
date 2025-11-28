"use client";

import { useState } from "react";

import { PurchaseHistoryTabContent } from "./tabs/PurchaseHistoryTabContent";
import { RequestTabContent } from "./tabs/RequestTabContent";
import { SalesHistoryTabContent } from "./tabs/SalesHistoryTabContent";
import { InProgressTabContent } from "./tabs/InProgressTabContent";
import { TradeNaviTabKey, TradeNaviTabs } from "./TradeNaviTabs";

export default function TradeNaviPage() {
  const [activeTab, setActiveTab] = useState<TradeNaviTabKey>("inProgress");

  return (
    <main className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">取引Navi</h1>
          <p className="text-sm text-slate-700">
            電話などで合意した取引内容を、パチマート上で確認・管理するための画面です。
          </p>
        </div>
        <div>
          <button
            type="button"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            onClick={() => setActiveTab("request")}
          >
            依頼入力
          </button>
        </div>
      </header>

      <TradeNaviTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <section className="space-y-6">
        {activeTab === "request" && <RequestTabContent />}
        {activeTab === "inProgress" && <InProgressTabContent />}
        {activeTab === "salesHistory" && <SalesHistoryTabContent />}
        {activeTab === "purchaseHistory" && <PurchaseHistoryTabContent />}
      </section>
    </main>
  );
}
