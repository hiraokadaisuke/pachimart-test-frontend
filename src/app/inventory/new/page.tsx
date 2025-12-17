"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { addInventoryRecords, generateInventoryId, type InventoryRecord } from "@/lib/demo-data/demoInventory";
import { DEFAULT_MASTER_DATA, loadMasterData, type MasterData } from "@/lib/demo-data/demoMasterData";

type SupplierInfo = {
  supplier: string;
  inputDate: string;
  notes: string;
  taxType: string;
  buyerStaff: string;
  consignment: boolean;
};

type MachineCatalogItem = {
  kind: "P" | "S";
  maker: string;
  title: string;
};

type SupplierCandidate = {
  name: string;
  note: string;
};

const SUPPLIER_CANDIDATES: SupplierCandidate[] = [
  { name: "サンプル商事", note: "東京都 / 遊技機卸" },
  { name: "北日本物産", note: "東北エリア" },
  { name: "西日本商会", note: "関西を中心に展開" },
  { name: "ユニ商会", note: "中古機強み" },
  { name: "パチマートテスト", note: "デモ用" },
];

const P_MAKERS = ["三洋", "京楽", "サミー", "SANKYO", "平和"];
const S_MAKERS = ["ユニバーサル", "北電子", "大都技研", "サミー", "山佐"];

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

const DEVICE_TYPES = ["本体", "枠", "セル"];

const BLANK_ROW: InventoryRecord = {
  id: "",
  createdAt: "",
  maker: "",
  machineName: "",
  type: "",
  deviceType: "",
  quantity: 1,
  unitPrice: 0,
  remainingDebt: undefined,
  arrivalDate: "",
  removalDate: "",
  pattern: "",
  storageLocation: "",
  supplier: "",
  buyerStaff: "",
  notes: "",
  consignment: false,
  stockStatus: "倉庫",
  customFields: {
    salePrice: "",
    saleFlag: "",
  },
};

const SALE_FLAG_ON = "販売する";

const createBlankRow = (): InventoryRecord => ({
  ...BLANK_ROW,
  customFields: { ...BLANK_ROW.customFields },
});

