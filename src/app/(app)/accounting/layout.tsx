import type { ReactNode } from "react";

import ModuleHeader from "@/components/layout/ModuleHeader";

export default function AccountingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <ModuleHeader moduleName="経理" />
      <div className="flex-1">{children}</div>
    </div>
  );
}
