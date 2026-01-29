import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface InventoryTableProps {
  headers: ReactNode[];
  children: ReactNode;
  className?: string;
  emptyMessage?: string;
  emptyColSpan?: number;
}

export default function InventoryTable({
  headers,
  children,
  className,
  emptyMessage,
  emptyColSpan,
}: InventoryTableProps) {
  return (
    <div className={cn("overflow-x-auto border border-slate-300 bg-white", className)}>
      <table className="min-w-full border-collapse text-[11px] text-slate-800">
        <thead className="bg-slate-800 text-left text-white">
          <tr>
            {headers.map((header, index) => (
              <th
                key={`header-${index}`}
                className="border border-slate-600 px-2 py-1.5 font-semibold"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-[11px]">
          {emptyMessage ? (
            <tr>
              <td
                colSpan={emptyColSpan ?? headers.length}
                className="border border-slate-200 px-2 py-6 text-center text-xs text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : null}
          {children}
        </tbody>
      </table>
    </div>
  );
}
