"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent } from "react";
import Link from "next/link";

import {
  loadInventoryRecords,
  resetInventoryRecords,
  updateInventoryRecord,
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
  visible?: boolean;
  order?: number;
};

const RESERVED_SELECTION_WIDTH = 48;
const ACTIONS_COLUMN_WIDTH = 96;
const COLUMN_SETTINGS_KEY = "inventory_table_columns_v1";

const STATUS_OPTIONS: InventoryStatusOption[] = ["倉庫", "出品中", "売却済"];

const INITIAL_COLUMNS: Column[] = [
  { key: "id", label: "在庫ID", width: 100, minWidth: 60, visible: true },
  { key: "createdAt", label: "在庫入力日", width: 90, minWidth: 58, visible: true },
  { key: "maker", label: "メーカー名", width: 104, minWidth: 70, visible: true },
  { key: "model", label: "機種名", width: 124, minWidth: 84, visible: true },
  { key: "kind", label: "種別", width: 56, minWidth: 44, visible: true },
  { key: "type", label: "タイプ", width: 64, minWidth: 44, visible: true },
  { key: "quantity", label: "仕入数", width: 66, minWidth: 48, visible: true },
  { key: "unitPrice", label: "仕入単価", width: 86, minWidth: 60, visible: true },
  { key: "saleUnitPrice", label: "販売単価", width: 86, minWidth: 60, visible: true },
  { key: "stockInDate", label: "入庫日", width: 88, minWidth: 62, visible: true },
  { key: "removeDate", label: "撤去日", width: 88, minWidth: 62, visible: true },
  { key: "warehouse", label: "保管先", width: 98, minWidth: 70, visible: true },
  { key: "supplier", label: "仕入先", width: 98, minWidth: 70, visible: true },
  { key: "staff", label: "担当者", width: 82, minWidth: 58, visible: true },
  { key: "status", label: "状況", width: 98, minWidth: 74, visible: true },
  { key: "isVisible", label: "表示", width: 70, minWidth: 52, visible: true },
  { key: "note", label: "備考", width: 112, minWidth: 78, visible: true },
];

const truncateText = (text: string) => {
  if (!text) return "-";
  if (text.length <= 10) return text;
  return `${text.slice(0, 8)}...`;
};

