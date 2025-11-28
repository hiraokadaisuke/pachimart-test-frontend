import React from "react";

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
};

export function NaviTable({ columns, rows, emptyMessage, getRowKey }: Props) {
  const colSpan = columns.length;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full overflow-hidden rounded border border-slate-200 bg-white">
        <table className="min-w-full table-fixed text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
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
                <td className="px-3 py-4 text-center text-sm text-slate-500" colSpan={colSpan}>
                  {emptyMessage ?? "該当する取引はありません。"}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={getRowKey?.(row, index) ?? row.id ?? index} className="hover:bg-slate-50">
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
    </div>
  );
}
