import type { ReactNode } from "react";

type SectionHeaderProps = {
  children?: ReactNode;
  description?: ReactNode;
  className?: string;
};

export function SectionHeader({ children, description, className }: SectionHeaderProps) {
  const baseClass = "rounded-t-sm bg-slate-200 px-4 py-2 flex items-center gap-2";

  return (
    <div className={className ? `${baseClass} ${className}` : baseClass}>
      <span className="text-sm font-semibold text-neutral-900">{children}</span>
      {description ? (
        <span className="ml-2 text-sm leading-tight text-[#555]">{description}</span>
      ) : null}
    </div>
  );
}
