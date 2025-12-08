import type { ReactNode } from "react";

export function PachipayInfoCard({
  title,
  description,
  extra,
}: {
  title: string;
  description: string;
  extra?: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-neutral-900">{description}</p>
      {extra}
    </div>
  );
}