const shortenId = (id: string) => {
  if (id.length <= 10) return id;
  return `${id.slice(0, 5)}...${id.slice(-3)}`;
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
  const [columnEditorOpen, setColumnEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InventoryRecord | null>(null);
  const [editingForm, setEditingForm] = useState<Partial<InventoryRecord> | null>(null);

  useEffect(() => {
    setRecords(loadInventoryRecords());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(COLUMN_SETTINGS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Column[];
      const savedMap = new Map(saved.map((col) => [col.key, col]));
      setColumns(() => {
        const withSaved = INITIAL_COLUMNS.map((col, index) => {
          const target = savedMap.get(col.key);
          return {
            ...col,
            width: target?.width ?? col.width,
            visible: target?.visible ?? col.visible ?? true,
            order: target?.order ?? index,
          };
        });
        return withSaved.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      });
    } catch (error) {
      console.error("列設定の読み込みに失敗しました", error);
    }
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
      const visible = prev.filter((col) => col.visible !== false);
      const total = visible.reduce((sum, col) => sum + col.width, 0);
      const availableWidth = Math.max(containerWidth - RESERVED_SELECTION_WIDTH - ACTIONS_COLUMN_WIDTH, 0);
      if (total <= availableWidth) return prev;
      const scale = availableWidth / total;
      return prev.map((col) => ({
        ...col,
        width: Math.max(col.minWidth, Math.floor(col.width * scale)),
      }));
    });
  }, [containerWidth]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = columns.map((col, index) => ({
      key: col.key,
      label: col.label,
      width: col.width,
      minWidth: col.minWidth,
      visible: col.visible ?? true,
      order: col.order ?? index,
    }));
    window.localStorage.setItem(COLUMN_SETTINGS_KEY, JSON.stringify(payload));
  }, [columns]);

  const visibleColumns = useMemo(() => columns.filter((col) => col.visible !== false), [columns]);

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

  const handleUpdateRecord = (id: string, payload: Partial<InventoryRecord>) => {
    const updated = updateInventoryRecord(id, payload);
    setRecords(updated);
  };

  const handleVisibilityChange = (id: string, visible: boolean) => {
    handleUpdateRecord(id, { isVisible: visible });
  };

  const openEditor = (record: InventoryRecord) => {
    setEditingRecord(record);
    setEditingForm({
      maker: record.maker ?? "",
      model: record.model ?? record.machineName ?? "",
      kind: record.kind,
      type: (record.type as InventoryRecord["type"]) ?? "",
      quantity: record.quantity ?? 0,
      unitPrice: record.unitPrice ?? 0,
      saleUnitPrice: record.saleUnitPrice ?? 0,
      stockInDate: record.stockInDate ?? record.arrivalDate ?? "",
      removeDate: record.removeDate ?? record.removalDate ?? "",
      warehouse: record.warehouse ?? record.storageLocation ?? "",
      supplier: record.supplier ?? "",
      staff: record.staff ?? record.buyerStaff ?? "",
      status: (record.status ?? "倉庫") as InventoryStatusOption,
      note: record.note ?? record.notes ?? "",
      isVisible: record.isVisible ?? true,
      pattern: record.pattern ?? "",
    });
  };

  const closeEditor = () => {
    setEditingRecord(null);
    setEditingForm(null);
  };

  const handleEditSubmit = () => {
    if (!editingRecord || !editingForm) return;
    const payload: Partial<InventoryRecord> = {
      maker: editingForm.maker?.trim() || undefined,
      model: editingForm.model?.trim() || undefined,
      machineName: editingForm.model?.trim() || undefined,
      kind: editingForm.kind ?? undefined,
      type: editingForm.type ?? undefined,
      quantity: typeof editingForm.quantity === "number" ? editingForm.quantity : Number(editingForm.quantity ?? 0),
      unitPrice:
        typeof editingForm.unitPrice === "number" ? editingForm.unitPrice : Number(editingForm.unitPrice ?? 0),
      saleUnitPrice:
        typeof editingForm.saleUnitPrice === "number"
          ? editingForm.saleUnitPrice
          : Number(editingForm.saleUnitPrice ?? 0),
      stockInDate: editingForm.stockInDate || undefined,
      arrivalDate: editingForm.stockInDate || undefined,
      removeDate: editingForm.removeDate || undefined,
      removalDate: editingForm.removeDate || undefined,
      pattern: editingForm.pattern?.trim() || undefined,
      warehouse: editingForm.warehouse?.trim() || undefined,
      storageLocation: editingForm.warehouse?.trim() || undefined,
      supplier: editingForm.supplier?.trim() || undefined,
      staff: editingForm.staff?.trim() || undefined,
      buyerStaff: editingForm.staff?.trim() || undefined,
      status: (editingForm.status ?? "倉庫") as InventoryStatusOption,
      stockStatus: (editingForm.status ?? "倉庫") as InventoryStatusOption,
      note: editingForm.note?.trim() || undefined,
      notes: editingForm.note?.trim() || undefined,
      isVisible: editingForm.isVisible ?? true,
    };
    handleUpdateRecord(editingRecord.id, payload);
    closeEditor();
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
      case "isVisible":
        return record.isVisible === false ? "しない" : "する";
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

  const toggleColumnVisibility = (key: Column["key"], visible: boolean) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.key === key
          ? {
              ...col,
              visible,
            }
          : col,
      ),
    );
  };

  const handleResetColumns = () => {
    setColumns(INITIAL_COLUMNS.map((col, index) => ({ ...col, order: index })));
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

      const visibleIndices = next
        .map((col, idx) => ({ idx, col }))
        .filter(({ col }) => col.visible !== false)
        .map(({ idx }) => idx);

      const availableWidth = Math.max(containerWidth - RESERVED_SELECTION_WIDTH - ACTIONS_COLUMN_WIDTH, 0);

      let total = visibleIndices.reduce((sum, idx) => sum + next[idx].width, 0);
      if (total <= availableWidth) return next;

      let excess = total - availableWidth;
      const adjustable = visibleIndices
        .map((idx) => ({ idx, room: next[idx].width - next[idx].minWidth }))
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

      total = visibleIndices.reduce((sum, idx) => sum + next[idx].width, 0);
      if (total > availableWidth) {
        const scale = availableWidth / total;
        return next.map((col, idx) =>
          visibleIndices.includes(idx)
            ? { ...col, width: Math.max(col.minWidth, Math.floor(col.width * scale)) }
            : col,
        );
      }

      return next;
    });
  };

  const handleResizeStart = (event: React.MouseEvent, index: number) => {
    event.preventDefault();
    event.stopPropagation();
    if (index < 0) return;
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
          <button
            type="button"
            onClick={() => setColumnEditorOpen(true)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            表示項目編集
          </button>
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
        <table className="min-w-full table-fixed border-collapse text-[13px]">
          <thead className="bg-slate-50 text-left font-semibold text-slate-700">
            <tr>
              <th className="w-10 border-r border-slate-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedIds.size === filtered.length}
                  onChange={(event) => handleSelectAll(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
                />
              </th>
              {visibleColumns.map((col) => {
                const columnIndex = columns.findIndex((c) => c.key === col.key);
                return (
                  <th
                    key={col.key}
                    draggable
                    onDragStart={() => handleDragStart(String(col.key))}
                    onDragOver={(event) => handleDragOver(event, String(col.key))}
                    onDrop={() => handleDrop(String(col.key))}
                    className="relative select-none border-r border-slate-200 px-2 py-2"
                    style={{ width: `${col.width}px`, minWidth: `${col.minWidth}px` }}
                  >
                    <div className="flex items-center justify-between gap-1 whitespace-nowrap">
                      <span
                        className={`flex-1 truncate rounded px-2 py-1 ${dragOver?.key === col.key ? "bg-sky-50" : ""}`}
                      >
                        {col.label}
                      </span>
                      <span
                        className="h-6 w-1 cursor-col-resize rounded bg-slate-300"
                        onMouseDown={(event) => handleResizeStart(event, columnIndex)}
                      />
                    </div>
                    {dragOver && dragOver.key === col.key && (
                      <div
                        className={`absolute inset-y-1 ${dragOver.position === "left" ? "left-1" : "right-1"} w-0.5 bg-sky-500`}
                      />
                    )}
                  </th>
                );
              })}
              <th className="border-l border-slate-200 px-3 py-2 text-center" style={{ width: `${ACTIONS_COLUMN_WIDTH}px` }}>
                編集
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 2} className="px-3 py-6 text-center text-sm text-neutral-600">
                  登録された在庫がありません。
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 text-[13px] hover:bg-sky-50">
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
                    const displayText = col.key === "id" ? shortenId(fullText) : truncateText(fullText);

                    return (
                      <td
                        key={col.key}
                        className="whitespace-nowrap border-r border-slate-100 px-2 py-2 align-middle text-neutral-800"
                        style={{ width: `${col.width}px`, minWidth: `${col.minWidth}px` }}
                      >
                        {col.key === "status" ? (
                          <select
                            value={statusValue}
                            onChange={(event) => handleStatusChange(item.id, event.target.value as InventoryStatusOption)}
                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-[13px] shadow-sm focus:border-sky-500 focus:outline-none"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : col.key === "isVisible" ? (
                          <div className="flex items-center justify-center">
                            <select
                              value={item.isVisible === false ? "0" : "1"}
                              onChange={(event) => handleVisibilityChange(item.id, event.target.value === "1")}
                              className="w-[72px] rounded-md border border-slate-300 px-1 py-1 text-[13px] shadow-sm focus:border-sky-500 focus:outline-none"
                            >
                              <option value="1">する</option>
                              <option value="0">しない</option>
                            </select>
                          </div>
                        ) : (
                          <span className="block max-w-full truncate" title={fullText}>
                            {displayText}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="border-l border-slate-100 px-3 py-2 text-center align-middle">
                    <button
                      type="button"
                      onClick={() => openEditor(item)}
                      className="inline-flex h-8 items-center justify-center rounded border border-slate-300 px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      編集
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {columnEditorOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">表示項目を編集</h3>
                <p className="text-xs text-neutral-600">チェックを外すと列が非表示になります。設定はブラウザに保存されます。</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetColumns}
                  className="rounded border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  初期化
                </button>
                <button
                  type="button"
                  onClick={() => setColumnEditorOpen(false)}
                  className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  閉じる
                </button>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
              <div className="grid grid-cols-2 gap-3">
                {columns.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center justify-between gap-3 rounded border border-slate-200 px-3 py-2 text-sm text-neutral-800 shadow-sm"
                  >
                    <span className="flex-1 truncate">{col.label}</span>
                    <input
                      type="checkbox"
                      checked={col.visible !== false}
                      onChange={(event) => toggleColumnVisibility(col.key, event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {editingRecord && editingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">{editingRecord.id}</p>
                <h3 className="text-lg font-semibold text-neutral-900">在庫を編集</h3>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                閉じる
              </button>
            </div>
            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-4 py-4 text-sm text-neutral-800">
              <div className="grid grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-neutral-600">種別</span>
                  <select
                    value={editingForm.kind ?? ""}
                    onChange={(event) =>
                      setEditingForm((prev) =>
                        prev ? { ...prev, kind: event.target.value as InventoryRecord["kind"] } : prev,
                      )
                    }
                    className="w-full rounded border border-slate-300 px-2 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  >
                    <option value="">-</option>
                    <option value="P">P</option>
                    <option value="S">S</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-neutral-600">メーカー</span>
                  <input
                    value={editingForm.maker ?? ""}
                    onChange={(event) => setEditingForm((prev) => (prev ? { ...prev, maker: event.target.value } : prev))}
                    className="w-full rounded border border-slate-300 px-2 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-neutral-600">機種名</span>
                  <input
                    value={editingForm.model ?? ""}
                    onChange={(event) => setEditingForm((prev) => (prev ? { ...prev, model: event.target.value } : prev))}
                    className="w-full rounded border border-slate-300 px-2 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-neutral-600">タイプ</span>
                  <input
                    value={(editingForm.type as string) ?? ""}
                    onChange={(event) => setEditingForm((prev) => (prev ? { ...prev, type: event.target.value } : prev))}
                    className="w-full rounded border border-slate-300 px-2 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-neutral-600">仕入数</span>
                  <input
                    type="number"
                    min={0}
                    value={editingForm.quantity ?? 0}
                    onChange={(event) =>
                      setEditingForm((prev) => (prev ? { ...prev, quantity: Number(event.target.value) } : prev))
                    }
                    className="w-full rounded border border-slate-300 px-2 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-neutral-600">仕入単価</span>
                  <input
                    type="number"
                    min={0}
                    value={editingForm.unitPrice ?? 0}
                    onChange={(event) =>
                      setEditingForm((prev) => (prev ? { ...prev, unitPrice: Number(event.target.value) } : prev))
                    }
                    className="w-full rounded border border-slate-300 px-2 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-neutral-600">販売単価</span>
                  <input
                    type="number"
                    min={0}
                    value={editingForm.saleUnitPrice ?? 0}
                    onChange={(event) =>
                      setEditingForm((prev) => (prev ? { ...prev, saleUnitPrice: Number(event.target.value) } : prev))
                    }
                    className="w-full rounded border border-slate-300 px-2 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-neutral-600">入庫日</span>
                  <input
                    type="date"
                    value={editingForm.stockInDate ?? ""}
                    onChange={(event) =>
                      setEditingForm((prev) => (prev ? { ...prev, stockInDate: event.target.value } : prev))
                    }
                    className="w-full rounded border border-slate-300 px-2 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-neutral-600">撤去日</span>
                  <input
                    type="date"
                    value={editingForm.removeDate ?? ""}
                    onChange={(event) =>
                      setEditingForm((prev) => (prev ? { ...prev, removeDate: event.target.value } : prev))
                    }
                    className="w-full rounded border border-slate-300 px-2 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-neutral-600">柄</span>
                  <input
                    value={editingForm.pattern ?? ""}
                    onChange={(event) =>
                      setEditingForm((prev) => (prev ? { ...prev, pattern: event.target.value } : prev))
                    }
                    className="w-full rounded border border-slate-300 px-2 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-neutral-600">保管先</span>
                  <input
                    value={editingForm.warehouse ?? ""}
                    onChange={(event) =>
                      setEditingForm((prev) => (prev ? { ...prev, warehouse: event.target.value } : prev))
                    }
                    className="w-full rounded border border-slate-300 px-2 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-neutral-600">仕入先</span>
                  <input
                    value={editingForm.supplier ?? ""}
                    onChange={(event) =>
                      setEditingForm((prev) => (prev ? { ...prev, supplier: event.target.value } : prev))
                    }
                    className="w-full rounded border border-slate-300 px-2 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-neutral-600">担当者</span>
                  <input
                    value={editingForm.staff ?? ""}
                    onChange={(event) => setEditingForm((prev) => (prev ? { ...prev, staff: event.target.value } : prev))}
                    className="w-full rounded border border-slate-300 px-2 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-neutral-600">状況</span>
                  <select
                    value={(editingForm.status as InventoryStatusOption) ?? "倉庫"}
                    onChange={(event) =>
                      setEditingForm((prev) =>
                        prev ? { ...prev, status: event.target.value as InventoryStatusOption } : prev,
                      )
                    }
                    className="w-full rounded border border-slate-300 px-2 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-neutral-600">備考</span>
                  <input
                    value={editingForm.note ?? ""}
                    onChange={(event) => setEditingForm((prev) => (prev ? { ...prev, note: event.target.value } : prev))}
                    className="w-full rounded border border-slate-300 px-2 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-neutral-600">表示</span>
                  <select
                    value={editingForm.isVisible === false ? "0" : "1"}
                    onChange={(event) =>
                      setEditingForm((prev) => (prev ? { ...prev, isVisible: event.target.value === "1" } : prev))
                    }
                    className="w-full rounded border border-slate-300 px-2 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  >
                    <option value="1">する</option>
                    <option value="0">しない</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button
                type="button"
                onClick={closeEditor}
                className="h-9 rounded border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleEditSubmit}
                className="h-9 rounded bg-sky-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
