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
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div>
        {title ? <h1 className="text-lg font-semibold text-slate-900">{title}</h1> : null}
        {description ? <p className="mt-1 text-xs text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
