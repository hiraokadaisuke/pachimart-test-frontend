"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "@/lib/supabaseClient";
import type { InventoryItem } from "@/types/inventory";
import { InventoryColumnSelectorModal } from "./InventoryColumnSelectorModal";
import { InventoryTable } from "./InventoryTable";
import { ALL_INVENTORY_COLUMN_OPTIONS } from "./columnOptions";

const fallbackInventory: InventoryItem[] = [
  {
    id: 1,
    status: "在庫中",
    category: "パチンコ",
    manufacturer: "三洋",
    modelName: "大海物語5",
    colorPanel: "ブルーパネル",
    inspectionNumber: "4P-123456",
    frameSerial: "FRM-00123",
    boardSerial: "BRD-98765",
    removalDate: "2024-07-15",
    warehouse: "東京第1倉庫",
    salePrice: undefined,
    saleDate: undefined,
    buyer: undefined,
  },
  {
    id: 2,
    status: "出品中",
    category: "パチスロ",
    manufacturer: "ユニバーサル",
    modelName: "バジリスク絆3",
    colorPanel: "レッドパネル",
    inspectionNumber: "6S-654321",
    frameSerial: "FRM-00456",
    boardSerial: "BRD-24680",
    removalDate: null,
    warehouse: "埼玉倉庫",
    salePrice: 320000,
    saleDate: undefined,
    buyer: undefined,
  },
  {
    id: 3,
    status: "成功済み",
    category: "パチンコ",
    manufacturer: "京楽",
    modelName: "冬のソナタ FOREVER",
    colorPanel: "ホワイトパネル",
    inspectionNumber: "4P-654987",
    frameSerial: "FRM-00999",
    boardSerial: "BRD-13579",
    removalDate: "2024-05-10",
    warehouse: "大阪倉庫",
    salePrice: 280000,
    saleDate: "2024-06-02",
    buyer: "ABCパチンコ",
  },
];

export function InventoryDashboard() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const [visibleColumnIds, setVisibleColumnIds] = useState(() =>
    ALL_INVENTORY_COLUMN_OPTIONS.filter((option) => option.defaultVisible).map((option) => option.id),
  );
  const [columnSelectionDraft, setColumnSelectionDraft] = useState(visibleColumnIds);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        console.warn("Supabase credentials are not set. Falling back to placeholder data.");
        setInventory(fallbackInventory);
        return;
      }

      const { data, error } = await supabase.from<InventoryItem>("inventories").select("*");

      if (error || !data) {
        console.error("Failed to fetch inventory from Supabase", error);
        setInventory(fallbackInventory);
        return;
      }

      setInventory(data);
    };

    fetchData();
  }, []);

  const filteredInventory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return inventory;

    return inventory.filter((item) =>
      [item.manufacturer, item.modelName, item.inspectionNumber].some((field) =>
        field.toLowerCase().includes(query),
      ),
    );
  }, [inventory, searchQuery]);

  const handleColumnToggle = () => {
    setColumnSelectionDraft(visibleColumnIds);
    setIsColumnSelectorOpen(true);
  };

  const handleCloseColumnSelector = () => {
    setIsColumnSelectorOpen(false);
  };

  const handleColumnSelectionSave = (selectedIds: typeof visibleColumnIds) => {
    setVisibleColumnIds(selectedIds);
    setIsColumnSelectorOpen(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: CSVインポート処理を実装
      console.log("CSV import stub", file.name);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "id",
      "status",
      "category",
      "manufacturer",
      "modelName",
      "colorPanel",
      "inspectionNumber",
      "frameSerial",
      "boardSerial",
      "removalDate",
      "warehouse",
      "salePrice",
      "saleDate",
      "buyer",
    ];

    const escapeCsv = (value: string | number | null | undefined) => {
      const normalized = value ?? "";
      const stringified = typeof normalized === "number" ? normalized.toString() : normalized;
      return `"${stringified.replace(/"/g, '""')}"`;
    };

    const rows = filteredInventory.map((item) =>
      [
        item.id,
        item.status,
        item.category,
        item.manufacturer,
        item.modelName,
        item.colorPanel,
        item.inspectionNumber,
        item.frameSerial,
        item.boardSerial,
        item.removalDate,
        item.warehouse,
        item.salePrice,
        item.saleDate,
        item.buyer,
      ]
        .map(escapeCsv)
        .join(","),
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventory.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFilter = () => {
    // TODO: フィルターモーダルを表示
    console.log("絞り込みの操作を開く準備");
  };

  const handleShowStats = () => {
    // TODO: 統計情報の表示処理を実装
    console.log("統計情報を表示する準備");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">在庫管理ダッシュボード</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"
              aria-label="通知"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.25 18.75a2.25 2.25 0 01-4.5 0m9-1.5H5.25a.75.75 0 01-.75-.75v-5.25a7.5 7.5 0 0115 0v5.25a.75.75 0 01-.75.75z"
                />
              </svg>
            </button>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
              <span>管理者</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-500">
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={handleColumnToggle}
            className="rounded border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            項目を表示/非表示する
          </button>

          <button
            type="button"
            onClick={handleImportClick}
            className="rounded border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            CSVインポート
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />

          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            CSVエクスポート
          </button>

          <div className="relative ml-auto flex w-full max-w-xl items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 shadow-inner md:w-auto md:flex-1 md:max-w-[520px]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5 text-slate-400"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.64 5.64a7.5 7.5 0 0010.01 10.01z" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="メーカー・機種名・検定番号で検索"
              className="ml-2 w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleFilter}
            className="rounded border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            絞り込み
          </button>

          <button
            type="button"
            onClick={handleShowStats}
            className="rounded border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            統計
          </button>
        </div>

        <InventoryTable items={filteredInventory} visibleColumnIds={visibleColumnIds} />

        <InventoryColumnSelectorModal
          isOpen={isColumnSelectorOpen}
          selectedColumnIds={columnSelectionDraft}
          onClose={handleCloseColumnSelector}
          onSave={handleColumnSelectionSave}
        />
      </div>
    </div>
  );
}
