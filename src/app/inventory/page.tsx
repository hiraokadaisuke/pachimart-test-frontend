"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { ColumnSettingsModal } from "@/components/inventory/ColumnSettingsModal";
import {
  formatCurrency,
  formatDate,
  loadColumnSettings,
  loadInventoryRecords,
  saveColumnSettings,
  updateInventoryStatus,
  type ColumnSetting,
  type InventoryRecord,
} from "@/lib/demo-data/demoInventory";
import type { InventoryStatusOption } from "@/types/purchaseInvoices";

const STATUS_OPTIONS: InventoryStatusOption[] = ["倉庫", "出品中", "売却済"];

type CellValue = {
  text: string;
};

const truncateText = (text: string, maxLength = 10) => {
  if (!text) return "-";
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const renderCell = (record: InventoryRecord, key: string): CellValue => {
  switch (key) {
    case "id":
      return { text: record.id };
    case "createdAt":
      return { text: formatDate(record.createdAt) };
    case "maker":
      return { text: record.maker || "-" };
    case "machineName":
      return { text: record.machineName || "-" };
    case "type":
      return { text: record.type || "-" };
    case "deviceType":
      return { text: record.deviceType || "-" };
    case "quantity":
      return { text: record.quantity?.toLocaleString() ?? "-" };
    case "unitPrice":
      return { text: formatCurrency(record.unitPrice) };
    case "remainingDebt":
      return { text: record.remainingDebt != null ? formatCurrency(record.remainingDebt) : "-" };
    case "dates":
      return {
        text: `入庫: ${formatDate(record.arrivalDate)} / 撤去: ${formatDate(record.removalDate)}`,
      };
    case "pattern":
      return { text: record.pattern || "-" };
    case "storageLocation":
      return { text: record.storageLocation || "-" };
    case "supplier":
      return { text: record.supplier || "-" };
    case "buyerStaff":
      return { text: record.buyerStaff || "-" };
    case "notes":
      return { text: record.notes || "-" };
    case "stockStatus":
      return { text: record.stockStatus };
    default:
      return { text: record.customFields?.[key] ?? "-" };
  }
};

export default function InventoryPage() {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [columns, setColumns] = useState<ColumnSetting[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showColumnModal, setShowColumnModal] = useState(false);

  useEffect(() => {
    setRecords(loadInventoryRecords());
    setColumns(loadColumnSettings());
  }, []);

  const visibleColumns = useMemo(
    () => [...columns].filter((col) => col.visible).sort((a, b) => a.order - b.order),
    [columns],
  );

  const filtered = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const sorted = [...records].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    if (!keyword) return sorted;

    return sorted.filter((item) => {
      const target = `${item.maker} ${item.machineName} ${item.supplier}`;
      return target.toLowerCase().includes(keyword);
    });
  }, [records, searchTerm]);

  const handleStatusChange = (id: string, status: InventoryStatusOption) => {
    const updated = updateInventoryStatus(id, status);
    setRecords(updated);
  };

  const handleColumnSave = (nextColumns: ColumnSetting[]) => {
    setColumns(nextColumns);
    saveColumnSettings(nextColumns);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">在庫一覧</h1>
          <p className="text-sm text-neutral-600">登録された在庫の確認やステータス更新、表示項目を調整できます。</p>
        </div>
        <Link
          href="/inventory/new"
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500"
        >
          在庫を登録
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            CSV出力
          </button>
          <Link
            href="/inventory/new"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            個別登録
          </Link>
          <button
            onClick={() => setShowColumnModal(true)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            表示項目設定
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="inventory-search" className="text-sm text-neutral-700">
            検索 / 絞り込み
          </label>
          <input
            id="inventory-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="メーカー名 / 機種名 / 仕入先"
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full table-auto divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-700">
            <tr>
              {visibleColumns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-3 py-3">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="px-3 py-6 text-center text-sm text-neutral-600">
                  登録された在庫がありません。
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  {visibleColumns.map((col) => {
                    const cellValue = renderCell(item, col.key);
                    const shouldTruncate = cellValue.text.length > 10;

                    return (
                      <td key={col.key} className="whitespace-nowrap px-3 py-3 align-top text-neutral-800">
                        {col.key === "stockStatus" ? (
                          <select
                            value={item.stockStatus}
                            onChange={(event) =>
                              handleStatusChange(item.id, event.target.value as InventoryStatusOption)
                            }
                            className="rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className="block max-w-[240px] truncate"
                            title={shouldTruncate ? cellValue.text : undefined}
                          >
                            {truncateText(cellValue.text)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ColumnSettingsModal
        open={showColumnModal}
        onClose={() => setShowColumnModal(false)}
        columns={columns}
        onSave={handleColumnSave}
      />
    </div>
  );
}
