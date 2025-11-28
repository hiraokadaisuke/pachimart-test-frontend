import type { ReactNode } from "react";

import MyPageLayout from "@/components/layout/MyPageLayout";
import SubTabs from "@/components/ui/SubTabs";

import { TRADE_NAVI_TABS } from "./tabsConfig";

export default function TradeNaviLayout({ children }: { children: ReactNode }) {
  return (
    <MyPageLayout subTabs={<SubTabs tabs={TRADE_NAVI_TABS} className="-mb-2" />}>{children}</MyPageLayout>
  );
}
