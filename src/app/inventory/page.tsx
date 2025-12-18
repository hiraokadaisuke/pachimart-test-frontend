"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent } from "react";
import Link from "next/link";

import {
  loadInventoryRecords,
  resetInventoryRecords,
  updateInventoryStatuses,
  updateInventoryStatus,
  type InventoryRecord,
} from "@/lib/demo-data/demoInventory";
import type { InventoryStatusOption } from "@/types/purchaseInvoices";

type Column = {
  key: keyof InventoryRecord | "status";
  label: string;
  width: number;
  minWidth: number;
};

const RESERVED_SELECTION_WIDTH = 48;

const STATUS_OPTIONS: InventoryStatusOption[] = ["倉庫", "出品中", "売却済"];

const INITIAL_COLUMNS: Column[] = [
  { key: "id", label: "在庫ID", width: 120, minWidth: 80 },
  { key: "createdAt", label: "在庫入力日", width: 120, minWidth: 80 },
  { key: "maker", label: "メーカー名", width: 120, minWidth: 78 },
  { key: "model", label: "機種名", width: 140, minWidth: 110 },
  { key: "kind", label: "種別", width: 70, minWidth: 56 },
  { key: "type", label: "タイプ", width: 80, minWidth: 60 },
  { key: "quantity", label: "仕入数", width: 78, minWidth: 56 },
  { key: "unitPrice", label: "仕入単価", width: 110, minWidth: 80 },
  { key: "saleUnitPrice", label: "販売単価", width: 110, minWidth: 80 },
  { key: "stockInDate", label: "入庫日", width: 110, minWidth: 80 },
  { key: "removeDate", label: "撤去日", width: 110, minWidth: 80 },
  { key: "warehouse", label: "保管先", width: 120, minWidth: 82 },
  { key: "supplier", label: "仕入先", width: 120, minWidth: 82 },
  { key: "staff", label: "担当者", width: 110, minWidth: 70 },
  { key: "status", label: "状況", width: 120, minWidth: 92 },
  { key: "note", label: "備考", width: 150, minWidth: 90 },
];

const truncateText = (text: string) => {
  if (!text) return "-";
  if (text.length <= 12) return text;
  return `${text.slice(0, 12)}...`;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("ja-JP");
};

