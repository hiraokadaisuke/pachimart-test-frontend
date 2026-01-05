"use client";

import { useEffect, useMemo, useState } from "react";

import { loadSerialRows, saveSerialRows, type SerialInputRow } from "@/lib/serialInputStorage";

type SerialLabelMap = Record<keyof Omit<SerialInputRow, "p">, string>;

const DEFAULT_LABELS: SerialLabelMap = {
  board: "遊技盤番号等",
  frame: "枠番号等",
  main: "主基板番号等",
  removalDate: "撤去日",
};

const SLOT_LABELS: SerialLabelMap = {
  board: "回胴部",
  frame: "筐体部",
  main: "主基板番号等",
  removalDate: "撤去日",
};

const buildEmptyRow = (index: number): SerialInputRow => ({
  p: index + 1,
  board: "",
  frame: "",
  main: "",
  removalDate: "",
});

const ensureRows = (rows: SerialInputRow[], target: number): SerialInputRow[] => {
  const next = [...rows];
  while (next.length < target) {
    next.push(buildEmptyRow(next.length));
  }
  return next.map((row, index) => ({ ...row, p: index + 1 }));
};

type Props = {
  open: boolean;
  inventoryId: string;
  inventoryLabel: string;
  kind?: string;
  availableQuantity: number;
  requiredQuantity: number;
  selectedIndexes: number[];
  onConfirm: (payload: { selectedIndexes: number[]; rows: SerialInputRow[] }) => void;
  onClose: () => void;
};

export function SalesInvoiceSerialModal({
  open,
  inventoryId,
  inventoryLabel,
  kind,
  availableQuantity,
  requiredQuantity,
  selectedIndexes,
  onConfirm,
  onClose,
}: Props) {
  const [rows, setRows] = useState<SerialInputRow[]>([]);
  const [checkedIndexes, setCheckedIndexes] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  const labels = useMemo<SerialLabelMap>(() => {
    if (kind?.toUpperCase() === "S") return SLOT_LABELS;
    return DEFAULT_LABELS;
  }, [kind]);

  useEffect(() => {
    if (!open || !inventoryId) return;
    const loadRows = async () => {
      const stored = await loadSerialRows(inventoryId);
      const nextRows = ensureRows(stored, Math.max(1, availableQuantity));
      setRows(nextRows);
    };
    void loadRows();
    setCheckedIndexes(new Set(selectedIndexes));
    setError("");
  }, [open, inventoryId, availableQuantity, selectedIndexes]);

  if (!open) return null;

  const handleToggle = (index: number) => {
    setCheckedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
        setError("");
        return next;
      }
      if (next.size >= requiredQuantity) {
        setError("必要台数を超えて選択できません。");
        return next;
      }
      next.add(index);
      setError("");
      return next;
    });
  };

  const handleRowChange = (index: number, key: keyof Omit<SerialInputRow, "p">, value: string) => {
    setRows((prev) =>
      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
    );
  };

  const handleConfirm = async () => {
    if (checkedIndexes.size !== requiredQuantity) {
      setError(`選択数が不足しています。必要: ${requiredQuantity}台`);
      return;
    }
    await saveSerialRows(inventoryId, rows);
    onConfirm({
      selectedIndexes: Array.from(checkedIndexes).sort((a, b) => a - b),
      rows,
    });
  };

  const selectedCount = checkedIndexes.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-5xl border border-gray-400 bg-white text-[12px] text-neutral-900">
        <div className="flex items-center justify-between border-b border-gray-400 bg-gray-200 px-4 py-2 text-sm font-semibold">
          <span>番号選択 - {inventoryLabel || inventoryId}</span>
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-400 bg-white px-3 py-0.5 text-xs font-semibold"
          >
            閉じる
          </button>
        </div>
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-semibold">
              選択 {selectedCount}台 / 必要{requiredQuantity}台
            </span>
            {error && <span className="text-red-600">{error}</span>}
          </div>
          <div className="max-h-[420px] overflow-auto border border-gray-400">
            <table className="w-full border-collapse text-[12px]">
              <thead className="bg-gray-100 font-semibold">
                <tr>
                  <th className="w-10 border border-gray-400 px-2 py-1">選択</th>
                  <th className="w-12 border border-gray-400 px-2 py-1">No.</th>
                  <th className="border border-gray-400 px-2 py-1">{labels.board}</th>
                  <th className="border border-gray-400 px-2 py-1">{labels.frame}</th>
                  <th className="border border-gray-400 px-2 py-1">{labels.main}</th>
                  <th className="border border-gray-400 px-2 py-1">{labels.removalDate}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${inventoryId}-${index}`} className="bg-white">
                    <td className="border border-gray-400 px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={checkedIndexes.has(index)}
                        onChange={() => handleToggle(index)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{row.p}</td>
                    <td className="border border-gray-400 px-2 py-1">
                      <input
                        type="text"
                        value={row.board}
                        onChange={(event) => handleRowChange(index, "board", event.target.value)}
                        placeholder="未入力"
                        className="w-full border border-gray-300 px-2 py-1"
                      />
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      <input
                        type="text"
                        value={row.frame}
                        onChange={(event) => handleRowChange(index, "frame", event.target.value)}
                        placeholder="未入力"
                        className="w-full border border-gray-300 px-2 py-1"
                      />
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      <input
                        type="text"
                        value={row.main}
                        onChange={(event) => handleRowChange(index, "main", event.target.value)}
                        placeholder="未入力"
                        className="w-full border border-gray-300 px-2 py-1"
                      />
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      <input
                        type="text"
                        value={row.removalDate}
                        onChange={(event) => handleRowChange(index, "removalDate", event.target.value)}
                        placeholder="未入力"
                        className="w-full border border-gray-300 px-2 py-1 text-center"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-400 bg-white px-4 py-1 text-sm font-semibold"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="border border-gray-400 bg-[#f7f3e9] px-4 py-1 text-sm font-semibold"
            >
              確定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
