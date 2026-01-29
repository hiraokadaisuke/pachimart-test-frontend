import type { ReactNode } from "react";

import PortalHeader from "@/components/layout/PortalHeader";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PortalHeader />
      <div className="flex-1">{children}</div>
    </div>
  );
}
