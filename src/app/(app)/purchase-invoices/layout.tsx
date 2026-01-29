import type { ReactNode } from "react";
import { Suspense } from "react";

import { InventoryNav } from "@/components/layout/InventoryNav";

export default function PurchaseInvoicesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col">
      <Suspense fallback={<div className="h-12 border-b border-gray-300 bg-slate-100" />}>
        <InventoryNav />
      </Suspense>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
