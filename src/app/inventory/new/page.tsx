"use client";

import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    setMasterData(loadMasterData());
    const todayValue = todayString();
    setToday(todayValue);
    setSupplierInfo((prev) => ({ ...prev, inputDate: todayValue }));
    setRows([createBlankRow(todayValue)]);
  }, []);

  const handleRowChange = <K extends keyof InventoryFormRow>(index: number, key: K, value: InventoryFormRow[K]) => {
    setRows((prev) => prev.map((row, idx) => (idx === index ? { ...row, [key]: value } : row)));
  };

  const handleSupplierChange = <K extends keyof SupplierInfo>(key: K, value: SupplierInfo[K]) => {
    setSupplierInfo((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddRow = () => setRows((prev) => [...prev, createBlankRow(today)]);

  const handleDuplicateRow = () =>
    setRows((prev) => {
      if (prev.length === 0) return [createBlankRow(today)];
      const last = prev[prev.length - 1];
      return [...prev, { ...last, id: undefined }];
    });

  const handleDeleteRow = (index: number) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

  const handleSupplierSelect = () => {
    if (selectedSupplier) {
      setSupplierInfo((prev) => ({ ...prev, supplier: selectedSupplier }));
    }
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

  const machineMatches = (keyword: string, maker?: string) => {
    const normalized = keyword.trim();
    return MACHINE_CATALOG.filter((item) => {
      if (maker && item.maker !== maker) return false;
      if (!normalized) return !!maker;
      return item.title.includes(normalized);
    }).slice(0, 8);
  };

  return (
    <div className="mx-auto max-w-screen-xl space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-neutral-900">在庫登録</h1>
        <p className="text-sm text-neutral-600">仕入先情報を入力し、仕入機種を行ごとに追加してください。</p>
      </div>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-900">仕入先情報</h2>
          <div className="flex items-center gap-2 text-sm text-neutral-700">
            <span className="rounded bg-slate-100 px-2 py-1">今日の日付: {today}</span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <div className="space-y-2 md:col-span-2 xl:col-span-2">
            <label className="block text-sm font-medium text-neutral-800">仕入先</label>
            <input
              value={supplierInfo.supplier}
              onChange={(event) => handleSupplierChange("supplier", event.target.value)}
              list="supplier-options"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
            />
            <datalist id="supplier-options">
              {masterData.suppliers.map((supplier) => (
                <option key={supplier} value={supplier} />
              ))}
            </datalist>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <input
                value={selectedSupplier}
                onChange={(event) => setSelectedSupplier(event.target.value)}
                placeholder="候補から貼り付け"
                className="min-w-[180px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSupplierSelect}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                反映
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-800">在庫入力日</label>
            <input
              type="date"
              value={supplierInfo.inputDate}
              onChange={(event) => handleSupplierChange("inputDate", event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-800">仕入担当</label>
            <select
              value={supplierInfo.buyerStaff}
              onChange={(event) => handleSupplierChange("buyerStaff", event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
            >
              <option value="">選択してください</option>
              {masterData.buyerStaffs.map((staff) => (
                <option key={staff} value={staff}>
                  {staff}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3 xl:col-span-4">
            <label className="mb-1 block text-sm font-medium text-neutral-800">備考</label>
            <textarea
              value={supplierInfo.notes}
              onChange={(event) => handleSupplierChange("notes", event.target.value)}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>
      </section>

      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm md:px-4">
        <p className="text-sm font-semibold text-neutral-800">
          集計情報：パチンコ台数：{summary.pCount}台　スロット台数：{summary.sCount}台　購入金額：
          {summary.totalAmount.toLocaleString()}円
        </p>
      </div>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-900">仕入機種</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={handleAddRow}
              className="rounded-md border border-slate-200 px-3 py-2 font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              空行追加
            </button>
            <button
              type="button"
              onClick={handleDuplicateRow}
              className="rounded-md border border-slate-200 px-3 py-2 font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              同一行追加
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="hidden grid-cols-12 gap-2 rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold text-neutral-700 lg:grid">
            <div className="text-center">種別</div>
            <div className="col-span-2 text-center">メーカー名</div>
            <div className="col-span-2 text-center">機種名</div>
            <div className="text-center">タイプ</div>
            <div className="text-center">仕入数</div>
            <div className="text-center">仕入単価</div>
            <div className="text-center">入庫日</div>
            <div className="text-center">撤去日</div>
            <div className="text-center">柄</div>
            <div className="text-center">保管先</div>
            <div className="text-center">販売する</div>
          </div>

          <div className="space-y-3">
            {rows.map((row, index) => {
              const suggestions = machineMatches(row.model, row.maker);
              return (
                <div
                  key={`row-${index}`}
                  className="rounded-md border border-slate-200 bg-slate-50/60 p-3 shadow-inner"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-600">
                    <div className="flex items-center gap-2 font-semibold text-neutral-900">
                      <span className="rounded bg-white px-2 py-1 shadow-sm">{index + 1}行目</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={row.sellNow}
                          onChange={(event) => handleRowChange(index, "sellNow", event.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        販売する（出品中）
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(index)}
                        className="rounded-md border border-slate-300 px-2 py-1 font-semibold text-slate-700 shadow-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={rows.length <= 1}
                      >
                        削除
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-12 lg:items-center">
                    <div className="space-y-1 lg:col-span-1">
                      <label className="block text-xs font-medium text-neutral-800 lg:hidden">種別</label>
                      <select
                        value={row.kind}
                        onChange={(event) => handleRowChange(index, "kind", event.target.value as InventoryFormRow["kind"])}
                        className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      >
                        <option value="">選択</option>
                        <option value="P">P</option>
                        <option value="S">S</option>
                      </select>
                    </div>
                    <div className="space-y-1 lg:col-span-2">
                      <label className="block text-xs font-medium text-neutral-800 lg:hidden">メーカー名</label>
                      <select
                        value={row.maker}
                        onChange={(event) => handleRowChange(index, "maker", event.target.value)}
                        className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      >
                        <option value="">選択してください</option>
                        {makerOptions.map((maker) => (
                          <option key={maker} value={maker}>
                            {maker}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1 lg:col-span-2">
                      <label className="block text-xs font-medium text-neutral-800 lg:hidden">機種名</label>
                      <div className="relative">
                        <input
                          value={row.model}
                          onChange={(event) => handleRowChange(index, "model", event.target.value)}
                          placeholder="機種名を入力"
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                        />
                        {suggestions.length > 0 && (
                          <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
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
                                <span className="text-xs text-neutral-500">{machine.maker}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 lg:col-span-1">
                      <label className="block text-xs font-medium text-neutral-800 lg:hidden">タイプ</label>
                      <select
                        value={row.type}
                        onChange={(event) => handleRowChange(index, "type", event.target.value as InventoryFormRow["type"])}
                        className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      >
                        <option value="">選択</option>
                        {DEVICE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1 lg:col-span-1">
                      <label className="block text-xs font-medium text-neutral-800 lg:hidden">仕入数</label>
                      <input
                        type="number"
                        min={0}
                        value={row.quantity}
                        onChange={(event) => handleRowChange(index, "quantity", Number(event.target.value))}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1 lg:col-span-1">
                      <label className="block text-xs font-medium text-neutral-800 lg:hidden">仕入単価</label>
                      <input
                        type="number"
                        min={0}
                        value={row.unitPrice}
                        onChange={(event) => handleRowChange(index, "unitPrice", Number(event.target.value))}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1 lg:col-span-1">
                      <label className="block text-xs font-medium text-neutral-800 lg:hidden">入庫日</label>
                      <input
                        type="date"
                        value={row.stockInDate}
                        onChange={(event) => handleRowChange(index, "stockInDate", event.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1 lg:col-span-1">
                      <label className="block text-xs font-medium text-neutral-800 lg:hidden">撤去日</label>
                      <input
                        type="date"
                        value={row.removeDate}
                        onChange={(event) => handleRowChange(index, "removeDate", event.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1 lg:col-span-1">
                      <label className="block text-xs font-medium text-neutral-800 lg:hidden">柄</label>
                      <input
                        value={row.pattern}
                        onChange={(event) => handleRowChange(index, "pattern", event.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1 lg:col-span-1">
                      <label className="block text-xs font-medium text-neutral-800 lg:hidden">保管先</label>
                      <select
                        value={row.warehouse}
                        onChange={(event) => handleRowChange(index, "warehouse", event.target.value)}
                        className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      >
                        <option value="">選択してください</option>
                        {masterData.warehouses.map((warehouse) => (
                          <option key={warehouse} value={warehouse}>
                            {warehouse}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1 lg:col-span-1">
                      <label className="block text-xs font-medium text-neutral-800 lg:hidden">販売する</label>
                      <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm lg:justify-center">
                        <input
                          type="checkbox"
                          checked={row.sellNow}
                          onChange={(event) => handleRowChange(index, "sellNow", event.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span className="text-sm">出品</span>
                      </label>
                    </div>
                    <div className="lg:col-span-12">
                      <label className="mb-1 block text-xs font-medium text-neutral-800">備考</label>
                      <textarea
                        value={row.note}
                        onChange={(event) => handleRowChange(index, "note", event.target.value)}
                        rows={2}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            戻る
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-md bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500"
          >
            確認
          </button>
        </div>
      </section>
    </div>
  );
}
