import React, { useEffect, useMemo, useState } from "react";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { InventoryItem, InventoryStatus } from "@/types/inventory";

import type {
  InventoryColumnId,
  InventoryColumnSetting,
  InventorySortKey,
} from "./columnSettings";

const statusStyles: Record<InventoryStatus, string> = {
  設置中: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  倉庫: "bg-slate-50 text-slate-700 ring-1 ring-slate-200",
  出品中: "bg-green-50 text-green-700 ring-1 ring-green-200",
  売却済: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  廃棄: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

interface InventoryColumnDefinition {
  id: InventoryColumnId;
  render: (item: InventoryItem) => React.ReactNode;
}

interface InventoryTableProps {
  items: InventoryItem[];
  columns: InventoryColumnSetting[];
  onHeaderReorder?: (newOrder: InventoryColumnId[]) => void;
  onSortChange?: (key: InventorySortKey) => void;
  sortKey?: InventorySortKey | null;
  sortOrder?: "asc" | "desc";
  onOpenDocuments?: (itemId: number) => void;
}

const formatCurrency = (value?: number | null) => {
  if (value === undefined || value === null) return "-";
  return `${value.toLocaleString()} 円`;
};

const calculateTaxIncluded = (value?: number | null) => {
  if (value === undefined || value === null) return null;
  return Math.round(value * 1.1);
};

const addYears = (dateString?: string | null, years: number = 3) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  const next = new Date(date);
  next.setFullYear(date.getFullYear() + years);
  return next.toISOString().slice(0, 10);
};

const formatInstallPeriod = (item: InventoryItem) => {
  if (!item.installDate) return "-";

  const start = new Date(item.installDate);
  const end =
    item.status === "設置中"
      ? new Date()
      : item.removalDate
        ? new Date(item.removalDate)
        : null;

  if (!end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "-";
  }

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = years * 12 + months;
  if (totalMonths > 0) {
    const yearText = years > 0 ? `${years}年` : "";
    const monthText = `${months}ヶ月`;
    return `${yearText}${monthText}`;
  }

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  return `${diffDays}日`;
};

