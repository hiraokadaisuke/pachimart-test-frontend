"use client";

import { useEffect, useMemo, useState } from "react";

import { loadInventoryRecords, type InventoryRecord } from "@/lib/demo-data/demoInventory";
import {
  loadSerialDraft,
  loadSerialInput,
  loadSerialRows,
  type SerialInputPayload,
  type SerialInputRow,
} from "@/lib/serialInputStorage";

const COLUMN_KEYS = ["board", "frame", "main", "removalDate"] as const;
type ColumnKey = (typeof COLUMN_KEYS)[number];

const getColumnLabels = (type: string) => ({
  board: type === "S" ? "回胴部" : "遊技盤番号等",
  frame: type === "S" ? "筐体部" : "枠番号等",
  main: "主基板番号等",
  removalDate: "撤去日",
});

const createEmptyRow = (index: number): SerialInputRow => ({
  p: index + 1,
  board: "",
  frame: "",
  main: "",
  removalDate: "",
});

const showNativePicker = (input: HTMLInputElement) => {
  const withPicker = input as HTMLInputElement & { showPicker?: () => void };
  if (typeof withPicker.showPicker === "function") {
    withPicker.showPicker();
  } else {
    input.focus();
  }
};

type SerialInputPanelProps = {
  inventoryId: string;
  onRegister?: (payload: SerialInputPayload) => void;
  onPrev?: (payload: SerialInputPayload) => void;
  onNext?: (payload: SerialInputPayload) => void;
  onBack?: () => void;
  onUnitsChange?: (nextUnits: number) => void;
  onSplit?: (payload: SerialSplitPayload) => string | null;
  enableSplit?: boolean;
  refreshToken?: number;
  registering?: boolean;
};

export type SerialSplitPayload = {
  inventoryId: string;
  units: number;
  rows: SerialInputRow[];
  selectedIndexes: number[];
};

