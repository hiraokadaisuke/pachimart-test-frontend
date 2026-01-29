import type { ReactNode } from "react";

import MyPageLayout from "@/components/layout/MyPageLayout";

export default function MarketMyPageLayout({ children }: { children: ReactNode }) {
  return <MyPageLayout>{children}</MyPageLayout>;
}
