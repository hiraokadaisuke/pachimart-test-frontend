"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ALL_INVENTORY_COLUMN_OPTIONS,
  type InventoryColumnId,
  type InventoryColumnOption,
} from "./columnOptions";

interface InventoryColumnSelectorModalProps {
  isOpen: boolean;
  selectedColumnIds: InventoryColumnId[];
  onClose: () => void;
  onSave: (columnIds: InventoryColumnId[]) => void;
}

export function InventoryColumnSelectorModal({
  isOpen,
  selectedColumnIds,
  onClose,
  onSave,
}: InventoryColumnSelectorModalProps) {
  const [localSelection, setLocalSelection] = useState<InventoryColumnId[]>(selectedColumnIds);

  useEffect(() => {
    if (isOpen) {
      setLocalSelection(selectedColumnIds);
    }
  }, [isOpen, selectedColumnIds]);

  const selectionSet = useMemo(() => new Set(localSelection), [localSelection]);

  const handleToggle = (option: InventoryColumnOption) => {
    setLocalSelection((prev) => {
      const exists = prev.includes(option.id);
      if (exists) {
        return prev.filter((id) => id !== option.id);
      }
      return [...prev, option.id];
    });
  };

  const handleSave = () => {
    onSave(localSelection);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">表示する項目を選択（ドラッグで並び替え可）</h2>
            <p className="mt-1 text-sm text-slate-500">
              将来的にドラッグ＆ドロップで順序を変更できるようにする予定です。
            </p>
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
            {ALL_INVENTORY_COLUMN_OPTIONS.map((option) => (
              <label
                key={option.id}
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
              >
                <input
                  type="checkbox"
                  checked={selectionSet.has(option.id)}
                  onChange={() => handleToggle(option)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-800">{option.label}</span>
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
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
          >
            適用する
          </button>
        </div>
      </div>
    </div>
  );
}