export default function SerialInputPanel({
  inventoryId,
  onRegister,
  onPrev,
  onNext,
  onBack,
  onUnitsChange,
  onSplit,
  enableSplit = false,
  refreshToken,
  registering = false,
}: SerialInputPanelProps) {
  const [inventory, setInventory] = useState<InventoryRecord | null>(null);
  const [units, setUnits] = useState<number>(1);
  const [rows, setRows] = useState<SerialInputRow[]>([]);
  const [inputs, setInputs] = useState<Record<ColumnKey, string>>({
    board: "",
    frame: "",
    main: "",
    removalDate: "",
  });
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const machineName = inventory?.machineName ?? "";
  const machineKind = useMemo(() => {
    const rawKind = (inventory?.kind ?? inventory?.type ?? "P").toString().toUpperCase();
    return rawKind === "S" ? "S" : "P";
  }, [inventory?.kind, inventory?.type]);
  const columnLabels = useMemo(() => getColumnLabels(machineKind), [machineKind]);

  useEffect(() => {
    if (!inventoryId) return;
    let active = true;
    const loadData = async () => {
      const all = loadInventoryRecords();
      const target = all.find((record) => record.id === inventoryId) ?? null;
      const savedRows = await loadSerialRows(inventoryId);
      const savedPayload = loadSerialInput(inventoryId) ?? loadSerialDraft(inventoryId);
      const fallbackRows = savedPayload?.rows ?? [];
      const resolvedRows = savedRows.length > 0 ? savedRows : fallbackRows;
      const resolvedUnits = Number(target?.quantity ?? 1) || 1;
      const adjustedRows = resolvedRows.slice(0, resolvedUnits);
      if (!active) return;
      setInventory(target);
      setUnits(resolvedUnits);
      const initialRows = Array.from({ length: resolvedUnits }, (_, index) => {
        const existing = adjustedRows[index];
        if (existing) return { ...existing, p: index + 1 };
        return createEmptyRow(index);
      });
      setRows(initialRows);
      if (adjustedRows.length > 0) {
        setInputs({
          board: adjustedRows[0]?.board ?? "",
          frame: adjustedRows[0]?.frame ?? "",
          main: adjustedRows[0]?.main ?? "",
          removalDate: adjustedRows[0]?.removalDate ?? "",
        });
      }
      setSelectedRows(new Set());
    };
    void loadData();
    return () => {
      active = false;
    };
  }, [inventoryId, refreshToken]);

  useEffect(() => {
    setRows((prev) =>
      Array.from({ length: units }, (_, index) => {
        const existing = prev[index];
        if (existing) return { ...existing, p: index + 1 };
        return createEmptyRow(index);
      }),
    );
  }, [units]);

  useEffect(() => {
    setSelectedRows((prev) => {
      const next = new Set<number>();
      prev.forEach((index) => {
        if (rows[index] && isRowComplete(rows[index])) {
          next.add(index);
        }
      });
      return next;
    });
  }, [rows]);

  const handleInputChange = (key: ColumnKey, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleCopy = (key: ColumnKey) => {
    const currentIndex = COLUMN_KEYS.indexOf(key);
    const nextKey = COLUMN_KEYS[currentIndex + 1];
    if (!nextKey) return;
    setInputs((prev) => ({ ...prev, [nextKey]: prev[key] }));
  };

  const resolveRange = () => {
    const parsedStart = Number.parseInt(rangeStart, 10);
    const parsedEnd = Number.parseInt(rangeEnd, 10);
    let start = Number.isNaN(parsedStart) ? 1 : parsedStart;
    let end = Number.isNaN(parsedEnd) ? units : parsedEnd;
    if (start < 1) start = 1;
    if (end < 1) end = 1;
    if (start > units) start = units;
    if (end > units) end = units;
    if (start > end) [start, end] = [end, start];
    return { startIndex: start - 1, endIndex: end - 1, start, end };
  };

  const buildSequentialValue = (baseValue: string, offset: number) => {
    if (baseValue.trim() === "") return "";
    const match = baseValue.match(/(\d+)$/);
    if (!match) {
      return `${baseValue}${offset + 1}`;
    }
    const digits = match[1];
    const prefix = baseValue.slice(0, -digits.length);
    const baseNumber = Number.parseInt(digits, 10);
    if (Number.isNaN(baseNumber)) return baseValue;
    const nextNumber = baseNumber + offset;
    return `${prefix}${String(nextNumber).padStart(digits.length, "0")}`;
  };

  const handleApply = (key: ColumnKey) => {
    const { startIndex, endIndex } = resolveRange();
    const shouldSequence = key === "board" || key === "main";
    setRows((prev) =>
      prev.map((row, index) => {
        if (index < startIndex || index > endIndex) return row;
        if (shouldSequence) {
          const sequential = buildSequentialValue(inputs[key], index - startIndex);
          return { ...row, [key]: sequential };
        }
        return { ...row, [key]: inputs[key] };
      }),
    );
  };

  const updateRowValue = (index: number, key: ColumnKey, value: string) => {
    setRows((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  };

  const handleUnitsChange = (nextUnits: number) => {
    setUnits(nextUnits);
    onUnitsChange?.(nextUnits);
  };

  const hasRowInput = (row: SerialInputRow) =>
    [row.board, row.frame, row.main, row.removalDate].some((value) => value.trim() !== "");

  const isRowComplete = (row: SerialInputRow) =>
    [row.board, row.frame, row.main, row.removalDate].every((value) => value.trim() !== "");

  const handleUnitsInputChange = (value: string) => {
    const nextUnits = Math.max(1, Number(value) || 1);
    if (nextUnits < units) {
      const removedRows = rows.slice(nextUnits);
      if (removedRows.some(hasRowInput)) {
        const confirmed = window.confirm("台数を減らすと末尾の番号データが削除されます。よろしいですか？");
        if (!confirmed) return;
      }
    }
    handleUnitsChange(nextUnits);
  };

  const buildPayload = (): SerialInputPayload => ({
    inventoryId: inventoryId ?? "",
    units,
    rows,
    updatedAt: new Date().toISOString(),
  });

  const handleSplit = () => {
    if (!onSplit) return;
    if (units < 2) {
      alert("仕入数が1台のため分離できません。");
      return;
    }
    if (selectedRows.size === 0) {
      alert("分離する台を選択してください。");
      return;
    }
    const confirmed = window.confirm(
      `選択した${selectedRows.size}台を別在庫として分離します。仕入先等の情報はコピーされます。よろしいですか？`,
    );
    if (!confirmed) return;
    const newInventoryId = onSplit({
      inventoryId,
      units,
      rows,
      selectedIndexes: Array.from(selectedRows).sort((a, b) => a - b),
    });
    if (newInventoryId) {
      alert(`分離しました（新在庫ID: ${newInventoryId}）`);
      setSelectedRows(new Set());
    }
  };

  const handleRegister = () => {
    if (!inventoryId) return;
    if (registering) return;
    onRegister?.(buildPayload());
  };

  const handlePrev = () => {
    if (!inventoryId) return;
    onPrev?.(buildPayload());
  };

  const handleNext = () => {
    if (!inventoryId) return;
    onNext?.(buildPayload());
  };

  const rangeInfo = resolveRange();
  const hasRangeInput = rangeStart.trim() !== "" || rangeEnd.trim() !== "";
  const rangeLabel = hasRangeInput ? `${rangeInfo.start} ～ ${rangeInfo.end}` : `1 ～ ${units}`;
  const canSplit = enableSplit && units > 1;
  const selectedCount = selectedRows.size;

  return (
    <div className="flex justify-center bg-neutral-100 py-4 text-[13px] text-neutral-900">
      <div className="w-full max-w-5xl space-y-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-base font-semibold">
            <span className="text-lg leading-none text-emerald-600">●</span>
            <span>購入機械番号入力</span>
          </div>
          <div className="border-b border-black" />
          <p className="text-[12px] text-neutral-800">「＊」が表示されているものは分解した商品です。</p>
        </div>

        <div className="flex items-center gap-2 border border-black bg-neutral-200 text-[13px] font-semibold">
          <div className="h-7 w-1 bg-emerald-600" />
          <div className="px-3">購入機械番号入力</div>
        </div>

        <div className="border border-black bg-white">
          <div className="flex flex-wrap items-center justify-between border-b border-black px-3 py-2 text-[12px] font-semibold">
            <div className="flex items-center gap-2">
              <span>印刷メニュー</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => alert("確認書準備中")}
                className="border border-black bg-white px-3 py-1 text-[12px] font-semibold text-neutral-900 hover:bg-neutral-100"
              >
                確認書(旧)
              </button>
              <button
                type="button"
                onClick={() => alert("確認書準備中")}
                className="border border-black bg-white px-3 py-1 text-[12px] font-semibold text-neutral-900 hover:bg-neutral-100"
              >
                確認書(新)
              </button>
              <button
                type="button"
                onClick={() => alert("確認書準備中")}
                className="border border-black bg-white px-3 py-1 text-[12px] font-semibold text-neutral-900 hover:bg-neutral-100"
              >
                確認書
              </button>
            </div>
          </div>
          <div className="flex items-stretch text-[12px]">
            <div className="flex min-w-[110px] items-center justify-center border-r border-black bg-neutral-100 px-3 py-2 font-semibold">
              機種名
            </div>
            <div className="flex-1 px-3 py-2 text-[13px] font-bold">{machineName || "機種名未設定"}</div>
          </div>
        </div>

        <div className="border border-black bg-white">
          <div className="grid grid-cols-[90px_repeat(4,1fr)] text-[12px]">
            <div className="flex flex-col items-center justify-center gap-2 border-r border-black bg-neutral-100 px-2 py-3 font-semibold">
              <span>全反映</span>
              <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-700">
                <input
                  type="number"
                  min={1}
                  max={units}
                  value={rangeStart}
                  onChange={(event) => setRangeStart(event.target.value)}
                  placeholder="開始"
                  className="w-12 border border-black bg-white px-1 py-0.5 text-right"
                />
                <span>〜</span>
                <input
                  type="number"
                  min={1}
                  max={units}
                  value={rangeEnd}
                  onChange={(event) => setRangeEnd(event.target.value)}
                  placeholder="終了"
                  className="w-12 border border-black bg-white px-1 py-0.5 text-right"
                />
              </div>
              <span className="text-[10px] font-medium text-neutral-600">範囲指定</span>
            </div>
            {COLUMN_KEYS.map((key) => (
              <div key={key} className="border-l border-black px-3 py-2">
                <div className="flex items-center justify-between border-b border-black pb-1 text-[12px] font-semibold">
                  <span>{columnLabels[key]}</span>
                  <span className="text-[11px] font-medium">No</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="min-w-[76px] border border-black bg-neutral-50 px-2 py-1 text-center text-[12px] font-semibold">
                    {rangeLabel}
                  </span>
                  <input
                    type={key === "removalDate" ? "date" : "text"}
                    value={inputs[key]}
                    onChange={(event) => handleInputChange(key, event.target.value)}
                    onClick={(event) => key === "removalDate" && showNativePicker(event.currentTarget)}
                    onFocus={(event) => key === "removalDate" && showNativePicker(event.currentTarget)}
                    className="h-8 w-28 border border-black px-2 text-[12px] focus:border-emerald-600 focus:outline-none sm:w-32"
                  />
                  {key !== "removalDate" && (
                    <button
                      type="button"
                      onClick={() => handleCopy(key)}
                      className="flex h-8 items-center justify-center border border-black bg-white px-2 text-[12px] font-semibold hover:bg-neutral-100"
                    >
                      →
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleApply(key)}
                    className="flex h-8 items-center justify-center border border-black bg-neutral-100 px-3 text-[12px] font-semibold hover:bg-neutral-200"
                  >
                    反映
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-black bg-white">
          <div className="flex items-stretch text-[12px]">
            <div className="flex w-20 items-center justify-center border-r border-black bg-neutral-100 px-2 py-3 text-[13px] font-semibold">
              本体
            </div>
            <div className="flex flex-1 flex-col border-r border-black px-3 py-2 text-center">
              <div className="text-[12px] font-semibold">{rangeLabel}</div>
              <div className="text-base font-bold leading-tight">{machineName || "機種名未設定"}</div>
              <div className="mt-2 flex flex-wrap justify-center gap-4 text-[12px]">
                <span>仕入先: {inventory?.supplier ?? "-"}</span>
                <span>タイプ: {inventory?.type ?? "-"}</span>
                <span>種別: {machineKind}</span>
              </div>
            </div>
            <div className="min-w-[180px]">
              <div className="flex border-b border-black">
                <div className="w-20 border-r border-black bg-neutral-100 px-2 py-2 text-center text-[12px] font-semibold">入庫日</div>
                <div className="flex-1 px-2 py-2 text-center text-[12px]">
                  {inventory?.stockInDate ?? inventory?.arrivalDate ?? "-"}
                </div>
              </div>
              <div className="flex">
                <div className="w-20 border-r border-black bg-neutral-100 px-2 py-2 text-center text-[12px] font-semibold">台数</div>
                <div className="flex-1 px-2 py-2 text-center text-[12px]">{units}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-black bg-white">
          <div className="flex items-center justify-between border-b border-black bg-neutral-100 px-3 py-2 text-[12px] font-semibold">
            <span>番号入力一覧</span>
            <label className="flex items-center gap-2">
              <span>台数</span>
              <input
                type="number"
                min={1}
                value={units}
                onChange={(event) => handleUnitsInputChange(event.target.value)}
                className="w-16 border border-black px-2 py-1 text-right text-[12px] focus:border-emerald-600 focus:outline-none"
              />
            </label>
          </div>
          <div className="max-h-[480px] overflow-auto">
            <table className="min-w-[720px] w-full table-fixed border-collapse text-[12px]">
              <thead className="sticky top-0 z-10 bg-white">
                <tr>
                  {enableSplit && (
                    <th className="border-b border-r border-black px-2 py-2 text-center">分離</th>
                  )}
                  <th className="border-b border-r border-black px-2 py-2 text-center">種別</th>
                  <th className="border-b border-r border-black px-2 py-2 text-center">No</th>
                  <th className="border-b border-r border-black px-2 py-2 text-center">{columnLabels.board}</th>
                  <th className="border-b border-r border-black px-2 py-2 text-center">{columnLabels.frame}</th>
                  <th className="border-b border-r border-black px-2 py-2 text-center">{columnLabels.main}</th>
                  <th className="border-b border-black px-2 py-2 text-center">{columnLabels.removalDate}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.p} className="odd:bg-white even:bg-neutral-50">
                    {enableSplit && (
                      <td className="border-b border-r border-black px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(index)}
                          disabled={!canSplit || !isRowComplete(row)}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            setSelectedRows((prev) => {
                              const next = new Set(prev);
                              if (checked) {
                                next.add(index);
                              } else {
                                next.delete(index);
                              }
                              return next;
                            });
                          }}
                          className="h-4 w-4 border-black"
                        />
                      </td>
                    )}
                    <td className="border-b border-r border-black px-2 py-2 text-center font-semibold">{machineKind}</td>
                    <td className="border-b border-r border-black px-2 py-2 text-center font-semibold">{row.p}</td>
                    <td className="border-b border-r border-black px-2 py-1">
                      <input
                        value={row.board}
                        onChange={(event) => updateRowValue(index, "board", event.target.value)}
                        className="w-full border border-black px-2 py-1 text-[12px] focus:border-emerald-600 focus:outline-none"
                      />
                    </td>
                    <td className="border-b border-r border-black px-2 py-1">
                      <input
                        value={row.frame}
                        onChange={(event) => updateRowValue(index, "frame", event.target.value)}
                        className="w-full border border-black px-2 py-1 text-[12px] focus:border-emerald-600 focus:outline-none"
                      />
                    </td>
                    <td className="border-b border-r border-black px-2 py-1">
                      <input
                        value={row.main}
                        onChange={(event) => updateRowValue(index, "main", event.target.value)}
                        className="w-full border border-black px-2 py-1 text-[12px] focus:border-emerald-600 focus:outline-none"
                      />
                    </td>
                    <td className="border-b border-black px-2 py-1">
                      <input
                        type="date"
                        value={row.removalDate}
                        onClick={(event) => showNativePicker(event.currentTarget)}
                        onFocus={(event) => showNativePicker(event.currentTarget)}
                        onChange={(event) => updateRowValue(index, "removalDate", event.target.value)}
                        className="w-full border border-black px-2 py-1 text-[12px] focus:border-emerald-600 focus:outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {enableSplit && (
          <div className="border border-black bg-white">
            <div className="flex items-center justify-between border-b border-black bg-neutral-100 px-3 py-2 text-[12px] font-semibold">
              <span>分離</span>
              <span className="text-[11px] font-medium text-neutral-600">番号入力済みのみ選択可</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-[12px]">
              <div className="text-neutral-700">選択 {selectedCount} 台</div>
              <button
                type="button"
                onClick={handleSplit}
                disabled={!canSplit || selectedCount === 0}
                aria-disabled={!canSplit || selectedCount === 0}
                className={`border border-black px-4 py-2 text-[12px] font-semibold text-neutral-900 transition ${
                  canSplit && selectedCount > 0
                    ? "bg-neutral-200 hover:bg-neutral-300"
                    : "cursor-not-allowed bg-neutral-100 text-neutral-400"
                }`}
              >
                分離する
              </button>
            </div>
          </div>
        )}

        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-center gap-3 bg-neutral-100/95 py-3 text-[13px] backdrop-blur">
          <button
            type="button"
            onClick={handlePrev}
            className="border border-black bg-neutral-200 px-4 py-2 font-semibold text-neutral-900 hover:bg-neutral-300"
          >
            前へ
          </button>
          <button
            type="button"
            onClick={handleRegister}
            disabled={registering}
            aria-disabled={registering}
            className={`border border-black px-4 py-2 font-semibold text-white transition ${
              registering ? "cursor-not-allowed bg-red-300" : "bg-red-500 hover:bg-red-400"
            }`}
          >
            {registering ? "保存中..." : "番号登録"}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="border border-black bg-neutral-200 px-4 py-2 font-semibold text-neutral-900 hover:bg-neutral-300"
          >
            戻る
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="border border-black bg-neutral-200 px-4 py-2 font-semibold text-neutral-900 hover:bg-neutral-300"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}
