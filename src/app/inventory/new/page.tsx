"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { addInventoryRecords, generateInventoryId, type InventoryRecord } from "@/lib/demo-data/demoInventory";
import { DEFAULT_MASTER_DATA, loadMasterData, type MasterData } from "@/lib/demo-data/demoMasterData";

type SupplierInfo = {
  supplier: string;
  inputDate: string;
  notes: string;
  buyerStaff: string;
};

type MachineCatalogItem = {
  kind: "P" | "S";
  maker: string;
  title: string;
};

type InventoryFormRow = {
  id?: string;
  maker: string;
  model: string;
  kind: "" | "P" | "S";
  type: "" | "本体" | "枠" | "セル";
  quantity: number;
  unitPrice: number;
  stockInDate: string;
  removeDate: string;
  pattern: string;
  warehouse: string;
  note: string;
  sellNow: boolean;
};

const MACHINE_CATALOG: MachineCatalogItem[] = [
  { kind: "P", maker: "三洋", title: "大海物語5" },
  { kind: "P", maker: "京楽", title: "乃木坂46" },
  { kind: "P", maker: "サミー", title: "牙狼11" },
  { kind: "P", maker: "SANKYO", title: "ガンダムSEED" },
  { kind: "S", maker: "ユニバーサル", title: "バジリスク絆3" },
  { kind: "S", maker: "北電子", title: "アイムジャグラーEX" },
  { kind: "S", maker: "大都技研", title: "押忍！番長ZERO" },
  { kind: "S", maker: "サミー", title: "スマスロ北斗の拳" },
  { kind: "S", maker: "山佐", title: "モンキーターンV" },
];

const DEVICE_TYPES: InventoryFormRow["type"][] = ["本体", "枠", "セル"];

const createBlankRow = (today: string): InventoryFormRow => ({
  maker: "",
  model: "",
  kind: "",
  type: "",
  quantity: 1,
  unitPrice: 0,
  stockInDate: today,
  removeDate: "",
  pattern: "",
  warehouse: "",
  note: "",
  sellNow: false,
});

const todayString = () => new Date().toISOString().slice(0, 10);

const getMakerOptions = (catalog: MachineCatalogItem[]) =>
  Array.from(new Set(catalog.map((item) => item.maker)));

type MachineFieldOrder =
  | "kind"
  | "maker"
  | "model"
  | "type"
  | "quantity"
  | "unitPrice"
  | "stockInDate"
  | "removeDate"
  | "pattern"
  | "warehouse"
  | "sellNow";

type SupplierFieldOrder = "supplier" | "inputDate" | "buyerStaff";

