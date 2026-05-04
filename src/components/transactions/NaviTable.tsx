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
    <div className="mt-2 w-full overflow-x-auto bg-white">
      <table className="w-full min-w-[1420px] table-fixed border-collapse text-[13px] leading-5 text-slate-700">
        <thead className="bg-[#fafafa] text-[13px] font-semibold text-slate-600">
          <tr className="border-b border-slate-300">
            {columns.map((column) => {
              const isSorted = sortState?.key === column.key;
              const sortable = column.sortable && onSortChange;

              return (
                <th
                  key={column.key}
                  className="px-3 py-2.5 text-left"
                  style={column.width ? { width: column.width } : undefined}
                >
                  {sortable ? (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-left text-[13px] font-semibold text-slate-600 hover:text-[#0f2d62]"
                      onClick={() => onSortChange?.(column.key)}
                    >
                      <span>{column.label}</span>
                      <span className="text-[11px] text-slate-400">
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
        <tbody className="text-slate-600">
          {isLoading ? (
            skeletonRows.map((rowIndex) => (
              <tr key={`skeleton-${rowIndex}`} className="border-b border-gray-200">
                {columns.map((column, columnIndex) => (
                  <td
                    key={`${column.key}-${columnIndex}`}
                    className="px-3 py-2.5 align-top"
                    style={column.width ? { width: column.width } : undefined}
                  >
                    <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
                  </td>
                ))}
              </tr>
            ))
          ) : safeRows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="px-3 py-4">
                <EmptyState
                  message={emptyMessage ?? "該当する取引はありません。条件を変えて再度お試しください。"}
                />
              </td>
            </tr>
          ) : (
            safeRows.map((row, index) => (
              <tr
                key={getRowKey?.(row, index) ?? row.id ?? index}
                className={`border-b border-slate-200 hover:bg-[#f8fafc] ${
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
                    className="max-w-[260px] whitespace-nowrap truncate px-3 py-2.5 align-middle text-[13px] leading-5 text-slate-700"
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
