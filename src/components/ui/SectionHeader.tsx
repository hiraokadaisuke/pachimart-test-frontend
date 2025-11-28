import type { ReactNode } from "react";

type SectionHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function SectionHeader({ children, className }: SectionHeaderProps) {
  const baseClass = "rounded-t-sm bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700";

  return <div className={className ? `${baseClass} ${className}` : baseClass}>{children}</div>;
}
