"use client";

import type { ReactNode } from "react";

import { usePathname } from "next/navigation";

import MainContainer from "@/components/layout/MainContainer";
import { MyPagePrimaryTabs, detectMyPageSection } from "@/components/mypage/MyPagePrimaryTabs";
import { MyPageSectionTabs } from "@/components/mypage/MyPageSectionTabs";

export default function MyPageLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeSection = pathname ? detectMyPageSection(pathname) : null;

  return (
    <div className="w-full">
      <div className="border-b border-slate-200 bg-white">
        <MainContainer variant="wide">
          <MyPagePrimaryTabs activeKey={activeSection?.key ?? "products"} />
        </MainContainer>
      </div>

      <div className="border-b border-slate-200 bg-white">
        <MainContainer variant="wide">
          <div className="py-3">
            <MyPageSectionTabs
              sectionKey={activeSection?.key ?? null}
              pathname={pathname ?? ""}
            />
          </div>
        </MainContainer>
      </div>

      <MainContainer variant="wide">
        <div className="pt-6 pb-8">{children}</div>
      </MainContainer>
    </div>
  );
}
