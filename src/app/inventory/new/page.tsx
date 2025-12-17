"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { addInventoryRecords, generateInventoryId, type InventoryRecord } from "@/lib/demo-data/demoInventory";

type SupplierInfo = {
  supplier: string;
  inputDate: string;
  notes: string;
  taxType: string;
  buyerStaff: string;
  purchaser: string;
  consignment: boolean;
};

const defaultSupplierInfo: SupplierInfo = {
  supplier: "",
  inputDate: "",
  notes: "",
  taxType: "税込",
  buyerStaff: "",
  purchaser: "",
  consignment: false,
};

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
  const [supplierInfo, setSupplierInfo] = useState<SupplierInfo>(defaultSupplierInfo);

  const handleChange = (index: number, key: keyof InventoryRecord, value: string | number | boolean) => {
    setRows((prev) => prev.map((row, idx) => (idx === index ? { ...row, [key]: value } : row)));
  };

  const handleCustomFieldChange = (index: number, key: string, value: string) => {
    setRows((prev) =>
      prev.map((row, idx) =>
        idx === index
          ? { ...row, customFields: { ...row.customFields, [key]: value } }
          : row,
      ),
    );
  };

  const handleSupplierChange = (key: keyof SupplierInfo, value: string | boolean) => {
    setSupplierInfo((prev) => ({ ...prev, [key]: value }));
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
            purchaser: supplierInfo.purchaser,
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
            />
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
                <option value="山田">山田</option>
                <option value="佐藤">佐藤</option>
                <option value="田中">田中</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-800">仕入担当（経理）</label>
              <select
                value={supplierInfo.purchaser}
                onChange={(event) => handleSupplierChange("purchaser", event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="">選択してください</option>
                <option value="鈴木">鈴木</option>
                <option value="高橋">高橋</option>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={`row-${index}`} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-3 py-3">
                    <input
                      value={row.type}
                      onChange={(event) => handleChange(index, "type", event.target.value)}
                      className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <input
                      value={row.maker}
                      onChange={(event) => handleChange(index, "maker", event.target.value)}
                      className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <input
                      value={row.machineName}
                      onChange={(event) => handleChange(index, "machineName", event.target.value)}
                      className="w-40 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <input
                      value={row.deviceType ?? ""}
                      onChange={(event) => handleChange(index, "deviceType", event.target.value)}
                      className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <input
                      type="number"
                      value={row.quantity ?? 0}
                      onChange={(event) => handleChange(index, "quantity", Number(event.target.value))}
                      className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <input
                      type="number"
                      value={row.unitPrice ?? 0}
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
                    <input
                      value={row.storageLocation ?? ""}
                      onChange={(event) => handleChange(index, "storageLocation", event.target.value)}
                      className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                    />
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
                </tr>
              ))}
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
    </div>
  );
}