const columnDefinitions: InventoryColumnDefinition[] = [
  {
    id: "category",
    render: (item) => item.category,
  },
  {
    id: "status",
    render: (item) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-semibold ${statusStyles[item.status]}`}
      >
        {item.status}
      </span>
    ),
  },
  { id: "maker", render: (item) => item.manufacturer },
  { id: "model", render: (item) => <span className="font-semibold text-slate-900">{item.modelName}</span> },
  { id: "frameColorPanel", render: (item) => item.colorPanel },
  { id: "inspectionNumber", render: (item) => item.inspectionNumber ?? "-" },
  { id: "frameSerial", render: (item) => item.frameSerial ?? "-" },
  { id: "boardSerial", render: (item) => item.boardSerial ?? "-" },
  { id: "removalDate", render: (item) => item.removalDate ?? "-" },
  { id: "usageType", render: (item) => item.usageType ?? "-" },
  { id: "warehouse", render: (item) => item.warehouse ?? "-" },
  { id: "note", render: (item) => item.note ?? "-" },
  { id: "installDate", render: (item) => item.installDate ?? "-" },
  { id: "installPeriod", render: (item) => formatInstallPeriod(item) },
  { id: "inspectionDate", render: (item) => item.inspectionDate ?? "-" },
  { id: "inspectionExpiry", render: (item) => addYears(item.inspectionDate) },
  { id: "approvalDate", render: (item) => item.approvalDate ?? "-" },
  { id: "approvalExpiry", render: (item) => addYears(item.approvalDate) },
  { id: "purchaseSource", render: (item) => item.purchaseSource ?? "-" },
  { id: "purchasePriceExTax", render: (item) => formatCurrency(item.purchasePriceExTax) },
  { id: "purchasePriceIncTax", render: (item) => formatCurrency(calculateTaxIncluded(item.purchasePriceExTax)) },
  { id: "saleDate", render: (item) => item.saleDate ?? "-" },
  { id: "saleDestination", render: (item) => item.saleDestination ?? "-" },
  { id: "salePriceExTax", render: (item) => formatCurrency(item.salePriceExTax) },
  { id: "salePriceIncTax", render: (item) => formatCurrency(calculateTaxIncluded(item.salePriceExTax)) },
  { id: "externalCompany", render: (item) => item.externalCompany ?? "-" },
  { id: "externalStore", render: (item) => item.externalStore ?? "-" },
  { id: "stockInDate", render: (item) => item.stockInDate ?? "-" },
  { id: "stockOutDate", render: (item) => item.stockOutDate ?? "-" },
  { id: "stockOutDestination", render: (item) => item.stockOutDestination ?? "-" },
  { id: "serialNumber", render: (item) => item.serialNumber ?? "-" },
  { id: "inspectionInfo", render: (item) => item.inspectionInfo ?? "-" },
  { id: "listingId", render: (item) => (item.listingId && item.listingId.length > 0 ? item.listingId : "-") },
];

const columnSortKeyMap: Partial<Record<InventoryColumnId, InventorySortKey>> = {
  status: "status",
  category: "category",
  maker: "maker",
  model: "model",
  frameColorPanel: "frameColorPanel",
  inspectionNumber: "inspectionNumber",
  frameSerial: "frameSerial",
  boardSerial: "boardSerial",
  removalDate: "removalDate",
  warehouse: "warehouse",
  installDate: "installDate",
  inspectionDate: "inspectionDate",
  approvalDate: "approvalDate",
  purchasePriceExTax: "purchasePriceExTax",
  saleDate: "saleDate",
  salePriceExTax: "salePriceExTax",
};

export function InventoryTable({
  items,
  columns,
  onHeaderReorder,
  onSortChange,
  sortKey,
  sortOrder,
  onOpenDocuments,
}: InventoryTableProps) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [rows, setRows] = useState<InventoryItem[]>(items);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<InventoryItem | null>(null);
  const [headerOrder, setHeaderOrder] = useState<InventoryColumnId[]>(columns.map((column) => column.id));

  useEffect(() => {
    setRows(items);
    setHeaderOrder(columns.map((column) => column.id));
  }, [columns, items]);

  const visibleColumns = useMemo(
    () =>
      headerOrder
        .map((id) => columns.find((column) => column.id === id))
        .filter((column): column is InventoryColumnSetting => Boolean(column)),
    [columns, headerOrder],
  );

  const orderedRenderers = useMemo(
    () =>
      visibleColumns
        .map((column) => columnDefinitions.find((definition) => definition.id === column.id))
        .filter((definition): definition is InventoryColumnDefinition => Boolean(definition)),
    [visibleColumns],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = headerOrder.indexOf(active.id as InventoryColumnId);
    const newIndex = headerOrder.indexOf(over.id as InventoryColumnId);
    const newOrder = arrayMove(headerOrder, oldIndex, newIndex);
    setHeaderOrder(newOrder);
    onHeaderReorder?.(newOrder);
  };

  const handleStartEdit = (row: InventoryItem) => {
    setEditingId(row.id);
    setEditValues(row);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues(null);
  };

  const handleChange = <K extends keyof InventoryItem>(key: K, value: InventoryItem[K]) => {
    if (!editValues) return;
    const nextValue =
      (key === "purchasePriceExTax" || key === "salePriceExTax") && typeof value === "number"
        ? Math.max(0, value)
        : value;
    setEditValues({ ...editValues, [key]: nextValue });
  };

  const handleSaveEdit = () => {
    if (!editValues) return;
    setRows((prev) => prev.map((row) => (row.id === editValues.id ? editValues : row)));
    setEditingId(null);
    setEditValues(null);
  };

  const warehouseOptions = useMemo(
    () => Array.from(new Set(rows.map((item) => item.warehouse))).map((name, index) => ({ id: index, name })),
    [rows],
  );

  const manufacturerOptions = useMemo(
    () => Array.from(new Set(rows.map((item) => item.manufacturer))).map((name, index) => ({ id: index, name })),
    [rows],
  );

  const modelOptions = useMemo(() => {
    if (!editValues?.manufacturer) {
      return Array.from(new Set(rows.map((item) => item.modelName))).map((name, index) => ({ id: index, name }));
    }

    return rows
      .filter((item) => item.manufacturer === editValues.manufacturer)
      .map((item, index) => ({ id: `${item.manufacturer}-${index}`, name: item.modelName }));
  }, [editValues?.manufacturer, rows]);

  const statusOptions: { value: InventoryStatus; label: string }[] = [
    { value: "設置中", label: "設置中" },
    { value: "倉庫", label: "倉庫" },
    { value: "出品中", label: "出品中" },
    { value: "売却済", label: "売却済" },
    { value: "廃棄", label: "廃棄" },
  ];

  const usageOptions = [
    { value: "一次", label: "一次" },
    { value: "二次", label: "二次" },
  ];

  const categoryOptions = [
    { value: "パチンコ", label: "パチンコ" },
    { value: "パチスロ", label: "パチスロ" },
  ];

  const renderCell = (column: InventoryColumnDefinition, item: InventoryItem, isEditing: boolean) => {
    if (!isEditing || !editValues) return column.render(item);

    switch (column.id) {
      case "category":
        return (
          <select
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.category}
            onChange={(e) => handleChange("category", e.target.value as InventoryItem["category"])}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "status":
        return (
          <select
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.status}
            onChange={(e) => handleChange("status", e.target.value as InventoryStatus)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "maker":
        return (
          <select
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.manufacturer}
            onChange={(e) => handleChange("manufacturer", e.target.value)}
          >
            {manufacturerOptions.map((option) => (
              <option key={`${option.id}-${option.name}`} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
        );
      case "model":
        return (
          <select
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.modelName}
            onChange={(e) => handleChange("modelName", e.target.value)}
          >
            {modelOptions.map((option) => (
              <option key={`${option.id}-${option.name}`} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
        );
      case "frameColorPanel":
        return (
          <input
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.colorPanel}
            onChange={(e) => handleChange("colorPanel", e.target.value)}
          />
        );
      case "inspectionNumber":
        return (
          <input
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.inspectionNumber}
            onChange={(e) => handleChange("inspectionNumber", e.target.value)}
          />
        );
      case "frameSerial":
        return (
          <input
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.frameSerial}
            onChange={(e) => handleChange("frameSerial", e.target.value)}
          />
        );
      case "boardSerial":
        return (
          <input
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.boardSerial}
            onChange={(e) => handleChange("boardSerial", e.target.value)}
          />
        );
      case "removalDate":
        return (
          <input
            type="date"
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.removalDate ?? ""}
            onChange={(e) => handleChange("removalDate", e.target.value || null)}
          />
        );
      case "usageType":
        return (
          <select
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.usageType ?? ""}
            onChange={(e) => handleChange("usageType", (e.target.value || undefined) as InventoryItem["usageType"])}
          >
            <option value="">選択してください</option>
            {usageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "warehouse":
        return (
          <select
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.warehouse}
            onChange={(e) => handleChange("warehouse", e.target.value)}
          >
            {warehouseOptions.map((option) => (
              <option key={`${option.id}-${option.name}`} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
        );
      case "note":
        return (
          <textarea
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            rows={2}
            value={editValues.note ?? ""}
            onChange={(e) => handleChange("note", e.target.value)}
          />
        );
      case "installDate":
        return (
          <input
            type="date"
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.installDate ?? ""}
            onChange={(e) => handleChange("installDate", e.target.value || null)}
          />
        );
      case "inspectionDate":
        return (
          <input
            type="date"
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.inspectionDate ?? ""}
            onChange={(e) => handleChange("inspectionDate", e.target.value || null)}
          />
        );
      case "approvalDate":
        return (
          <input
            type="date"
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.approvalDate ?? ""}
            onChange={(e) => handleChange("approvalDate", e.target.value || null)}
          />
        );
      case "purchaseSource":
        return (
          <input
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.purchaseSource ?? ""}
            onChange={(e) => handleChange("purchaseSource", e.target.value)}
          />
        );
      case "purchasePriceExTax":
        return (
          <input
            type="number"
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px] text-right"
            value={editValues.purchasePriceExTax ?? ""}
            onChange={(e) => handleChange("purchasePriceExTax", Number(e.target.value) || 0)}
            min={0}
          />
        );
      case "saleDate":
        return (
          <input
            type="date"
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.saleDate ?? ""}
            onChange={(e) => handleChange("saleDate", e.target.value || null)}
          />
        );
      case "saleDestination":
        return (
          <input
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.saleDestination ?? ""}
            onChange={(e) => handleChange("saleDestination", e.target.value)}
          />
        );
      case "salePriceExTax":
        return (
          <input
            type="number"
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px] text-right"
            value={editValues.salePriceExTax ?? ""}
            onChange={(e) => handleChange("salePriceExTax", Number(e.target.value) || 0)}
            min={0}
          />
        );
      case "externalCompany":
        return (
          <input
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.externalCompany ?? ""}
            onChange={(e) => handleChange("externalCompany", e.target.value)}
          />
        );
      case "externalStore":
        return (
          <input
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.externalStore ?? ""}
            onChange={(e) => handleChange("externalStore", e.target.value)}
          />
        );
      case "stockInDate":
        return (
          <input
            type="date"
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.stockInDate ?? ""}
            onChange={(e) => handleChange("stockInDate", e.target.value || null)}
          />
        );
      case "stockOutDate":
        return (
          <input
            type="date"
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.stockOutDate ?? ""}
            onChange={(e) => handleChange("stockOutDate", e.target.value || null)}
          />
        );
      case "stockOutDestination":
        return (
          <input
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.stockOutDestination ?? ""}
            onChange={(e) => handleChange("stockOutDestination", e.target.value)}
          />
        );
      case "serialNumber":
        return (
          <input
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            value={editValues.serialNumber ?? ""}
            onChange={(e) => handleChange("serialNumber", e.target.value)}
          />
        );
      case "inspectionInfo":
        return (
          <textarea
            className="w-full rounded border border-slate-300 px-1 py-[3px] text-[11px]"
            rows={2}
            value={editValues.inspectionInfo ?? ""}
            onChange={(e) => handleChange("inspectionInfo", e.target.value)}
          />
        );
      case "installPeriod":
      case "inspectionExpiry":
      case "approvalExpiry":
      case "purchasePriceIncTax":
      case "salePriceIncTax":
      case "listingId":
        return column.render(editValues);
      default:
        return column.render(editValues);
    }
  };

  return (
    <div className="relative max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-white text-xs shadow-sm">
      <table className="min-w-[1600px] w-full border-collapse text-[11px] text-slate-800">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={headerOrder}>
            <thead className="sticky top-0 z-10 bg-slate-100 text-left font-semibold text-slate-900">
              <tr>
                {visibleColumns.map((column) => {
                  const sortableKey = columnSortKeyMap[column.id];
                  const isActive = sortableKey && sortKey === sortableKey;
                  const isSortable = Boolean(sortableKey && onSortChange);
                  const widthStyle: React.CSSProperties = column.width ? { width: column.width } : {};

                  return (
                    <SortableHeaderCell key={column.id} column={column}>
                      <div style={widthStyle} className="flex items-center gap-1">
                        {isSortable ? (
                          <button
                            type="button"
                            onClick={() => sortableKey && onSortChange?.(sortableKey)}
                            className="inline-flex items-center gap-1 text-left text-slate-800"
                          >
                            <span>{column.label}</span>
                            {isActive && (
                              <span className="text-[10px] text-slate-500">{sortOrder === "asc" ? "▲" : "▼"}</span>
                            )}
                          </button>
                        ) : (
                          <span>{column.label}</span>
                        )}
                      </div>
                    </SortableHeaderCell>
                  );
                })}
                <th className="w-[200px] whitespace-nowrap px-2 py-1.5 text-center text-[11px] font-semibold text-slate-600">操作</th>
              </tr>
            </thead>
          </SortableContext>
        </DndContext>
        <tbody>
          {rows.map((item) => {
            const isEditing = item.id === editingId;

            return (
              <tr key={item.id} className="odd:bg-white even:bg-slate-50 border-t border-slate-200 hover:bg-blue-50/30">
                {orderedRenderers.map((column) => {
                  const columnSetting = visibleColumns.find((c) => c.id === column.id);
                  const widthStyle: React.CSSProperties = columnSetting?.width ? { width: columnSetting.width } : {};

                  return (
                    <td
                      key={`${item.id}-${column.id}`}
                      style={widthStyle}
                      className="whitespace-nowrap px-2 py-1 text-[11px] text-slate-800 align-top"
                    >
                      {renderCell(column, item, isEditing)}
                    </td>
                  );
                })}
                <td className="w-[200px] whitespace-nowrap px-2 py-1 text-[11px] align-top">
                  {isEditing ? (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="rounded bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-blue-700"
                        onClick={handleSaveEdit}
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                        onClick={handleCancelEdit}
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          /* TODO: 出品処理を実装 */
                        }}
                        className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        出品
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          /* TODO: 取り下げ処理を実装 */
                        }}
                        className="rounded border border-orange-200 bg-orange-50 px-2 py-1 text-[11px] font-semibold text-orange-700 transition hover:bg-orange-100"
                      >
                        取り下げ
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          /* TODO: 詳細表示処理を実装 */
                        }}
                        className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        詳細
                      </button>
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-1 text-[11px] transition hover:bg-slate-100"
                        onClick={() => onOpenDocuments?.(item.id)}
                      >
                        書類
                      </button>
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                        onClick={() => handleStartEdit(item)}
                      >
                        編集
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-500">在庫データがありません。</div>
      )}
    </div>
  );
}

function SortableHeaderCell({
  column,
  children,
}: {
  column: InventoryColumnSetting;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className="px-2 py-1.5 text-[11px] font-semibold text-slate-600 whitespace-nowrap bg-slate-100"
      {...attributes}
      {...listeners}
    >
      {children}
    </th>
  );
}
