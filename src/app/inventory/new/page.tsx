"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { addInventoryRecords, generateInventoryId, type InventoryRecord } from "@/lib/demo-data/demoInventory";

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
};

export default function InventoryNewPage() {
  const router = useRouter();
  const [rows, setRows] = useState<InventoryRecord[]>([{ ...BLANK_ROW }]);

  const handleChange = (index: number, key: keyof InventoryRecord, value: string | number | boolean) => {
    setRows((prev) => prev.map((row, idx) => (idx === index ? { ...row, [key]: value } : row)));
  };

  const handleAddEmptyRow = () => {
    setRows((prev) => [...prev, { ...BLANK_ROW }]);
  };

  const handleDuplicateRow = () => {
    setRows((prev) => {
      if (prev.length === 0) return [{ ...BLANK_ROW }];
      const last = prev[prev.length - 1];
      return [...prev, { ...last, id: "" }];
    });
  };

  const handleSubmit = () => {
    const prepared = rows
      .filter((row) => row.maker || row.machineName)
      .map((row) => ({
        ...row,
        id: row.id || generateInventoryId(),
        createdAt: row.createdAt || new Date().toISOString(),
        stockStatus: row.stockStatus ?? "倉庫",
      }));

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
        <p className="text-sm text-neutral-600">行ごとに在庫を入力し、確認を押して追加します。</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-700">
            <tr>
              <th className="px-3 py-3">種別</th>
              <th className="px-3 py-3">メーカー名</th>
              <th className="px-3 py-3">機種名</th>
              <th className="px-3 py-3">タイプ</th>
              <th className="px-3 py-3">仕入数</th>
              <th className="px-3 py-3">仕入単価</th>
              <th className="px-3 py-3">残債</th>
              <th className="px-3 py-3">入庫日</th>
              <th className="px-3 py-3">撤去日</th>
              <th className="px-3 py-3">柄</th>
              <th className="px-3 py-3">保管先</th>
              <th className="px-3 py-3">仕入先</th>
              <th className="px-3 py-3">仕入担当</th>
              <th className="px-3 py-3">備考</th>
              <th className="px-3 py-3">委託</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={`row-${index}`} className="hover:bg-slate-50">
                <td className="px-3 py-3">
                  <input
                    value={row.type}
                    onChange={(event) => handleChange(index, "type", event.target.value)}
                    className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    value={row.maker}
                    onChange={(event) => handleChange(index, "maker", event.target.value)}
                    className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    value={row.machineName}
                    onChange={(event) => handleChange(index, "machineName", event.target.value)}
                    className="w-40 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    value={row.deviceType ?? ""}
                    onChange={(event) => handleChange(index, "deviceType", event.target.value)}
                    className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    type="number"
                    value={row.quantity ?? 0}
                    onChange={(event) => handleChange(index, "quantity", Number(event.target.value))}
                    className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    type="number"
                    value={row.unitPrice ?? 0}
                    onChange={(event) => handleChange(index, "unitPrice", Number(event.target.value))}
                    className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    type="number"
                    value={row.remainingDebt ?? 0}
                    onChange={(event) => handleChange(index, "remainingDebt", Number(event.target.value))}
                    className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    type="date"
                    value={row.arrivalDate ?? ""}
                    onChange={(event) => handleChange(index, "arrivalDate", event.target.value)}
                    className="w-36 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    type="date"
                    value={row.removalDate ?? ""}
                    onChange={(event) => handleChange(index, "removalDate", event.target.value)}
                    className="w-36 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    value={row.pattern ?? ""}
                    onChange={(event) => handleChange(index, "pattern", event.target.value)}
                    className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    value={row.storageLocation ?? ""}
                    onChange={(event) => handleChange(index, "storageLocation", event.target.value)}
                    className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    value={row.supplier ?? ""}
                    onChange={(event) => handleChange(index, "supplier", event.target.value)}
                    className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    value={row.buyerStaff ?? ""}
                    onChange={(event) => handleChange(index, "buyerStaff", event.target.value)}
                    className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    value={row.notes ?? ""}
                    onChange={(event) => handleChange(index, "notes", event.target.value)}
                    className="w-40 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={row.consignment ?? false}
                    onChange={(event) => handleChange(index, "consignment", event.target.checked)}
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
    </div>
  );
}
