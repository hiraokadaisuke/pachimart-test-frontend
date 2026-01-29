import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface InventoryToolbarProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export default function InventoryToolbar({
  title,
  description,
  actions,
  className,
}: InventoryToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div>
        {title ? <h1 className="text-lg font-semibold text-slate-900">{title}</h1> : null}
        {description ? <p className="mt-1 text-xs text-slate-600">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{actions}</div>
      ) : null}
    </div>
  );
}