export default function InventoryNewPage() {
  const router = useRouter();
  const [today, setToday] = useState<string>(todayString());
  const [rows, setRows] = useState<InventoryFormRow[]>([createBlankRow(todayString())]);
  const [supplierInfo, setSupplierInfo] = useState<SupplierInfo>({
    supplier: "",
    inputDate: todayString(),
    notes: "",
    buyerStaff: "",
  });
  const [masterData, setMasterData] = useState<MasterData>(DEFAULT_MASTER_DATA);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const makerOptions = useMemo(() => getMakerOptions(MACHINE_CATALOG), []);
  const makerOptionsByKind = useMemo(
    () => ({
      P: getMakerOptions(MACHINE_CATALOG.filter((item) => item.kind === "P")),
      S: getMakerOptions(MACHINE_CATALOG.filter((item) => item.kind === "S")),
    }),
    [],
  );
  const focusMap = useRef<Map<string, HTMLElement>>(new Map());
  const inputBase =
    "h-9 w-full rounded border border-slate-300 bg-white px-2 text-sm text-neutral-900 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400 focus:outline-none";
  const machineGridTemplate =
    "grid grid-cols-[64px,78px,150px,180px,110px,88px,120px,120px,100px,110px,90px,80px]";
  const machineOrder: MachineFieldOrder[] = [
    "kind",
    "maker",
    "model",
    "type",
    "quantity",
    "unitPrice",
    "stockInDate",
    "removeDate",
    "pattern",
    "warehouse",
    "sellNow",
  ];
  const supplierOrder: SupplierFieldOrder[] = ["supplier", "inputDate", "buyerStaff"];

  useEffect(() => {
    setMasterData(loadMasterData());
    const todayValue = todayString();
    setToday(todayValue);
    setSupplierInfo((prev) => ({ ...prev, inputDate: todayValue }));
    setRows([createBlankRow(todayValue)]);
  }, []);

  const focusKey = (rowIndex: number, field: MachineFieldOrder) => `row-${rowIndex}-${field}`;

  const registerFocus = (key: string) => (element: HTMLElement | null) => {
    if (!element) {
      focusMap.current.delete(key);
      return;
    }
    focusMap.current.set(key, element);
  };

  const focusTo = (key: string) => {
    const target = focusMap.current.get(key);
    if (target) {
      target.focus();
      if (target instanceof HTMLInputElement) {
        target.select();
      }
    }
  };

  const handleRowChange = <K extends keyof InventoryFormRow>(index: number, key: K, value: InventoryFormRow[K]) => {
    setRows((prev) => prev.map((row, idx) => (idx === index ? { ...row, [key]: value } : row)));
  };

  const handleSupplierChange = <K extends keyof SupplierInfo>(key: K, value: SupplierInfo[K]) => {
    setSupplierInfo((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddRow = () => {
    setRows((prev) => {
      const next = [...prev, createBlankRow(today)];
      const key = focusKey(prev.length, machineOrder[0]);
      requestAnimationFrame(() => focusTo(key));
      return next;
    });
  };

  const handleDuplicateRow = () =>
    setRows((prev) => {
      if (prev.length === 0) return [createBlankRow(today)];
      const last = prev[prev.length - 1];
      const next = [...prev, { ...last, id: undefined }];
      const key = focusKey(prev.length, machineOrder[0]);
      requestAnimationFrame(() => focusTo(key));
      return next;
    });

  const handleDeleteRow = (index: number) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

  const handleAddRowWithFocus = () => {
    setRows((prev) => {
      const next = [...prev, createBlankRow(today)];
      const key = focusKey(prev.length, machineOrder[0]);
      requestAnimationFrame(() => focusTo(key));
      return next;
    });
  };

  const handleSupplierSelect = () => {
    if (selectedSupplier) {
      setSupplierInfo((prev) => ({ ...prev, supplier: selectedSupplier }));
    }
  };

  const handleSupplierEnter = (event: React.KeyboardEvent<HTMLElement>, field: SupplierFieldOrder) => {
    if (event.key !== "Enter" || event.nativeEvent?.isComposing) return;
    event.preventDefault();
    const currentIndex = supplierOrder.indexOf(field);
    if (currentIndex < supplierOrder.length - 1) {
      const nextField = supplierOrder[currentIndex + 1];
      focusTo(`supplier-${nextField}`);
      return;
    }
    focusTo(focusKey(0, machineOrder[0]));
  };

  const handleMachineEnter = (event: React.KeyboardEvent<HTMLElement>, rowIndex: number, field: MachineFieldOrder) => {
    if (event.key !== "Enter" || event.nativeEvent?.isComposing) return;
    event.preventDefault();
    const currentIndex = machineOrder.indexOf(field);
    if (currentIndex < machineOrder.length - 1) {
      const nextField = machineOrder[currentIndex + 1];
      focusTo(focusKey(rowIndex, nextField));
      return;
    }

    if (rowIndex < rows.length - 1) {
      focusTo(focusKey(rowIndex + 1, machineOrder[0]));
      return;
    }

    handleAddRowWithFocus();
  };

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const qty = row.quantity ?? 0;
        if (row.kind === "P") acc.pCount += qty;
        if (row.kind === "S") acc.sCount += qty;
        const unit = row.unitPrice ?? 0;
        acc.totalAmount += unit * qty;
        return acc;
      },
      { pCount: 0, sCount: 0, totalAmount: 0 },
    );
  }, [rows]);

  const handleSubmit = () => {
    const prepared: InventoryRecord[] = rows
      .filter((row) => row.maker || row.model)
      .map((row) => {
        const status = row.sellNow ? "出品中" : "倉庫";
        const stockInDate = row.stockInDate || supplierInfo.inputDate || today;
        return {
          id: row.id || generateInventoryId(),
          createdAt: supplierInfo.inputDate || today,
          status,
          stockStatus: status,
          maker: row.maker,
          model: row.model,
          machineName: row.model,
          kind: row.kind || undefined,
          type: row.type || undefined,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          stockInDate,
          arrivalDate: stockInDate,
          removeDate: row.removeDate || undefined,
          removalDate: row.removeDate || undefined,
          pattern: row.pattern || undefined,
          warehouse: row.warehouse || undefined,
          storageLocation: row.warehouse || undefined,
          supplier: supplierInfo.supplier || undefined,
          staff: supplierInfo.buyerStaff || undefined,
          buyerStaff: supplierInfo.buyerStaff || undefined,
          note: row.note || supplierInfo.notes || undefined,
          notes: row.note || supplierInfo.notes || undefined,
        } satisfies InventoryRecord;
      });

    if (prepared.length === 0) {
      alert("登録する行を入力してください");
      return;
    }

    addInventoryRecords(prepared);
    router.push("/inventory");
  };

  const machineMatches = (keyword: string, maker?: string, kind?: InventoryFormRow["kind"]) => {
    const normalized = keyword.trim();
    return MACHINE_CATALOG.filter((item) => {
      if (kind && item.kind !== kind) return false;
      if (maker && item.maker !== maker) return false;
      if (!normalized) return !!maker || !!kind;
      return item.title.includes(normalized);
    }).slice(0, 8);
  };

  return (
    <div className="mx-auto max-w-screen-xl space-y-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-neutral-900">在庫登録</h1>
        <p className="text-sm text-neutral-600">仕入先情報を入力し、仕入機種を行ごとに追加してください。</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900">仕入先情報</h2>
            <span className="rounded bg-slate-100 px-2 py-1">今日: {today}</span>
          </div>
          <div className="text-xs text-neutral-500">Enterで次フィールドにフォーカス</div>
        </div>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-[1.1fr,0.9fr,0.9fr,1.2fr] bg-slate-50 text-[12px] font-semibold text-slate-700">
            <div className="px-4 py-2">仕入先</div>
            <div className="px-4 py-2">在庫入力日</div>
            <div className="px-4 py-2">仕入担当</div>
            <div className="px-4 py-2">備考</div>
          </div>
          <div className="grid grid-cols-[1.1fr,0.9fr,0.9fr,1.2fr] items-stretch border-t border-slate-200 text-sm text-neutral-900">
            <div className="flex flex-col gap-1 border-r border-slate-200 px-4 py-2">
              <input
                value={supplierInfo.supplier}
                onChange={(event) => handleSupplierChange("supplier", event.target.value)}
                onKeyDown={(event) => handleSupplierEnter(event, "supplier")}
                list="supplier-options"
                ref={registerFocus("supplier-supplier")}
                className={`${inputBase} shadow-none`}
              />
              <datalist id="supplier-options">
                {masterData.suppliers.map((supplier) => (
                  <option key={supplier} value={supplier} />
                ))}
              </datalist>
              <div className="flex gap-2 text-[12px] text-neutral-700">
                <input
                  value={selectedSupplier}
                  onChange={(event) => setSelectedSupplier(event.target.value)}
                  placeholder="候補から貼り付け"
                  className={`${inputBase} flex-1 shadow-none`}
                />
                <button
                  type="button"
                  onClick={handleSupplierSelect}
                  className="h-9 rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  反映
                </button>
              </div>
            </div>
            <div className="border-r border-slate-200 px-4 py-2">
              <input
                type="date"
                value={supplierInfo.inputDate}
                onChange={(event) => handleSupplierChange("inputDate", event.target.value)}
                onKeyDown={(event) => handleSupplierEnter(event, "inputDate")}
                ref={registerFocus("supplier-inputDate")}
                className={`${inputBase} shadow-none`}
              />
            </div>
            <div className="border-r border-slate-200 px-4 py-2">
              <select
                value={supplierInfo.buyerStaff}
                onChange={(event) => handleSupplierChange("buyerStaff", event.target.value)}
                onKeyDown={(event) => handleSupplierEnter(event, "buyerStaff")}
                ref={registerFocus("supplier-buyerStaff")}
                className={`${inputBase} shadow-none`}
              >
                <option value="">選択してください</option>
                {masterData.buyerStaffs.map((staff) => (
                  <option key={staff} value={staff}>
                    {staff}
                  </option>
                ))}
              </select>
            </div>
            <div className="px-4 py-2">
              <textarea
                value={supplierInfo.notes}
                onChange={(event) => handleSupplierChange("notes", event.target.value)}
                rows={2}
                className="h-[72px] w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-sky-400 focus:ring-2 focus:ring-sky-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
        <p className="text-sm font-semibold text-neutral-800">
          集計：P {summary.pCount}台 / S {summary.sCount}台 ・ 購入金額 {summary.totalAmount.toLocaleString()}円
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-neutral-900">仕入機種</h2>
            <span className="rounded bg-slate-100 px-2 py-1 text-xs text-neutral-700">110%でも1画面収まるコンパクト配置</span>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={handleAddRow}
              className="h-9 rounded border border-slate-300 bg-white px-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              空行追加
            </button>
            <button
              type="button"
              onClick={handleDuplicateRow}
              className="h-9 rounded border border-slate-300 bg-white px-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              同一行追加
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className={`${machineGridTemplate} bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-700`}> 
            <div className="text-center">行</div>
            <div className="text-center">種別</div>
            <div className="text-center">メーカー</div>
            <div className="text-center">機種名</div>
            <div className="text-center">タイプ</div>
            <div className="text-center">仕入数</div>
            <div className="text-center">仕入単価</div>
            <div className="text-center">入庫日</div>
            <div className="text-center">撤去日</div>
            <div className="text-center">柄</div>
            <div className="text-center">保管先</div>
            <div className="text-center">出品</div>
          </div>

          <div className="divide-y divide-slate-200">
            {rows.map((row, index) => {
              const makerList = row.kind ? makerOptionsByKind[row.kind] : makerOptions;
              const suggestions = machineMatches(row.model, row.maker, row.kind);
              return (
                <div
                  key={`row-${index}`}
                  className={`${machineGridTemplate} items-center bg-white px-3 py-1 text-sm text-neutral-900 transition hover:bg-sky-50 focus-within:bg-sky-50`}
                >
                  <div className="flex items-center justify-between gap-2 pr-2 text-xs text-neutral-600">
                    <span className="font-semibold text-neutral-900">{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(index)}
                      className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                      disabled={rows.length <= 1}
                    >
                      削除
                    </button>
                  </div>
                  <div className="pr-2">
                    <select
                      value={row.kind}
                      onChange={(event) => handleRowChange(index, "kind", event.target.value as InventoryFormRow["kind"])}
                      onKeyDown={(event) => handleMachineEnter(event, index, "kind")}
                      ref={registerFocus(focusKey(index, "kind"))}
                      className={`${inputBase} text-center`}
                    >
                      <option value="">-</option>
                      <option value="P">P</option>
                      <option value="S">S</option>
                    </select>
                  </div>
                  <div className="pr-2">
                    <select
                      value={row.maker}
                      onChange={(event) => handleRowChange(index, "maker", event.target.value)}
                      onKeyDown={(event) => handleMachineEnter(event, index, "maker")}
                      ref={registerFocus(focusKey(index, "maker"))}
                      className={`${inputBase}`}
                    >
                      <option value="">選択</option>
                      {makerList.map((maker) => (
                        <option key={maker} value={maker}>
                          {maker}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative pr-2">
                    <input
                      value={row.model}
                      onChange={(event) => handleRowChange(index, "model", event.target.value)}
                      onKeyDown={(event) => handleMachineEnter(event, index, "model")}
                      ref={registerFocus(focusKey(index, "model"))}
                      placeholder="機種名検索"
                      className={`${inputBase}`}
                    />
                    {suggestions.length > 0 && (
                      <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
                        {suggestions.map((machine) => (
                          <button
                            key={`${machine.maker}-${machine.title}`}
                            type="button"
                            onClick={() => {
                              handleRowChange(index, "model", machine.title);
                              handleRowChange(index, "maker", machine.maker);
                              handleRowChange(index, "kind", machine.kind);
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            <span>{machine.title}</span>
                            <span className="text-[11px] text-neutral-500">{machine.maker}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="pr-2">
                    <select
                      value={row.type}
                      onChange={(event) => handleRowChange(index, "type", event.target.value as InventoryFormRow["type"])}
                      onKeyDown={(event) => handleMachineEnter(event, index, "type")}
                      ref={registerFocus(focusKey(index, "type"))}
                      className={inputBase}
                    >
                      <option value="">選択</option>
                      {DEVICE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="pr-2">
                    <input
                      type="number"
                      min={0}
                      value={row.quantity}
                      onChange={(event) => handleRowChange(index, "quantity", Number(event.target.value))}
                      onKeyDown={(event) => handleMachineEnter(event, index, "quantity")}
                      ref={registerFocus(focusKey(index, "quantity"))}
                      className={`${inputBase} text-right`}
                    />
                  </div>
                  <div className="pr-2">
                    <input
                      type="number"
                      min={0}
                      value={row.unitPrice}
                      onChange={(event) => handleRowChange(index, "unitPrice", Number(event.target.value))}
                      onKeyDown={(event) => handleMachineEnter(event, index, "unitPrice")}
                      ref={registerFocus(focusKey(index, "unitPrice"))}
                      className={`${inputBase} text-right`}
                    />
                  </div>
                  <div className="pr-2">
                    <input
                      type="date"
                      value={row.stockInDate}
                      onChange={(event) => handleRowChange(index, "stockInDate", event.target.value)}
                      onKeyDown={(event) => handleMachineEnter(event, index, "stockInDate")}
                      ref={registerFocus(focusKey(index, "stockInDate"))}
                      className={inputBase}
                    />
                  </div>
                  <div className="pr-2">
                    <input
                      type="date"
                      value={row.removeDate}
                      onChange={(event) => handleRowChange(index, "removeDate", event.target.value)}
                      onKeyDown={(event) => handleMachineEnter(event, index, "removeDate")}
                      ref={registerFocus(focusKey(index, "removeDate"))}
                      className={inputBase}
                    />
                  </div>
                  <div className="pr-2">
                    <input
                      value={row.pattern}
                      onChange={(event) => handleRowChange(index, "pattern", event.target.value)}
                      onKeyDown={(event) => handleMachineEnter(event, index, "pattern")}
                      ref={registerFocus(focusKey(index, "pattern"))}
                      className={inputBase}
                    />
                  </div>
                  <div className="pr-2">
                    <select
                      value={row.warehouse}
                      onChange={(event) => handleRowChange(index, "warehouse", event.target.value)}
                      onKeyDown={(event) => handleMachineEnter(event, index, "warehouse")}
                      ref={registerFocus(focusKey(index, "warehouse"))}
                      className={inputBase}
                    >
                      <option value="">選択</option>
                      {masterData.warehouses.map((warehouse) => (
                        <option key={warehouse} value={warehouse}>
                          {warehouse}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-center">
                    <label className="flex h-9 w-full items-center justify-center gap-2 rounded border border-slate-300 bg-white px-2 text-sm shadow-sm">
                      <input
                        type="checkbox"
                        checked={row.sellNow}
                        onChange={(event) => handleRowChange(index, "sellNow", event.target.checked)}
                        onKeyDown={(event) => handleMachineEnter(event, index, "sellNow")}
                        ref={registerFocus(focusKey(index, "sellNow"))}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
                      />
                      <span className="text-[12px] text-neutral-700">出品</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-9 rounded border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            戻る
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="h-9 rounded bg-sky-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
          >
            確認
          </button>
        </div>
      </section>
    </div>
  );
}
