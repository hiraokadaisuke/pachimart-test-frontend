import type { ReactNode } from "react";

import { InventoryNav } from "@/components/layout/InventoryNav";

export default function PurchaseInvoicesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col">
      <InventoryNav />
      <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
