import type { ReactNode } from "react";

import MyPageLayout from "@/components/layout/MyPageLayout";

export default function MyPageRootLayout({ children }: { children: ReactNode }) {
  return (
    <MyPageLayout>{children}</MyPageLayout>
  );
}
