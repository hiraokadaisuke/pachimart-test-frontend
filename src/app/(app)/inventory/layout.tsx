import type { ReactNode } from "react";

import ModuleHeader from "@/components/layout/ModuleHeader";

export default function InventoryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <ModuleHeader moduleName="倉庫・在庫" />
      <div className="flex-1">{children}</div>
    </div>
  );
}
