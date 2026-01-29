"use client";

import SubTabs, { type SubTab } from "@/components/ui/SubTabs";

type ExhibitTabKey = "active" | "new" | "draft";

const EXHIBIT_TABS: SubTab[] = [
  { label: "出品中", href: "/market/mypage/exhibits" },
  { label: "新規出品", href: "/market/mypage/exhibits/new" },
  { label: "下書き", href: "/market/mypage/exhibits?tab=draft" },
];

export function ExhibitSubTabs({ activeTab }: { activeTab: ExhibitTabKey }) {
  const tabs = EXHIBIT_TABS.map((tab) => ({
    ...tab,
    isActive:
      tab.href === "/market/mypage/exhibits/new"
        ? activeTab === "new"
        : tab.href.includes("draft")
          ? activeTab === "draft"
          : activeTab === "active",
  }));

  return <SubTabs tabs={tabs} />;
}

export default ExhibitSubTabs;
