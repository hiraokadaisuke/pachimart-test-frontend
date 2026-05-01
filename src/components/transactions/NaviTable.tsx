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
    <div className="mt-2 overflow-x-auto border border-gray-300 bg-white">
      <table className="min-w-[1320px] table-fixed border-collapse text-[12px] leading-4 text-slate-700">
        <thead className="bg-[#f3f4f6] text-[12px] font-medium text-slate-700">
          <tr className="border-b border-gray-200">
            {columns.map((column) => {
              const isSorted = sortState?.key === column.key;
              const sortable = column.sortable && onSortChange;

              return (
                <th
                  key={column.key}
                  className="border-r border-gray-200 px-2 py-[3px] text-left last:border-r-0"
                  style={column.width ? { width: column.width } : undefined}
                >
                  {sortable ? (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-left text-[12px] font-medium text-slate-700 hover:text-[#0f2d62]"
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
                    className="border-r border-gray-200 px-2 py-[3px] align-top last:border-r-0"
                    style={column.width ? { width: column.width } : undefined}
                  >
                    <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
                  </td>
                ))}
              </tr>
            ))
          ) : safeRows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="px-2 py-2">
                <EmptyState
                  message={emptyMessage ?? "該当する取引はありません。条件を変えて再度お試しください。"}
                />
              </td>
            </tr>
          ) : (
            safeRows.map((row, index) => (
              <tr
                key={getRowKey?.(row, index) ?? row.id ?? index}
                className={`border-b border-gray-200 hover:bg-[#f8fafc] ${
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
                    className="max-w-[180px] whitespace-nowrap truncate border-r border-gray-200 px-2 py-[3px] align-top text-[12px] leading-4 text-slate-700 last:border-r-0"
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
