import type { ReactNode } from "react";

export type NaviSectionMode = "edit" | "view";

type NaviSectionTableProps = {
  children: ReactNode;
  className?: string;
};

type NaviSectionRowProps = {
  label: string;
  required?: boolean;
  mode?: NaviSectionMode;
  value?: ReactNode;
  note?: string;
  children?: ReactNode;
};

export function NaviSectionTable({ children, className }: NaviSectionTableProps) {
  return <table className={`min-w-full border border-slate-400 text-sm ${className ?? ""}`}>{children}</table>;
}

export function NaviSectionRow({
  label,
  required,
  mode = "view",
  value,
  note,
  children,
}: NaviSectionRowProps) {
  const content = children ?? value ?? "-";
  const isSimpleValue = typeof content === "string" || typeof content === "number";

  return (
    <tr className="border-t border-slate-300">
      <th className="w-40 bg-slate-100 px-3 py-1.5 text-left text-xs font-semibold text-neutral-900 align-top">
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          {required && (
            <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700">必須</span>
          )}
        </div>
      </th>
      <td className="px-3 py-2 align-top">
        {mode === "view" && isSimpleValue ? <p className="text-sm text-neutral-900">{content}</p> : content}
        {note && <p className="text-[11px] text-neutral-600">{note}</p>}
      </td>
    </tr>
  );
}
