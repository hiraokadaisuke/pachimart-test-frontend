import React from "react";

import { EmptyState } from "@/components/common/EmptyState";

export type NaviTableColumn = {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (row: any) => React.ReactNode;
};

export type SortState = { key: string; direction: "asc" | "desc" } | null;

type Props = {
  columns: NaviTableColumn[];
  rows?: any[];
  emptyMessage?: string;
  loading?: boolean;
  getRowKey?: (row: any, index: number) => string | number;
  getRowClassName?: (row: any) => string | undefined;
  onRowClick?: (row: any) => void;
  sortState?: SortState;
  onSortChange?: (key: string) => void;
};

export function NaviTable({
  columns,
  rows,
  emptyMessage,
  loading,
  getRowKey,
  getRowClassName,
  onRowClick,
  sortState,
  onSortChange,
}: Props) {
  const colSpan = columns.length;
  const safeRows = rows ?? [];
  const isLoading = loading ?? rows === undefined;
  const skeletonRows = Array.from({ length: 5 }, (_, index) => index);

  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full table-fixed divide-y divide-slate-200 border border-slate-200 text-xs">
        <thead className="bg-slate-50 text-[11px] font-semibold text-neutral-700">
          <tr className="divide-x divide-slate-200">
            {columns.map((column) => {
              const isSorted = sortState?.key === column.key;
              const sortable = column.sortable && onSortChange;

              return (
                <th
                  key={column.key}
                  className="px-2 py-1.5 text-left"
                  style={column.width ? { width: column.width } : undefined}
                >
                  {sortable ? (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-left text-xs font-semibold text-neutral-700 hover:text-[#142B5E]"
                      onClick={() => onSortChange?.(column.key)}
                    >
                      <span>{column.label}</span>
                      <span className="text-[11px] text-neutral-500">
                        {isSorted ? (sortState?.direction === "asc" ? "▲" : "▼") : "⇅"}
                      </span>
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-slate-800">
          {isLoading ? (
            skeletonRows.map((rowIndex) => (
              <tr key={`skeleton-${rowIndex}`} className="divide-x divide-slate-200">
                {columns.map((column, columnIndex) => (
                  <td
                    key={`${column.key}-${columnIndex}`}
                    className="px-2 py-2 align-top"
                    style={column.width ? { width: column.width } : undefined}
                  >
                    <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
                  </td>
                ))}
              </tr>
            ))
          ) : safeRows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="px-2 py-3">
                <EmptyState
                  message={emptyMessage ?? "該当する取引はありません。条件を変えて再度お試しください。"}
                />
              </td>
            </tr>
          ) : (
            safeRows.map((row, index) => (
              <tr
                key={getRowKey?.(row, index) ?? row.id ?? index}
                className={`divide-x divide-slate-200 transition hover:bg-slate-50 ${
                  onRowClick ? "cursor-pointer" : ""
                } ${getRowClassName?.(row) ?? ""}`}
                onClick={() => {
                  console.debug("[NaviTable] rowClick", row); // TODO: remove debug log after investigation
                  onRowClick?.(row);
                }}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="max-w-[180px] px-2 py-1.5 align-top text-neutral-900 whitespace-nowrap truncate"
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {column.render ? column.render(row) : (row as Record<string, React.ReactNode>)[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
