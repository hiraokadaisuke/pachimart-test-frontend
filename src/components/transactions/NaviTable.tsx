import React from "react";

import { EmptyState } from "@/components/common/EmptyState";

export type NaviTableColumn = {
  key: string;
  label: string;
  width?: string;
  render?: (row: any) => React.ReactNode;
};

type Props = {
  columns: NaviTableColumn[];
  rows: any[];
  emptyMessage?: string;
  getRowKey?: (row: any, index: number) => string | number;
  onRowClick?: (row: any) => void;
};

export function NaviTable({ columns, rows, emptyMessage, getRowKey, onRowClick }: Props) {
  const colSpan = columns.length;

  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full table-fixed divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-3 py-2 text-left"
                style={column.width ? { width: column.width } : undefined}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-slate-800">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="px-3 py-4">
                <EmptyState
                  message={emptyMessage ?? "該当する取引はありません。条件を変えて再度お試しください。"}
                />
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={getRowKey?.(row, index) ?? row.id ?? index}
                className={`transition hover:bg-slate-50 ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-2 align-top text-slate-700">
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
