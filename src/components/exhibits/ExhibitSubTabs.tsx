"use client";

import { usePathname, useSearchParams } from "next/navigation";

import SubTabs, { type SubTab } from "@/components/ui/SubTabs";

type ExhibitTabKey = "active" | "new" | "draft";

const EXHIBIT_TABS: SubTab[] = [
  { label: "出品中", href: "/mypage/exhibits" },
  { label: "新規出品", href: "/sell" },
  { label: "下書き", href: "/mypage/exhibits?tab=draft" },
];

const detectActiveTab = (
  pathname: string | null,
  searchParams: URLSearchParams,
  forced?: ExhibitTabKey,
): ExhibitTabKey => {
  if (forced) return forced;
  if (pathname === "/sell") return "new";
  const tab = searchParams.get("tab");
  if (tab === "draft") return "draft";
  return "active";
};

export function ExhibitSubTabs({ activeTab }: { activeTab?: ExhibitTabKey }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab = detectActiveTab(pathname, searchParams ?? new URLSearchParams(), activeTab);

  const tabs = EXHIBIT_TABS.map((tab) => ({
    ...tab,
    isActive:
      tab.href === "/sell"
        ? currentTab === "new"
        : tab.href.includes("draft")
          ? currentTab === "draft"
          : currentTab === "active",
  }));

  return <SubTabs tabs={tabs} />;
}

export default ExhibitSubTabs;
