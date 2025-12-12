"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import MainContainer from "@/components/layout/MainContainer";
import type { InventoryCategory } from "@/types/inventory";
import { addInventoryItems, type StoredInventoryItem } from "@/lib/inventory/storage";

const CATEGORY_OPTIONS: InventoryCategory[] = ["P本体", "S本体", "P枠", "Pセル"];

const USAGE_TYPE_OPTIONS: Array<"一次" | "二次"> = ["一次", "二次"];

const parseNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
};

type InventoryFormRow = {
  purchaseSource: string;
  purchaseRepresentative: string;
  taxCategory: string;
  isConsignment: boolean;
  category: InventoryCategory;
  manufacturer: string;
  modelName: string;
  colorPanel: string;
  inspectionNumber: string;
  frameSerial: string;
  boardSerial: string;
  removalDate: string;
  usageType: "一次" | "二次";
  warehouse: string;
  purchasePriceExTax: string;
  purchasePriceIncTax: string;
  saleDate: string;
  saleDestination: string;
  salePriceExTax: string;
  salePriceIncTax: string;
  stockInDate: string;
  stockOutDate: string;
  stockOutDestination: string;
  note: string;
  externalCompany: string;
  externalStore: string;
  serialNumber: string;
  inspectionInfo: string;
  listingId: string;
  installDate: string;
  inspectionDate: string;
  approvalDate: string;
  hasDocuments: boolean;
};

const createEmptyRow = (): InventoryFormRow => ({
  purchaseSource: "",
  purchaseRepresentative: "",
  taxCategory: "",
  isConsignment: false,
  category: "P本体",
  manufacturer: "",
  modelName: "",
  colorPanel: "",
  inspectionNumber: "",
  frameSerial: "",
  boardSerial: "",
  removalDate: "",
  usageType: "一次",
  warehouse: "",
  purchasePriceExTax: "",
  purchasePriceIncTax: "",
  saleDate: "",
  saleDestination: "",
  salePriceExTax: "",
  salePriceIncTax: "",
  stockInDate: "",
  stockOutDate: "",
  stockOutDestination: "",
  note: "",
  externalCompany: "",
  externalStore: "",
  serialNumber: "",
  inspectionInfo: "",
  listingId: "",
  installDate: "",
  inspectionDate: "",
  approvalDate: "",
  hasDocuments: false,
});

