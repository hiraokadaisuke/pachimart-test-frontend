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

  const hasSubTabs = Boolean(subTabs && subTabs.length > 0);

  return (
    <MyPageLayout subTabs={hasSubTabs ? <SubTabs tabs={subTabs} /> : undefined} compact={hasSubTabs}>
      {children}
    </MyPageLayout>
  );
}
