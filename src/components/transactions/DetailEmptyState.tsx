import type { ReactNode } from "react";

type DetailEmptyStateProps = {
  title: string;
  description?: string;
  message: string;
  hint?: string;
  onBack?: () => void;
  backLabel?: string;
  footer?: ReactNode;
};

export function DetailEmptyState({
  title,
  description,
  message,
  hint,
  onBack,
  backLabel = "戻る",
  footer,
}: DetailEmptyStateProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {description && <p className="text-sm text-neutral-800">{description}</p>}
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-slate-50"
          >
            {backLabel}
          </button>
        )}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-slate-900">{message}</p>
        {hint && <p className="mt-2 text-sm text-neutral-700">{hint}</p>}
        {onBack && (
          <div className="mt-4">
            <button
              type="button"
              onClick={onBack}
              className="rounded border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-slate-50"
            >
              {backLabel}
            </button>
          </div>
        )}
        {footer && <div className="mt-4">{footer}</div>}
      </section>
    </div>
  );
}
