"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { ExhibitList } from "@/components/exhibits/ExhibitList";
import { ExhibitSubTabs } from "@/components/exhibits/ExhibitSubTabs";

type ExhibitTabKey = "active" | "draft";

export default function ExhibitHubPage() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-900">読み込み中…</div>}>
      <ExhibitHubContent />
    </Suspense>
  );
}

function ExhibitHubContent() {
  const searchParams = useSearchParams();

  const activeTab = useMemo<ExhibitTabKey>(() => {
    const tab = searchParams?.get("tab");
    if (tab === "draft") return tab;
    return "active";
  }, [searchParams]);

  return (
    <main className="space-y-6">
      <ExhibitSubTabs activeTab={activeTab === "draft" ? "draft" : "active"} />

      <div className="space-y-2">
        <h1 className="text-xl font-bold text-slate-900">出品</h1>
        <p className="text-sm text-neutral-900">
          出品中の管理や下書きの確認をこのハブから行えます。新規出品はタブから遷移してください。
        </p>
      </div>

      {activeTab === "active" && <ExhibitList status="出品中" />}
      {activeTab === "draft" && <ExhibitList status="下書き" />}
    </main>
  );
}
