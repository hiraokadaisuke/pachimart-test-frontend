import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface InventoryPanelProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function InventoryPanel({
  title,
  description,
  actions,
  children,
  className,
}: InventoryPanelProps) {
  return (
    <section className={cn("border border-slate-300 bg-white", className)}>
      {title ? (
        <div className="flex flex-col gap-2 border-b border-slate-300 bg-slate-50 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            {description ? <p className="mt-1 text-xs text-slate-600">{description}</p> : null}
          </div>
          {actions ? <div className="flex w-full items-center gap-2 sm:w-auto">{actions}</div> : null}
        </div>
      ) : null}
      <div className="px-4 py-3 text-sm text-slate-700">{children}</div>
    </section>
  );
}
