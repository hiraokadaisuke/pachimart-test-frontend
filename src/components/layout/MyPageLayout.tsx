import type { ReactNode } from "react";

import MainContainer from "@/components/layout/MainContainer";

export default function MyPageLayout({
  children,
  subTabs,
  compact = false,
}: {
  children: ReactNode;
  subTabs?: ReactNode;
  compact?: boolean;
}) {
  const hasSubTabs = Boolean(subTabs);
  const topPadding = compact && hasSubTabs ? "pt-2" : "pt-6 md:pt-8";
  const gap = compact && hasSubTabs ? "space-y-3" : "space-y-6";

  return (
    <div className="w-full">
      <MainContainer variant="wide">
        <div className={`pb-10 ${topPadding}`}>
          {hasSubTabs ? (
            <div className={gap}>
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
