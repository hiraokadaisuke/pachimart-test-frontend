import type { ReactNode } from "react";

import ModuleHeader from "@/components/layout/ModuleHeader";

export default function AgencyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <ModuleHeader moduleName="新台代理業" />
      <div className="flex-1">{children}</div>
    </div>
  );
}
