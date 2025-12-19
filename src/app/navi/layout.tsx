import type { ReactNode } from "react";

import MyPageLayout from "@/components/layout/MyPageLayout";

export default function TradeNaviLayout({ children }: { children: ReactNode }) {
  return <MyPageLayout compact>{children}</MyPageLayout>;
}
