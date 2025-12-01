"use client";

import type { InventoryColumnSetting } from "./columnSettings";

type ColumnVisibilityModalProps = {
  isOpen: boolean;
  onClose: () => void;
  columns: InventoryColumnSetting[];
  onChangeColumns: (next: InventoryColumnSetting[]) => void;
};

export function InventoryColumnSelectorModal({
  isOpen,
  onClose,
  columns,
  onChangeColumns,
}: ColumnVisibilityModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">表示する項目を選択</h2>
            <p className="mt-1 text-sm text-slate-500">列の順序はテーブル上のヘッダーをドラッグ＆ドロップで変更できます。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M4.22 4.22a.75.75 0 011.06 0L10 8.94l4.72-4.72a.75.75 0 111.06 1.06L11.06 10l4.72 4.72a.75.75 0 11-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 11-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="grid max-h-[440px] grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
            {columns.map((column, index) => (
              <label
                key={column.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={column.visible}
                    onChange={(event) =>
                      onChangeColumns(
                        columns.map((c) =>
                          c.id === column.id ? { ...c, visible: event.target.checked } : c,
                        ),
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-800">{column.label}</span>
                </div>
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-[2px] text-[10px] text-slate-500">{index + 1}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
