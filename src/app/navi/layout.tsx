import type { ReactNode } from "react";

import MyPageLayout from "@/components/layout/MyPageLayout";

export default function NaviLayout({ children }: { children: ReactNode }) {
  return <MyPageLayout compact>{children}</MyPageLayout>;
}