export default function InventoryPage() {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [searchTerm, setSearchTerm] = useState("");
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<{ key: string; position: "left" | "right" } | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setRecords(loadInventoryRecords());
  }, []);

  useEffect(() => {
    if (!tableRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(tableRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerWidth) return;
    setColumns((prev) => {
      const total = prev.reduce((sum, col) => sum + col.width, 0);
      const availableWidth = Math.max(containerWidth - RESERVED_SELECTION_WIDTH, 0);
      if (total <= availableWidth) return prev;
      const scale = availableWidth / total;
      return prev.map((col) => ({
        ...col,
        width: Math.max(col.minWidth, Math.floor(col.width * scale)),
      }));
    });
  }, [containerWidth]);

  const visibleColumns = useMemo(() => columns, [columns]);

  const filtered = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const sorted = [...records].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    if (!keyword) return sorted;

    return sorted.filter((item) => {
      const target = `${item.maker ?? ""} ${item.model ?? item.machineName ?? ""} ${item.supplier ?? ""}`;
      return target.toLowerCase().includes(keyword);
    });
  }, [records, searchTerm]);

  const handleStatusChange = (id: string, status: InventoryStatusOption) => {
    const updated = updateInventoryStatus(id, status);
    setRecords(updated);
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filtered.map((item) => item.id)));
      return;
    }
    setSelectedIds(new Set());
  };

  const handleBulkUpdate = (status: InventoryStatusOption) => {
    if (selectedIds.size === 0) {
      alert("行を選択してください");
      return;
    }

    const message = `${selectedIds.size}件を${status}に変更します。よろしいですか？`;
    const confirmed = window.confirm(message);
    if (!confirmed) return;

    const updated = updateInventoryStatuses([...selectedIds], status);
    setRecords(updated);
    setSelectedIds(new Set());
  };

  const getCellText = (record: InventoryRecord, key: string) => {
    switch (key) {
      case "id":
        return record.id;
      case "createdAt":
        return formatDate(record.createdAt);
      case "maker":
        return record.maker ?? "-";
      case "model":
        return record.model ?? record.machineName ?? "-";
      case "kind":
        return record.kind ?? "-";
      case "type":
        return record.type ?? record.deviceType ?? "-";
      case "quantity":
        return record.quantity != null ? record.quantity.toLocaleString() : "-";
      case "unitPrice":
        return record.unitPrice != null ? record.unitPrice.toLocaleString() : "-";
      case "saleUnitPrice":
        return record.saleUnitPrice != null ? record.saleUnitPrice.toLocaleString() : "-";
      case "stockInDate":
        return formatDate(record.stockInDate ?? record.arrivalDate);
      case "removeDate":
        return formatDate(record.removeDate ?? record.removalDate);
      case "pattern":
        return record.pattern ?? "-";
      case "warehouse":
        return record.warehouse ?? record.storageLocation ?? "-";
      case "supplier":
        return record.supplier ?? "-";
      case "staff":
        return record.staff ?? record.buyerStaff ?? "-";
      case "note":
        return record.note ?? record.notes ?? "-";
      default:
        return "-";
    }
  };

  const handleDragStart = (key: string) => setDraggingKey(key);

  const handleDragOver = (event: ReactDragEvent<HTMLTableCellElement>, key: string) => {
    event.preventDefault();
    if (!draggingKey || draggingKey === key) return;
    const target = event.currentTarget;
    const { offsetX } = event.nativeEvent as DragEvent;
    if (!target) return;
    const position = offsetX < target.clientWidth / 2 ? "left" : "right";
    setDragOver({ key, position });
  };

  const handleDrop = (key: string) => {
    if (!draggingKey || draggingKey === key || !dragOver) {
      setDragOver(null);
      setDraggingKey(null);
      return;
    }
    setColumns((prev) => {
      const currentIndex = prev.findIndex((col) => col.key === draggingKey);
      const targetIndex = prev.findIndex((col) => col.key === key);
      if (currentIndex === -1 || targetIndex === -1) return prev;
      const next = [...prev];
      const [removed] = next.splice(currentIndex, 1);
      const insertIndex = dragOver.position === "left" ? targetIndex : targetIndex + 1;
      next.splice(insertIndex > currentIndex ? insertIndex - 1 : insertIndex, 0, removed);
      return next;
    });
    setDragOver(null);
    setDraggingKey(null);
  };

  const handleResetData = () => {
    resetInventoryRecords();
    setRecords([]);
  };

  const applyResize = (index: number, targetWidth: number) => {
    setColumns((prev) => {
      const next = prev.map((col) => ({ ...col }));
      const minWidth = next[index].minWidth;
      next[index].width = Math.max(minWidth, targetWidth);

      if (!containerWidth) return next;

      const availableWidth = Math.max(containerWidth - RESERVED_SELECTION_WIDTH, 0);

      let total = next.reduce((sum, col) => sum + col.width, 0);
      if (total <= availableWidth) return next;

      let excess = total - availableWidth;
      const adjustable = next
        .map((col, idx) => ({ idx, room: col.width - col.minWidth }))
        .filter(({ idx, room }) => idx !== index && room > 0);

      for (const item of adjustable) {
        if (excess <= 0) break;
        const reduce = Math.min(item.room, excess);
        next[item.idx].width -= reduce;
        excess -= reduce;
      }

      if (excess > 0) {
        const target = next[index];
        const reducible = Math.max(target.width - target.minWidth, 0);
        const reduce = Math.min(reducible, excess);
        target.width -= reduce;
        excess -= reduce;
      }

      if (excess > 0) {
        next[index].width = Math.max(minWidth, next[index].width - excess);
      }

      total = next.reduce((sum, col) => sum + col.width, 0);
      if (total > availableWidth) {
        const scale = availableWidth / total;
        return next.map((col) => ({ ...col, width: Math.max(col.minWidth, Math.floor(col.width * scale)) }));
      }

      return next;
    });
  };

  const handleResizeStart = (event: React.MouseEvent, index: number) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = columns[index].width;

    const onMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      applyResize(index, startWidth + delta);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">在庫一覧</h1>
          <p className="text-sm text-neutral-600">登録された在庫の確認やステータス更新、表示項目を調整できます。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleResetData}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            データ初期化
          </button>
          <Link
            href="/inventory/new"
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500"
          >
            在庫を登録
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-700">
          <span className="font-semibold">表示操作：</span>
          <span>ヘッダーをドラッグして並び替え</span>
          <span className="ml-2">|</span>
          <span>右端ハンドルで列幅調整</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleBulkUpdate("売却済")}
              disabled={selectedIds.size === 0}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              一括：売却済
            </button>
            <button
              type="button"
              onClick={() => handleBulkUpdate("出品中")}
              disabled={selectedIds.size === 0}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              一括：出品中
            </button>
            <button
              type="button"
              onClick={() => handleBulkUpdate("倉庫")}
              disabled={selectedIds.size === 0}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              一括：倉庫
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
      </div>

      <div ref={tableRef} className="w-full rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full table-fixed border-collapse text-sm">
          <thead className="bg-slate-50 text-left text-sm font-semibold text-slate-700">
            <tr>
              <th className="w-10 border-r border-slate-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedIds.size === filtered.length}
                  onChange={(event) => handleSelectAll(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
                />
              </th>
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  draggable
                  onDragStart={() => handleDragStart(String(col.key))}
                  onDragOver={(event) => handleDragOver(event, String(col.key))}
                  onDrop={() => handleDrop(String(col.key))}
                  className="relative select-none border-r border-slate-200 px-3 py-2"
                  style={{ width: `${col.width}px`, minWidth: `${col.minWidth}px` }}
                >
                  <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                    <span
                      className={`flex-1 truncate rounded px-2 py-1 ${dragOver?.key === col.key ? "bg-sky-50" : ""}`}
                    >
                      {col.label}
                    </span>
                    <span
                      className="h-6 w-1 cursor-col-resize rounded bg-slate-300"
                      onMouseDown={(event) => handleResizeStart(event, visibleColumns.findIndex((c) => c.key === col.key))}
                    />
                  </div>
                  {dragOver && dragOver.key === col.key && (
                    <div
                      className={`absolute inset-y-1 ${dragOver.position === "left" ? "left-1" : "right-1"} w-0.5 bg-sky-500`}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="px-3 py-6 text-center text-sm text-neutral-600">
                  登録された在庫がありません。
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 text-sm hover:bg-sky-50">
                  <td className="w-10 border-r border-slate-100 px-3 py-2 align-middle">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => handleSelectRow(item.id)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
                    />
                  </td>
                  {visibleColumns.map((col) => {
                    const fullText = getCellText(item, String(col.key));
                    const statusValue = (item.status ?? item.stockStatus ?? "倉庫") as InventoryStatusOption;

                    return (
                      <td
                        key={col.key}
                        className="whitespace-nowrap border-r border-slate-100 px-3 py-2 align-middle text-neutral-800"
                        style={{ width: `${col.width}px`, minWidth: `${col.minWidth}px` }}
                      >
                        {col.key === "status" ? (
                          <select
                            value={statusValue}
                            onChange={(event) => handleStatusChange(item.id, event.target.value as InventoryStatusOption)}
                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="block max-w-full truncate" title={fullText}>
                            {truncateText(fullText)}
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
    </div>
  );
}
