"use client";

import { useMemo } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ExhibitList } from "@/components/exhibits/ExhibitList";
import { SellForm } from "@/components/exhibits/SellForm";

const EXHIBIT_TABS = [
  { key: "active", label: "出品中" },
  { key: "new", label: "新規出品" },
  { key: "draft", label: "下書き" },
] as const;

type ExhibitTabKey = (typeof EXHIBIT_TABS)[number]["key"];

export default function ExhibitHubPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = useMemo<ExhibitTabKey>(() => {
    const tab = searchParams.get("tab");
    if (tab === "new" || tab === "draft") return tab;
    return "active";
  }, [searchParams]);

  const handleTabChange = (tab: ExhibitTabKey) => {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    if (tab === "active") {
      nextSearchParams.delete("tab");
    } else {
      nextSearchParams.set("tab", tab);
    }

    router.replace(`${pathname}?${nextSearchParams.toString()}`, { scroll: false });
  };

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-slate-900">出品</h1>
        <p className="text-sm text-slate-700">
          出品中の管理、新規出品、下書きの確認をこのハブから切り替えて行えます。
        </p>
      </div>

      <nav className="flex gap-2 overflow-x-auto py-2 text-sm">
        {EXHIBIT_TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={[
                "inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 font-semibold shadow-sm transition",
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === "active" && <ExhibitList status="出品中" onNewExhibit={() => handleTabChange("new")} />}
      {activeTab === "new" && <SellForm showHeader={false} />}
      {activeTab === "draft" && <ExhibitList status="下書き" onNewExhibit={() => handleTabChange("new")} />}
    </main>
  );
}
