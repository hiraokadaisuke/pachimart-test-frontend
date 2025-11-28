import type { ReactNode } from "react";

import MainContainer from "@/components/layout/MainContainer";

export default function MyPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full">
      <MainContainer variant="wide">
        <div className="pt-8 pb-10">{children}</div>
      </MainContainer>
    </div>
  );
}