export default function InventoryNewPage() {
  const router = useRouter();
  const [rows, setRows] = useState<InventoryFormRow[]>([createEmptyRow()]);

  const handleRowChange = <K extends keyof InventoryFormRow>(
    index: number,
    key: K,
    value: InventoryFormRow[K],
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  };

  const addEmptyLine = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const copyPreviousLine = () => {
    setRows((prev) => {
      const lastRow = prev[prev.length - 1] ?? createEmptyRow();
      return [...prev, { ...lastRow }];
    });
  };

  const newItems = useMemo(() => {
    return rows.map<StoredInventoryItem>((row, index) => {
      return {
        id: Date.now() + index,
        status: "倉庫",
        listingStatus: "UNLISTED",
        category: row.category,
        manufacturer: row.manufacturer,
        modelName: row.modelName,
        colorPanel: row.colorPanel,
        inspectionNumber: row.inspectionNumber,
        frameSerial: row.frameSerial,
        boardSerial: row.boardSerial,
        removalDate: row.removalDate ? row.removalDate : null,
        usageType: row.usageType,
        warehouse: row.warehouse,
        note: row.note,
        installDate: row.installDate || null,
        inspectionDate: row.inspectionDate || null,
        approvalDate: row.approvalDate || null,
        purchaseSource: row.purchaseSource,
        purchaseRepresentative: row.purchaseRepresentative,
        taxCategory: row.taxCategory,
        isConsignment: row.isConsignment,
        purchasePriceExTax: parseNumber(row.purchasePriceExTax),
        purchasePriceIncTax: parseNumber(row.purchasePriceIncTax),
        saleDate: row.saleDate ? row.saleDate : null,
        saleDestination: row.saleDestination,
        salePriceExTax: parseNumber(row.salePriceExTax),
        salePriceIncTax: parseNumber(row.salePriceIncTax),
        externalCompany: row.externalCompany,
        externalStore: row.externalStore,
        stockInDate: row.stockInDate ? row.stockInDate : null,
        stockOutDate: row.stockOutDate ? row.stockOutDate : null,
        stockOutDestination: row.stockOutDestination,
        serialNumber: row.serialNumber,
        inspectionInfo: row.inspectionInfo,
        listingId: row.listingId,
        hasDocuments: row.hasDocuments,
      } satisfies StoredInventoryItem;
    });
  }, [rows]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addInventoryItems(newItems);
    router.push("/inventory");
  };

  return (
    <MainContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">在庫登録</h1>
          <p className="mt-2 text-sm text-neutral-600">
            仕入れ先情報を1行目、機種情報と取引情報を2行目に入力し、複数行まとめて保存できます。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addEmptyLine}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500"
          >
            行を追加
          </button>
          <button
            type="button"
            onClick={copyPreviousLine}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-slate-50"
          >
            直前の行をコピー
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {rows.map((row, index) => (
            <div key={`inventory-row-${index}`} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-neutral-900">登録行 {index + 1}</div>
                <div className="text-xs text-neutral-500">共通情報</div>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  仕入先（購入元）
                  <input
                    type="text"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.purchaseSource}
                    onChange={(e) => handleRowChange(index, "purchaseSource", e.target.value)}
                    placeholder="例: 〇〇商事"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  仕入担当
                  <input
                    type="text"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.purchaseRepresentative}
                    onChange={(e) => handleRowChange(index, "purchaseRepresentative", e.target.value)}
                    placeholder="担当者名"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  消費税区分
                  <input
                    type="text"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.taxCategory}
                    onChange={(e) => handleRowChange(index, "taxCategory", e.target.value)}
                    placeholder="10% / 非課税 など"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={row.isConsignment}
                      onChange={(e) => handleRowChange(index, "isConsignment", e.target.checked)}
                    />
                    委託取引
                  </span>
                </label>
              </div>

              <div className="text-xs text-neutral-500">機種情報・取引情報</div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  種別
                  <select
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.category}
                    onChange={(e) => handleRowChange(index, "category", e.target.value as InventoryCategory)}
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  メーカー
                  <input
                    type="text"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.manufacturer}
                    onChange={(e) => handleRowChange(index, "manufacturer", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  機種名
                  <input
                    type="text"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.modelName}
                    onChange={(e) => handleRowChange(index, "modelName", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  枠色／パネル
                  <input
                    type="text"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.colorPanel}
                    onChange={(e) => handleRowChange(index, "colorPanel", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  遊技盤番号
                  <input
                    type="text"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.inspectionNumber}
                    onChange={(e) => handleRowChange(index, "inspectionNumber", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  枠番号
                  <input
                    type="text"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.frameSerial}
                    onChange={(e) => handleRowChange(index, "frameSerial", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  主要基板番号
                  <input
                    type="text"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.boardSerial}
                    onChange={(e) => handleRowChange(index, "boardSerial", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  撤去日
                  <input
                    type="date"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.removalDate}
                    onChange={(e) => handleRowChange(index, "removalDate", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  使用次
                  <select
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.usageType}
                    onChange={(e) => handleRowChange(index, "usageType", e.target.value as "一次" | "二次")}
                  >
                    {USAGE_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  倉庫
                  <input
                    type="text"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.warehouse}
                    onChange={(e) => handleRowChange(index, "warehouse", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  購入金額（税抜）
                  <input
                    type="number"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.purchasePriceExTax}
                    onChange={(e) => handleRowChange(index, "purchasePriceExTax", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  購入金額（税込）
                  <input
                    type="number"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.purchasePriceIncTax}
                    onChange={(e) => handleRowChange(index, "purchasePriceIncTax", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  売却日
                  <input
                    type="date"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.saleDate}
                    onChange={(e) => handleRowChange(index, "saleDate", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  売却先
                  <input
                    type="text"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.saleDestination}
                    onChange={(e) => handleRowChange(index, "saleDestination", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  売却金額（税抜）
                  <input
                    type="number"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.salePriceExTax}
                    onChange={(e) => handleRowChange(index, "salePriceExTax", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  売却金額（税込）
                  <input
                    type="number"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.salePriceIncTax}
                    onChange={(e) => handleRowChange(index, "salePriceIncTax", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  入庫日
                  <input
                    type="date"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.stockInDate}
                    onChange={(e) => handleRowChange(index, "stockInDate", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  出庫日
                  <input
                    type="date"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.stockOutDate}
                    onChange={(e) => handleRowChange(index, "stockOutDate", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  出庫先
                  <input
                    type="text"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.stockOutDestination}
                    onChange={(e) => handleRowChange(index, "stockOutDestination", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700 md:col-span-3">
                  備考
                  <textarea
                    className="min-h-[80px] rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.note}
                    onChange={(e) => handleRowChange(index, "note", e.target.value)}
                    placeholder="取引メモや特記事項を入力"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  設置日
                  <input
                    type="date"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.installDate}
                    onChange={(e) => handleRowChange(index, "installDate", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  検査日
                  <input
                    type="date"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.inspectionDate}
                    onChange={(e) => handleRowChange(index, "inspectionDate", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  承認日
                  <input
                    type="date"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.approvalDate}
                    onChange={(e) => handleRowChange(index, "approvalDate", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  外部法人
                  <input
                    type="text"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.externalCompany}
                    onChange={(e) => handleRowChange(index, "externalCompany", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  外部店舗
                  <input
                    type="text"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.externalStore}
                    onChange={(e) => handleRowChange(index, "externalStore", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  シリアル番号
                  <input
                    type="text"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.serialNumber}
                    onChange={(e) => handleRowChange(index, "serialNumber", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  検査情報
                  <input
                    type="text"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.inspectionInfo}
                    onChange={(e) => handleRowChange(index, "inspectionInfo", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  掲載ID
                  <input
                    type="text"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={row.listingId}
                    onChange={(e) => handleRowChange(index, "listingId", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={row.hasDocuments}
                      onChange={(e) => handleRowChange(index, "hasDocuments", e.target.checked)}
                    />
                    書類あり
                  </span>
                </label>
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500"
            >
              在庫を登録
            </button>
          </div>
        </form>
      </div>
    </MainContainer>
  );
}
