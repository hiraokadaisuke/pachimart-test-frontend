"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

import MyPageLayout from "@/components/layout/MyPageLayout";
import { detectMyPageSection } from "@/components/mypage/MyPagePrimaryTabs";
import { MY_PAGE_SUB_TABS } from "@/components/mypage/MyPageSectionTabs";
import SubTabs from "@/components/ui/SubTabs";

export default function MyPageRootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const subTabs = useMemo(() => {
    if (!pathname) return null;
    const section = detectMyPageSection(pathname);
    if (!section || section.key !== "balance") return null;
    return MY_PAGE_SUB_TABS[section.key] ?? null;
  }, [pathname]);

  const subTabItems = subTabs?.length ? subTabs : null;
  const hasSubTabs = Boolean(subTabItems);
  const layoutSubTabs =
    subTabItems && subTabItems.length > 0 ? <SubTabs tabs={subTabItems} /> : undefined;

  return (
    <MyPageLayout subTabs={layoutSubTabs} compact={hasSubTabs}>
      {children}
    </MyPageLayout>
  );
}
