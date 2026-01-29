import type { ReactNode } from "react";

import ModuleHeader from "@/components/layout/ModuleHeader";

export default function AnalyticsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <ModuleHeader moduleName="経営指標分析" />
      <div className="flex-1">{children}</div>
    </div>
  );
}
