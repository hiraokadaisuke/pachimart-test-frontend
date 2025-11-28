import type { ReactNode } from "react";

import MainContainer from "@/components/layout/MainContainer";

export default function MyPageLayout({ children, subTabs }: { children: ReactNode; subTabs?: ReactNode }) {
  return (
    <div className="w-full">
      <MainContainer variant="wide">
        {subTabs ? <div className="pt-2 md:pt-3">{subTabs}</div> : null}
        <div className={`${subTabs ? "pt-4" : "pt-6 md:pt-8"} pb-10`}>{children}</div>
      </MainContainer>
    </div>
  );
}
