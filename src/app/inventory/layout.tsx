import type { ReactNode } from "react";

import { InventoryNav } from "@/components/layout/InventoryNav";

export default function InventoryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <InventoryNav />
      <div className="flex-1">
        <div className="mx-auto w-full max-w-none px-0 py-4">{children}</div>
      </div>
    </div>
  );
}
