import type { ReactNode } from "react";

type HeaderContent = {
  roleLabel?: string;
  title: string;
  description?: string;
  rightActions?: ReactNode;
};

type SummaryCard = {
  title: string;
  total: string;
  note?: string;
  accentClassName?: string;
};

type DetailSection = {
  title: string;
  description?: string;
  content: ReactNode;
};

type TradeDetailViewProps = {
  header: HeaderContent;
  leftSections: DetailSection[];
  summaryCard?: SummaryCard;
  mode: "navi" | "inquiry" | "payment";
  variant: "view" | "edit" | "confirm";
  actions?: ReactNode;
};

export function TradeDetailView({
  header,
  leftSections,
  summaryCard,
  actions,
}: TradeDetailViewProps) {
  return (
    <div className="space-y-6">
      <div className="print-hidden space-y-4">
        <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 md:flex-row md:items-center md:justify-between">
          <div>
            {header.roleLabel && <p className="text-xs font-semibold text-neutral-600">{header.roleLabel}</p>}
            <h1 className="text-xl font-bold text-slate-900">{header.title}</h1>
            {header.description && <p className="text-sm text-neutral-800">{header.description}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {header.rightActions}
            {actions}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {leftSections.map((section) => (
            <section key={section.title} className="rounded-lg border border-slate-400 bg-white text-sm shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-4 py-2">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-slate-900">{section.title}</h2>
                  {section.description && (
                    <p className="text-[11px] font-semibold text-neutral-600">{section.description}</p>
                  )}
                </div>
              </div>
              <div className="px-4 py-3 text-neutral-900">{section.content}</div>
            </section>
          ))}
        </div>

        {summaryCard && (
          <div className="space-y-4">
            <section className="rounded-lg border border-slate-400 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold text-neutral-500">{summaryCard.title}</p>
              <p className={`text-lg font-bold ${summaryCard.accentClassName ?? "text-indigo-700"}`}>
                {summaryCard.total}
              </p>
              {summaryCard.note && <p className="mt-1 text-sm text-neutral-800">{summaryCard.note}</p>}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
