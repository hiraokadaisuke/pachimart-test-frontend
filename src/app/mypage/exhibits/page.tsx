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
    <main className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen space-y-6 px-4 md:px-6 xl:px-8">
      <ExhibitSubTabs activeTab={activeTab === "draft" ? "draft" : "active"} />

      {activeTab === "active" && <ExhibitList status="出品中" />}
      {activeTab === "draft" && <ExhibitList status="下書き" />}
    </main>
  );
}
