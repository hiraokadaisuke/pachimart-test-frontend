import type { ReactNode } from "react";

import { InventoryNav } from "@/components/layout/InventoryNav";

export default function InventoryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col">
      <InventoryNav />
      <div className="w-full px-4 py-6">{children}</div>
    </div>
  );
}
