import type { ReactNode } from "react";

type SectionHeaderProps = {
  children?: ReactNode;
  description?: ReactNode;
  className?: string;
};

export function SectionHeader({ children, description, className }: SectionHeaderProps) {
  const baseClass = "rounded-t-sm bg-slate-200 px-4 py-2 flex items-center justify-between gap-4";

  return (
    <div className={className ? `${baseClass} ${className}` : baseClass}>
      <span className="text-sm font-semibold text-neutral-900">{children}</span>
      {description ? (
        <span className="text-[13px] leading-tight text-[#666] text-right">{description}</span>
      ) : null}
    </div>
  );
}