export default function InventoryNewPage() {
  const router = useRouter();
  const [rows, setRows] = useState<InventoryRecord[]>([createBlankRow()]);
  const [supplierInfo, setSupplierInfo] = useState<SupplierInfo>({
    supplier: "",
    inputDate: "",
    notes: "",
    taxType: "税込",
    buyerStaff: "",
    consignment: false,
  });
  const [masterData, setMasterData] = useState<MasterData>(DEFAULT_MASTER_DATA);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");

  useEffect(() => {
    setMasterData(loadMasterData());
  }, []);

  const handleChange = (index: number, key: keyof InventoryRecord, value: string | number | boolean) => {
    setRows((prev) => prev.map((row, idx) => (idx === index ? { ...row, [key]: value } : row)));
  };

  const handleCustomFieldChange = (index: number, key: string, value: string) => {
    setRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, customFields: { ...row.customFields, [key]: value } } : row)),
    );
  };

  const handleSupplierChange = (key: keyof SupplierInfo, value: string | boolean) => {
    setSupplierInfo((prev) => ({ ...prev, [key]: value }));
  };

  const handleKindChange = (index: number, value: "" | "P" | "S") => {
    setRows((prev) =>
      prev.map((row, idx) =>
        idx === index
          ? {
              ...row,
              type: value,
              maker: value ? row.maker : "",
              machineName: value ? row.machineName : "",
            }
          : row,
      ),
    );
  };

  const handleMakerChange = (index: number, maker: string) => {
    setRows((prev) => prev.map((row, idx) => (idx === index ? { ...row, maker, machineName: "" } : row)));
  };

  const handleAddEmptyRow = () => {
    setRows((prev) => [...prev, createBlankRow()]);
  };

  const handleDuplicateRow = () => {
    setRows((prev) => {
      if (prev.length === 0) return [createBlankRow()];
      const last = prev[prev.length - 1];
      return [...prev, { ...last, id: "", customFields: { ...last.customFields } }];
    });
  };

  const handleDeleteRow = (index: number) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleMachineSelect = (index: number, machine: MachineCatalogItem) => {
    setRows((prev) =>
      prev.map((row, idx) =>
        idx === index
          ? {
              ...row,
              type: machine.kind,
              maker: machine.maker,
              machineName: machine.title,
            }
          : row,
      ),
    );
  };

  const handleSubmit = () => {
    const prepared = rows
      .filter((row) => row.maker || row.machineName)
      .map((row) => {
        const saleEnabled = row.customFields?.saleFlag === SALE_FLAG_ON;
        return {
          ...row,
          id: row.id || generateInventoryId(),
          createdAt: supplierInfo.inputDate || row.createdAt || new Date().toISOString(),
          stockStatus: saleEnabled ? "出品中" : "倉庫",
          supplier: supplierInfo.supplier,
          buyerStaff: supplierInfo.buyerStaff,
          notes: supplierInfo.notes,
          consignment: supplierInfo.consignment,
          customFields: {
            ...row.customFields,
            taxType: supplierInfo.taxType,
          },
        } as InventoryRecord;
      });

    if (prepared.length === 0) {
      alert("登録する行を入力してください");
      return;
    }

    addInventoryRecords(prepared);
    router.push("/inventory");
  };

  const makerOptions = (kind: string) => {
    if (kind === "P") return P_MAKERS;
    if (kind === "S") return S_MAKERS;
    return [];
  };

  const filteredMachines = (kind: string, maker?: string) =>
    MACHINE_CATALOG.filter((item) => (!kind || item.kind === kind) && (!maker || item.maker === maker));

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const qty = row.quantity ?? 0;
        if (row.type === "P") acc.pCount += qty;
        if (row.type === "S") acc.sCount += qty;
        const unit = row.unitPrice ?? 0;
        acc.totalAmount += unit * qty;
        return acc;
      },
      { pCount: 0, sCount: 0, totalAmount: 0 },
    );
  }, [rows]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">在庫登録</h1>
        <p className="text-sm text-neutral-600">仕入先情報を入力し、仕入機種を行ごとに追加してください。</p>
      </div>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-900">仕入先情報</h2>
          <button
            type="button"
            onClick={() => setShowSupplierModal(true)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            仕入先検索
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
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
            <label className="block text-sm font-medium text-neutral-800">備考</label>
            <textarea
              value={supplierInfo.notes}
              onChange={(event) => handleSupplierChange("notes", event.target.value)}
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-800">消費税</label>
              <select
                value={supplierInfo.taxType}
                onChange={(event) => handleSupplierChange("taxType", event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="税込">税込</option>
                <option value="税別">税別</option>
                <option value="10%">10%</option>
              </select>
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
            <div className="flex items-end space-x-3">
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-800">
                <input
                  type="checkbox"
                  checked={supplierInfo.consignment}
                  onChange={(event) => handleSupplierChange("consignment", event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                委託
              </label>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-neutral-800">
          集計情報：パチンコ台数：{summary.pCount}台　スロット台数：{summary.sCount}台　購入金額：
          {summary.totalAmount.toLocaleString()}円
        </p>
      </div>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-900">仕入機種</h2>
          <p className="text-sm text-neutral-600">追加ボタンで行を増やし、最後の行をコピーして追加できます。</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full table-auto divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-700">
              <tr>
                <th className="whitespace-nowrap px-3 py-3">種別</th>
                <th className="whitespace-nowrap px-3 py-3">メーカー名</th>
                <th className="whitespace-nowrap px-3 py-3">機種名</th>
                <th className="whitespace-nowrap px-3 py-3">タイプ</th>
                <th className="whitespace-nowrap px-3 py-3">仕入数</th>
                <th className="whitespace-nowrap px-3 py-3">仕入単価</th>
                <th className="whitespace-nowrap px-3 py-3">販売価格</th>
                <th className="whitespace-nowrap px-3 py-3">残債</th>
                <th className="whitespace-nowrap px-3 py-3">入庫日</th>
                <th className="whitespace-nowrap px-3 py-3">撤去日</th>
                <th className="whitespace-nowrap px-3 py-3">柄</th>
                <th className="whitespace-nowrap px-3 py-3">保管先</th>
                <th className="whitespace-nowrap px-3 py-3 text-center">販売</th>
                <th className="whitespace-nowrap px-3 py-3 text-center">削除</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => {
                const makers = makerOptions(row.type);
                const machineOptions = filteredMachines(row.type, row.maker);
                const searchResults = !row.maker && row.machineName
                  ? MACHINE_CATALOG.filter((item) => item.title.toLowerCase().includes(row.machineName.toLowerCase())).slice(
                      0,
                      5,
                    )
                  : [];

                return (
                  <tr key={`row-${index}`} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-3 py-3">
                      <select
                        value={row.type}
                        onChange={(event) => handleKindChange(index, event.target.value as "" | "P" | "S")}
                        className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      >
                        <option value="">選択</option>
                        <option value="P">P</option>
                        <option value="S">S</option>
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <select
                        value={row.maker}
                        onChange={(event) => handleMakerChange(index, event.target.value)}
                        className="w-36 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                        disabled={!row.type}
                      >
                        <option value="">{row.type ? "選択してください" : "種別を先に選択"}</option>
                        {makers.map((maker) => (
                          <option key={maker} value={maker}>
                            {maker}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {row.maker ? (
                        <select
                          value={row.machineName}
                          onChange={(event) => handleChange(index, "machineName", event.target.value)}
                          className="w-48 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                        >
                          <option value="">選択してください</option>
                          {machineOptions.map((machine) => (
                            <option key={machine.title} value={machine.title}>
                              {machine.title}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="relative w-56">
                          <input
                            value={row.machineName}
                            onChange={(event) => handleChange(index, "machineName", event.target.value)}
                            placeholder="機種名を検索"
                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                          />
                          {searchResults.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
                              {searchResults.map((machine) => (
                                <button
                                  key={`${machine.maker}-${machine.title}`}
                                  type="button"
                                  onClick={() => handleMachineSelect(index, machine)}
                                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                                >
                                  <span>{machine.title}</span>
                                  <span className="text-xs text-neutral-500">{machine.maker}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <select
                        value={row.deviceType ?? ""}
                        onChange={(event) => handleChange(index, "deviceType", event.target.value)}
                        className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      >
                        <option value="">選択してください</option>
                        {DEVICE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <input
                        type="number"
                        value={row.quantity ?? 0}
                        min={0}
                        onChange={(event) => handleChange(index, "quantity", Number(event.target.value))}
                        className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <input
                        type="number"
                        value={row.unitPrice ?? 0}
                        min={0}
                        onChange={(event) => handleChange(index, "unitPrice", Number(event.target.value))}
                        className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <input
                        type="text"
                        value={row.customFields?.salePrice ?? ""}
                        onChange={(event) => handleCustomFieldChange(index, "salePrice", event.target.value)}
                        className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <input
                        type="number"
                        value={row.remainingDebt ?? 0}
                        min={0}
                        onChange={(event) => handleChange(index, "remainingDebt", Number(event.target.value))}
                        className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <input
                        type="date"
                        value={row.arrivalDate ?? ""}
                        onChange={(event) => handleChange(index, "arrivalDate", event.target.value)}
                        className="w-36 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <input
                        type="date"
                        value={row.removalDate ?? ""}
                        onChange={(event) => handleChange(index, "removalDate", event.target.value)}
                        className="w-36 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <input
                        value={row.pattern ?? ""}
                        onChange={(event) => handleChange(index, "pattern", event.target.value)}
                        className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <select
                        value={row.storageLocation ?? ""}
                        onChange={(event) => handleChange(index, "storageLocation", event.target.value)}
                        className="w-36 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      >
                        <option value="">選択してください</option>
                        {masterData.warehouses.map((warehouse) => (
                          <option key={warehouse} value={warehouse}>
                            {warehouse}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.customFields?.saleFlag === SALE_FLAG_ON}
                        onChange={(event) =>
                          handleCustomFieldChange(index, "saleFlag", event.target.checked ? SALE_FLAG_ON : "")
                        }
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(index)}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={rows.length <= 1}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAddEmptyRow}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              空行追加
            </button>
            <button
              type="button"
              onClick={handleDuplicateRow}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              同一行追加
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
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
        </div>
      </section>

      {showSupplierModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">仕入先を選択</h3>
                <p className="text-sm text-neutral-600">候補から選択して反映を押してください。</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                閉じる
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {SUPPLIER_CANDIDATES.map((candidate) => (
                <label
                  key={candidate.name}
                  className="flex cursor-pointer items-center justify-between rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{candidate.name}</p>
                    <p className="text-xs text-neutral-600">{candidate.note}</p>
                  </div>
                  <input
                    type="radio"
                    name="supplier"
                    value={candidate.name}
                    checked={selectedSupplier === candidate.name}
                    onChange={(event) => setSelectedSupplier(event.target.value)}
                    className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                  />
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedSupplier) {
                    setSupplierInfo((prev) => ({ ...prev, supplier: selectedSupplier }));
                  }
                  setShowSupplierModal(false);
                }}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500"
              >
                反映
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
