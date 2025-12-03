import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "outline";
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const styles = {
    default: "bg-blue-50 text-blue-700 border border-blue-100",
    outline: "border border-slate-200 text-slate-700",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
