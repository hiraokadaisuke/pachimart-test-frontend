import type { ReactNode } from "react";

import MainContainer from "@/components/layout/MainContainer";

export default function MyPageLayout({ children, subTabs }: { children: ReactNode; subTabs?: ReactNode }) {
  const hasSubTabs = Boolean(subTabs);

  return (
    <div className="w-full">
      <MainContainer variant="wide">
        <div className="pb-10 pt-6 md:pt-8">
          {hasSubTabs ? (
            <div className="space-y-6">
              {subTabs}
              {children}
            </div>
          ) : (
            children
          )}
        </div>
      </MainContainer>
    </div>
  );
}
