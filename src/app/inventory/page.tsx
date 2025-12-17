"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  ColumnSettingsModal,
} from "@/components/inventory/ColumnSettingsModal";
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

const renderCell = (record: InventoryRecord, key: string) => {
  switch (key) {
    case "id":
      return record.id;
    case "createdAt":
      return formatDate(record.createdAt);
    case "maker":
      return record.maker || "-";
    case "machineName":
      return record.machineName || "-";
    case "type":
      return record.type || "-";
    case "deviceType":
      return record.deviceType || "-";
    case "quantity":
      return record.quantity?.toLocaleString() ?? "-";
    case "unitPrice":
      return formatCurrency(record.unitPrice);
    case "remainingDebt":
      return record.remainingDebt != null ? formatCurrency(record.remainingDebt) : "-";
    case "dates":
      return (
        <div className="flex flex-col gap-1 text-sm text-neutral-800 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-xs text-slate-500 sm:text-sm">入庫: {formatDate(record.arrivalDate)}</span>
          <span className="text-xs text-slate-500 sm:text-sm">撤去: {formatDate(record.removalDate)}</span>
        </div>
      );
    case "pattern":
      return record.pattern || "-";
    case "storageLocation":
      return record.storageLocation || "-";
    case "supplier":
      return record.supplier || "-";
    case "buyerStaff":
      return record.buyerStaff || "-";
    case "notes":
      return record.notes || "-";
    case "stockStatus":
      return record.stockStatus;
    default:
      return record.customFields?.[key] ?? "";
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

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-700">
            <tr>
              {visibleColumns.map((col) => (
                <th key={col.key} className="px-3 py-3 whitespace-nowrap">
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
                  {visibleColumns.map((col) => (
                    <td key={col.key} className="px-3 py-3 align-top text-neutral-800">
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
                        renderCell(item, col.key)
                      )}
                    </td>
                  ))}
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
