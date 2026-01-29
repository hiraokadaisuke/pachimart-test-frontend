import { Suspense, type ReactNode } from "react";

import InventoryHeader from "@/components/inventory/InventoryHeader";

export const metadata = {
  title: "在庫管理",
};

export default function InventoryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Suspense
        fallback={
          <div className="w-full border-b border-slate-200 bg-white">
            <div className="mx-auto w-full max-w-6xl px-6 py-4 text-sm text-slate-500">
              読み込み中...
            </div>
          </div>
        }
      >
        <InventoryHeader />
      </Suspense>
      <div className="flex-1">{children}</div>
    </div>
  );
}
