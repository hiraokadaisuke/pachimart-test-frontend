"use client";

type PrintMenuAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

type SideAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
};

type PrintMenuProps = {
  menuLabel?: string;
  actions: PrintMenuAction[];
  sideLabel?: string;
  sideAction?: SideAction;
};

const defaultSideButtonClassName =
  "rounded border border-amber-600 bg-amber-200 px-4 py-1.5 text-xs font-semibold text-neutral-900 shadow hover:bg-amber-100";

export function PrintMenu({ menuLabel = "メニュー：", actions, sideLabel, sideAction }: PrintMenuProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-neutral-700">{menuLabel}</span>
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              className="rounded border border-slate-400 bg-slate-100 px-3 py-1 text-xs font-semibold text-neutral-800 shadow hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
      {sideAction && (
        <div className="flex flex-wrap items-center gap-2">
          {sideLabel && <span className="text-neutral-700">{sideLabel}</span>}
          <button
            type="button"
            onClick={sideAction.onClick}
            disabled={sideAction.disabled}
            className={sideAction.className ?? defaultSideButtonClassName}
          >
            {sideAction.label}
          </button>
        </div>
      )}
    </div>
  );
}
