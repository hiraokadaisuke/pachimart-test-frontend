import type { ReactNode } from "react";
import { Suspense } from "react";

import { InventoryNav } from "@/components/layout/InventoryNav";

export default function InventoryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Suspense fallback={<div className="h-12 border-b border-gray-300 bg-slate-100" />}>
        <InventoryNav />
      </Suspense>
      <div className="flex-1">
        <div className="mx-[1cm] w-[calc(100%-2cm)] max-w-none px-0 py-4">{children}</div>
      </div>
    </div>
  );
}
