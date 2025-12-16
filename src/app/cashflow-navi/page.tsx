"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import MyPageLayout from "@/components/layout/MyPageLayout";
import SubTabs from "@/components/ui/SubTabs";

import { CashflowInProgressTabContent } from "./tabs/InProgressTabContent";

type CashflowTabKey = "in-progress" | "completed" | "history" | "canceled";

const CASHFLOW_NAVI_TABS = [
  { key: "in-progress", label: "進行中一覧", href: "/cashflow-navi?tab=in-progress" },
  { key: "completed", label: "成約一覧", href: "/cashflow-navi?tab=completed" },
  { key: "history", label: "入出金履歴", href: "/cashflow-navi?tab=history" },
  { key: "canceled", label: "キャンセル一覧", href: "/cashflow-navi?tab=canceled" },
] as const satisfies { key: CashflowTabKey; label: string; href: string }[];

const resolveActiveTab = (searchParams: URLSearchParams): CashflowTabKey => {
  const tab = searchParams.get("tab");
  if (tab === "completed" || tab === "history" || tab === "canceled") return tab;
  return "in-progress";
};

function CashflowNaviContent() {
  const searchParams = useSearchParams();
  const activeTab = useMemo(
    () => resolveActiveTab(searchParams ?? new URLSearchParams()),
    [searchParams]
  );

  const tabsWithActive = CASHFLOW_NAVI_TABS.map((tab) => ({
    ...tab,
    isActive: tab.key === activeTab,
  }));

  return (
    <MyPageLayout subTabs={<SubTabs tabs={tabsWithActive} />} compact>
      <main className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-neutral-900">入出金管理</h1>
        </header>

        {activeTab === "in-progress" && <CashflowInProgressTabContent />}

        {activeTab === "completed" && (
          <div className="rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-700">
            成約一覧は現在準備中です。
          </div>
        )}

        {activeTab === "history" && (
          <div className="rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-700">
            入出金履歴は現在準備中です。
          </div>
        )}

        {activeTab === "canceled" && (
          <div className="rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-700">
            キャンセル一覧は現在準備中です。
          </div>
        )}
      </main>
    </MyPageLayout>
  );
}

export default function CashflowNaviPage() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-900">読み込み中…</div>}>
      <CashflowNaviContent />
    </Suspense>
  );
}
