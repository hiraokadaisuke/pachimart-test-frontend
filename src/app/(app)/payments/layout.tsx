import type { ReactNode } from "react";

import MyPageLayout from "@/components/layout/MyPageLayout";
import SubTabs from "@/components/ui/SubTabs";

import { CASHFLOW_NAVI_TABS } from "./tabsConfig";

export default function CashflowNaviLayout({ children }: { children: ReactNode }) {
  return (
    <MyPageLayout subTabs={<SubTabs tabs={CASHFLOW_NAVI_TABS} />} compact>
      {children}
    </MyPageLayout>
  );
}
