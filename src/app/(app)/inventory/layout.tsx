import type { ReactNode } from "react";

import InventoryHeader from "@/components/inventory/InventoryHeader";

export const metadata = {
  title: "在庫管理",
};

export default function InventoryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <InventoryHeader />
      <div className="flex-1">{children}</div>
    </div>
  );
}
