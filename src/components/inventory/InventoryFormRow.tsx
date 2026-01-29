import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface InventoryFormRowProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export default function InventoryFormRow({ label, children, className }: InventoryFormRowProps) {
  return (
    <div className={cn("grid gap-2 border-b border-slate-200 py-2 md:grid-cols-[160px_1fr]", className)}>
      <div className="text-xs font-semibold text-slate-700">{label}</div>
      <div className="text-xs text-slate-700">{children}</div>
    </div>
  );
}
