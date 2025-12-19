"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { loadInventoryRecords, type InventoryRecord } from "@/lib/demo-data/demoInventory";
import {
  clearSerialDraft,
  loadSerialDraft,
  loadSerialInput,
  nextInventoryId,
  saveSerialDraft,
  saveSerialInput,
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

export default function SerialInputPage() {
  const params = useParams<{ inventoryId: string }>();
  const router = useRouter();
  const inventoryId = params?.inventoryId;

  const [inventory, setInventory] = useState<InventoryRecord | null>(null);
  const [units, setUnits] = useState<number>(1);
  const [rows, setRows] = useState<SerialInputRow[]>([]);
  const [inputs, setInputs] = useState<Record<ColumnKey, string>>({
    board: "",
    frame: "",
    main: "",
    removalDate: "",
  });

  const machineName = inventory?.machineName ?? "";
  const columnLabels = useMemo(() => getColumnLabels(inventory?.type ?? ""), [inventory?.type]);

  useEffect(() => {
    if (!inventoryId) return;
    const all = loadInventoryRecords();
    const target = all.find((record) => record.id === inventoryId) ?? null;
    const saved = loadSerialInput(inventoryId) ?? loadSerialDraft(inventoryId);
    const baseUnits = (saved?.units ?? Number(target?.quantity ?? 1)) || 1;
    setInventory(target);
    setUnits(baseUnits);
    const initialRows = Array.from({ length: baseUnits }, (_, index) => {
      const existing = saved?.rows?.[index];
      if (existing) return { ...existing, p: index + 1 };
      return createEmptyRow(index);
    });
    setRows(initialRows);
    if (saved?.rows?.length) {
      setInputs({
        board: saved.rows[0]?.board ?? "",
        frame: saved.rows[0]?.frame ?? "",
        main: saved.rows[0]?.main ?? "",
        removalDate: saved.rows[0]?.removalDate ?? "",
      });
    }
  }, [inventoryId]);

  useEffect(() => {
    setRows((prev) =>
      Array.from({ length: units }, (_, index) => {
        const existing = prev[index];
        if (existing) return { ...existing, p: index + 1 };
        return createEmptyRow(index);
      }),
    );
  }, [units]);

  const handleInputChange = (key: ColumnKey, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleCopy = (key: ColumnKey) => {
    const currentIndex = COLUMN_KEYS.indexOf(key);
    const nextKey = COLUMN_KEYS[currentIndex + 1];
    if (!nextKey) return;
    setInputs((prev) => ({ ...prev, [nextKey]: prev[key] }));
  };

  const handleApply = (key: ColumnKey) => {
    setRows((prev) => prev.map((row) => ({ ...row, [key]: inputs[key] })));
  };

  const updateRowValue = (index: number, key: ColumnKey, value: string) => {
    setRows((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  };

  const buildPayload = (): SerialInputPayload => ({
    inventoryId: inventoryId ?? "",
    units,
    rows,
    updatedAt: new Date().toISOString(),
  });

  const handleRegister = () => {
    if (!inventoryId) return;
    saveSerialInput(buildPayload());
    clearSerialDraft(inventoryId);
    router.push("/inventory/purchase-invoice/create");
  };

  const handlePrev = () => {
    if (!inventoryId) return;
    saveSerialDraft(buildPayload());
    router.push("/inventory/purchase-invoice/create");
  };

  const handleBack = () => {
    router.push("/inventory/purchase-invoice/create");
  };

  const handleNext = () => {
    if (!inventoryId) return;
    saveSerialDraft(buildPayload());
    const nextId = nextInventoryId(inventoryId);
    if (!nextId) {
      alert("次の在庫が見つかりませんでした");
      return;
    }
    router.push(`/inventory/purchase-invoice/serial-input/${nextId}`);
  };

  const noRangeText = useMemo(() => `1 ～ ${units}`, [units]);

  return (
    <div className="space-y-3 max-h-screen overflow-hidden">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-neutral-900">購入機械番号入力</h1>
        <p className="text-sm text-neutral-700">「＊」が表示されているものは分解した商品です。</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => alert("確認書準備中")}
          className="rounded border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-800 shadow-sm hover:bg-slate-50"
        >
          確認書(旧)
        </button>
        <button
          type="button"
          onClick={() => alert("確認書準備中")}
          className="rounded border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-800 shadow-sm hover:bg-slate-50"
        >
          確認書(新)
        </button>
        <button
          type="button"
          onClick={() => alert("確認書準備中")}
          className="rounded border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-800 shadow-sm hover:bg-slate-50"
        >
          確認書
        </button>
      </div>
      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
          <span>機種名</span>
          <span className="text-base font-bold text-neutral-900">{machineName || "機種名未設定"}</span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-sm">
          {COLUMN_KEYS.map((key) => (
            <div key={key} className="flex flex-col gap-1 rounded border border-slate-200 bg-slate-50 p-2">
              <div className="text-xs font-semibold text-neutral-800">{columnLabels[key]}</div>
              <div className="text-[11px] text-neutral-600">{noRangeText}</div>
              <div>
                <input
                  type={key === "removalDate" ? "date" : "text"}
                  value={inputs[key]}
                  onChange={(event) => handleInputChange(key, event.target.value)}
                  onClick={(event) => key === "removalDate" && showNativePicker(event.currentTarget)}
                  onFocus={(event) => key === "removalDate" && showNativePicker(event.currentTarget)}
                  className="w-[110px] rounded border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 text-xs">
                {key !== "removalDate" && (
                  <button
                    type="button"
                    onClick={() => handleCopy(key)}
                    className="rounded border border-slate-200 bg-white px-2 py-1 font-semibold text-neutral-800 shadow-sm hover:bg-slate-50"
                  >
                    →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleApply(key)}
                  className="rounded border border-slate-200 bg-white px-3 py-1 font-semibold text-neutral-800 shadow-sm hover:bg-slate-50"
                >
                  反映
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-800">在庫情報</h2>
        <div className="rounded border border-slate-200 bg-slate-50 p-2 text-sm text-neutral-900">
          <table className="w-full text-left">
            <tbody>
              <tr className="align-top">
                <td className="py-1 pr-4 font-semibold text-neutral-800">機種名</td>
                <td className="py-1 text-neutral-900">{machineName || "機種名未設定"}</td>
                <td className="py-1 pr-4 text-right font-semibold text-neutral-800">入庫日</td>
                <td className="py-1 text-neutral-900">{inventory?.arrivalDate ?? "-"}</td>
              </tr>
              <tr className="align-top">
                <td className="py-1 pr-4 font-semibold text-neutral-800">仕入先</td>
                <td className="py-1 text-neutral-900">{inventory?.supplier ?? "-"}</td>
                <td className="py-1 pr-4 text-right font-semibold text-neutral-800">タイプ {inventory?.type ?? "-"}</td>
                <td className="py-1 text-neutral-900">台数 {units}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-neutral-800">番号入力一覧</h2>
          <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
            <span>台数</span>
            <input
              type="number"
              min={1}
              value={units}
              onChange={(event) => setUnits(Math.max(1, Number(event.target.value) || 1))}
              className="w-20 rounded border border-slate-300 px-2 py-1 text-right text-sm shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
        </div>

        <div className="rounded border border-slate-200">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-neutral-700">
              <tr>
                <th className="border-b border-slate-200 px-2 py-1 text-left">P</th>
                <th className="border-b border-slate-200 px-2 py-1 text-left">{columnLabels.board}</th>
                <th className="border-b border-slate-200 px-2 py-1 text-left">{columnLabels.frame}</th>
                <th className="border-b border-slate-200 px-2 py-1 text-left">{columnLabels.main}</th>
                <th className="border-b border-slate-200 px-2 py-1 text-left">{columnLabels.removalDate}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.p} className="odd:bg-white even:bg-slate-50">
                  <td className="border-b border-slate-200 px-2 py-1 font-semibold text-neutral-800">{row.p}</td>
                  <td className="border-b border-slate-200 px-2 py-1">
                    <input
                      value={row.board}
                      onChange={(event) => updateRowValue(index, "board", event.target.value)}
                      className="w-full rounded border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="border-b border-slate-200 px-2 py-1">
                    <input
                      value={row.frame}
                      onChange={(event) => updateRowValue(index, "frame", event.target.value)}
                      className="w-full rounded border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="border-b border-slate-200 px-2 py-1">
                    <input
                      value={row.main}
                      onChange={(event) => updateRowValue(index, "main", event.target.value)}
                      className="w-full rounded border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="border-b border-slate-200 px-2 py-1">
                    <input
                      type="date"
                      value={row.removalDate}
                      onClick={(event) => showNativePicker(event.currentTarget)}
                      onFocus={(event) => showNativePicker(event.currentTarget)}
                      onChange={(event) => updateRowValue(index, "removalDate", event.target.value)}
                      className="w-full rounded border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
        <button
          type="button"
          onClick={handlePrev}
          className="rounded border border-slate-200 bg-white px-3 py-1.5 font-semibold text-neutral-800 shadow-sm hover:bg-slate-50"
        >
          前へ
        </button>
        <button
          type="button"
          onClick={handleRegister}
          className="rounded bg-emerald-600 px-3 py-1.5 font-semibold text-white shadow hover:bg-emerald-500"
        >
          番号登録
        </button>
        <button
          type="button"
          onClick={handleBack}
          className="rounded border border-slate-200 bg-white px-3 py-1.5 font-semibold text-neutral-800 shadow-sm hover:bg-slate-50"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="rounded bg-amber-500 px-3 py-1.5 font-semibold text-white shadow hover:bg-amber-400"
        >
          次へ
        </button>
      </div>
    </div>
  );
}
