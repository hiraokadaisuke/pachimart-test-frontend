import type { ReactNode } from "react";

import MyPageLayout from "@/components/layout/MyPageLayout";
import { MypageLayoutClient } from "../mypage/MypageLayoutClient";

export default function TradeNaviLayout({ children }: { children: ReactNode }) {
  return (
    <MyPageLayout>
      <MypageLayoutClient>{children}</MypageLayoutClient>
    </MyPageLayout>
  );
}
