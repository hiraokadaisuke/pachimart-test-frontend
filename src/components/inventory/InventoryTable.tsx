import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  倉庫: "bg-slate-50 text-neutral-900 ring-1 ring-slate-200",
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
  onToggleListingStatus?: (item: InventoryItem) => void;
}

const formatCurrency = (value?: number | null) => {
  if (value === undefined || value === null) return "-";
  return `${value.toLocaleString()} 円`;
};

const calculateTaxIncluded = (value?: number | null) => {
  if (value === undefined || value === null) return null;
  return Math.round(value * 1.1);
};

const renderTruncatedCell = (
  value: string | null | undefined,
  widthClass = "max-w-[160px]",
  placeholder = "-",
) => {
  const displayValue = value ?? placeholder;
  return (
    <span className={`block truncate ${widthClass}`} title={value ?? displayValue}>
      {displayValue}
    </span>
  );
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

const MENU_WIDTH = 128;
const MENU_ESTIMATED_HEIGHT = 200;

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
  {
    id: "listingStatus",
    render: (item) => {
      const status = item.listingStatus ?? "UNLISTED";
      const isListed = status === "LISTED";

      return (
        <span
          className={
            isListed
              ? "inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700"
              : "inline-flex items-center rounded-full border border-slate-300 px-2 py-0.5 text-[11px] text-neutral-700"
          }
        >
          {isListed ? "出品中" : "非出品"}
        </span>
      );
    },
  },
  { id: "maker", render: (item) => renderTruncatedCell(item.manufacturer, "max-w-[160px]") },
  { id: "model", render: (item) => <span className="font-semibold text-slate-900">{item.modelName}</span> },
  { id: "frameColorPanel", render: (item) => renderTruncatedCell(item.colorPanel, "max-w-[160px]") },
  { id: "inspectionNumber", render: (item) => item.inspectionNumber ?? "-" },
  { id: "frameSerial", render: (item) => item.frameSerial ?? "-" },
  { id: "boardSerial", render: (item) => item.boardSerial ?? "-" },
  { id: "removalDate", render: (item) => item.removalDate ?? "-" },
  { id: "usageType", render: (item) => item.usageType ?? "-" },
  { id: "warehouse", render: (item) => renderTruncatedCell(item.warehouse, "max-w-[150px]") },
  { id: "note", render: (item) => item.note ?? "-" },
  { id: "installDate", render: (item) => item.installDate ?? "-" },
  { id: "installPeriod", render: (item) => formatInstallPeriod(item) },
  { id: "inspectionDate", render: (item) => item.inspectionDate ?? "-" },
  { id: "inspectionExpiry", render: (item) => addYears(item.inspectionDate) },
  { id: "approvalDate", render: (item) => item.approvalDate ?? "-" },
  { id: "approvalExpiry", render: (item) => addYears(item.approvalDate) },
  { id: "purchaseSource", render: (item) => renderTruncatedCell(item.purchaseSource, "max-w-[180px]") },
  { id: "purchasePriceExTax", render: (item) => formatCurrency(item.purchasePriceExTax) },
  { id: "purchasePriceIncTax", render: (item) => formatCurrency(calculateTaxIncluded(item.purchasePriceExTax)) },
  { id: "saleDate", render: (item) => item.saleDate ?? "-" },
  { id: "saleDestination", render: (item) => renderTruncatedCell(item.saleDestination || null, "max-w-[180px]") },
  { id: "salePriceExTax", render: (item) => formatCurrency(item.salePriceExTax) },
  { id: "salePriceIncTax", render: (item) => formatCurrency(calculateTaxIncluded(item.salePriceExTax)) },
  { id: "externalCompany", render: (item) => renderTruncatedCell(item.externalCompany, "max-w-[170px]") },
  { id: "externalStore", render: (item) => renderTruncatedCell(item.externalStore, "max-w-[170px]") },
  { id: "stockInDate", render: (item) => item.stockInDate ?? "-" },
  { id: "stockOutDate", render: (item) => item.stockOutDate ?? "-" },
  { id: "stockOutDestination", render: (item) => item.stockOutDestination ?? "-" },
  { id: "serialNumber", render: (item) => renderTruncatedCell(item.serialNumber, "max-w-[170px]") },
  { id: "inspectionInfo", render: (item) => item.inspectionInfo ?? "-" },
  {
    id: "listingId",
    render: (item) =>
      renderTruncatedCell(
        item.listingId && item.listingId.length > 0 ? item.listingId : null,
        "max-w-[150px]",
      ),
  },
];

const columnWidthClasses: Partial<Record<InventoryColumnId, string>> = {
  category: "min-w-[60px] whitespace-nowrap",
  status: "min-w-[72px] whitespace-nowrap",
  listingStatus: "min-w-[72px] whitespace-nowrap text-center",
  maker: "min-w-[110px] whitespace-nowrap",
  model: "min-w-[280px] whitespace-nowrap",
  frameColorPanel: "min-w-[140px] whitespace-nowrap",
  inspectionNumber: "min-w-[120px] whitespace-nowrap",
  frameSerial: "min-w-[110px] whitespace-nowrap",
  boardSerial: "min-w-[120px] whitespace-nowrap",
  removalDate: "min-w-[110px] whitespace-nowrap",
  usageType: "min-w-[72px] whitespace-nowrap",
  warehouse: "min-w-[120px] whitespace-nowrap",
  note: "min-w-[140px]",
  installDate: "min-w-[110px] whitespace-nowrap",
  installPeriod: "min-w-[110px] whitespace-nowrap",
  inspectionDate: "min-w-[110px] whitespace-nowrap",
  inspectionExpiry: "min-w-[110px] whitespace-nowrap",
  approvalDate: "min-w-[110px] whitespace-nowrap",
  approvalExpiry: "min-w-[110px] whitespace-nowrap",
  purchaseSource: "min-w-[140px]",
  purchasePriceExTax: "min-w-[120px] whitespace-nowrap text-right",
  purchasePriceIncTax: "min-w-[120px] whitespace-nowrap text-right",
  saleDate: "min-w-[110px] whitespace-nowrap",
  saleDestination: "min-w-[140px]",
  salePriceExTax: "min-w-[120px] whitespace-nowrap text-right",
  salePriceIncTax: "min-w-[120px] whitespace-nowrap text-right",
  externalCompany: "min-w-[130px]",
  externalStore: "min-w-[130px]",
  stockInDate: "min-w-[110px] whitespace-nowrap",
  stockOutDate: "min-w-[110px] whitespace-nowrap",
  stockOutDestination: "min-w-[140px]",
  serialNumber: "min-w-[130px]",
  inspectionInfo: "min-w-[140px]",
  listingId: "min-w-[130px] whitespace-nowrap",
};

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
  onToggleListingStatus,
}: InventoryTableProps) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [rows, setRows] = useState<InventoryItem[]>(items);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<InventoryItem | null>(null);
  const [headerOrder, setHeaderOrder] = useState<InventoryColumnId[]>(columns.map((column) => column.id));
  const [openMenuRowId, setOpenMenuRowId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuAnchorRef = useRef<HTMLButtonElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

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
    setOpenMenuRowId(null);
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

  const handleExhibit = (row: InventoryItem) => {
    onToggleListingStatus?.(row);
  };

  const handleWithdraw = (row: InventoryItem) => {
    onToggleListingStatus?.(row);
  };

  const handleShowDetail = (row: InventoryItem) => {
    // TODO: 詳細表示処理を実装
  };

  const handleOpenDocuments = (row: InventoryItem) => {
    onOpenDocuments?.(row.id);
  };

  const calculateMenuPosition = useCallback((button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < MENU_ESTIMATED_HEIGHT;
    const top = openAbove
      ? Math.max(8, rect.top - MENU_ESTIMATED_HEIGHT - 8)
      : Math.min(window.innerHeight - 8, rect.bottom + 8);
    const left = Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));

    setMenuPosition({ top, left });
  }, []);

  const closeMenu = useCallback(() => {
    setOpenMenuRowId(null);
    setMenuPosition(null);
    menuAnchorRef.current = null;
  }, []);

  const handleActionButtonClick = useCallback(
    (rowId: number, event: React.MouseEvent<HTMLButtonElement>) => {
      if (openMenuRowId === rowId) {
        closeMenu();
        return;
      }

      const button = event.currentTarget;
      menuAnchorRef.current = button;
      setOpenMenuRowId(rowId);
      calculateMenuPosition(button);
    },
    [calculateMenuPosition, closeMenu, openMenuRowId],
  );

  useEffect(() => {
    if (openMenuRowId === null) {
      setMenuPosition(null);
      return undefined;
    }

    const updateMenuPosition = () => {
      if (!menuAnchorRef.current || !menuAnchorRef.current.isConnected) {
        closeMenu();
        return;
      }

      calculateMenuPosition(menuAnchorRef.current);
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-inventory-action-menu]")) {
        closeMenu();
      }
    };

    updateMenuPosition();

    const scrollContainer = scrollContainerRef.current;
    document.addEventListener("click", handleClickOutside);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    scrollContainer?.addEventListener("scroll", updateMenuPosition);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
      scrollContainer?.removeEventListener("scroll", updateMenuPosition);
    };
  }, [calculateMenuPosition, closeMenu, openMenuRowId]);

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
    { value: "P本体", label: "P本体" },
    { value: "S本体", label: "S本体" },
    { value: "P枠", label: "P枠" },
    { value: "Pセル", label: "Pセル" },
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
    <div className="w-full overflow-x-auto relative">
      <div
        ref={scrollContainerRef}
        className="relative max-h-[70vh] overflow-y-auto rounded-lg border border-slate-200 bg-white text-xs shadow-sm"
      >
        <table className="w-full table-auto border-collapse border border-slate-200 text-[11px] text-slate-800">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={headerOrder}>
            <thead className="sticky top-0 z-10 bg-slate-100 text-left font-semibold text-slate-900">
              <tr>
                {visibleColumns.map((column) => {
                  const sortableKey = columnSortKeyMap[column.id];
                  const isActive = sortableKey && sortKey === sortableKey;
                  const isSortable = Boolean(sortableKey && onSortChange);
                  const columnClassName = columnWidthClasses[column.id];

                  return (
                    <SortableHeaderCell key={column.id} column={column} className={columnClassName}>
                      <div className="flex w-full items-center justify-start gap-1">
                        {isSortable ? (
                          <button
                            type="button"
                            onClick={() => sortableKey && onSortChange?.(sortableKey)}
                            className="inline-flex w-full items-center justify-start gap-1 text-slate-800"
                          >
                            <span>{column.label}</span>
                            {isActive && (
                              <span className="text-[10px] text-neutral-700">{sortOrder === "asc" ? "▲" : "▼"}</span>
                            )}
                          </button>
                        ) : (
                          <span className="inline-flex w-full justify-start">{column.label}</span>
                        )}
                      </div>
                    </SortableHeaderCell>
                  );
                })}
                <th
                  className="sticky right-0 z-20 w-[140px] whitespace-nowrap border border-slate-200 bg-white px-3 py-1.5 text-left text-[11px] font-semibold text-neutral-800 shadow-inner"
                >
                  操作
                </th>
              </tr>
            </thead>
          </SortableContext>
        </DndContext>
        <tbody>
          {rows.map((item) => {
            const isEditing = item.id === editingId;
            const isListed = item.listingStatus === "LISTED";

            return (
              <tr
                key={item.id}
                className={`border-b text-sm ${
                  isListed
                    ? "bg-blue-50/40 hover:bg-blue-50"
                    : "odd:bg-white even:bg-slate-50 hover:bg-blue-50/30"
                }`}
              >
                {orderedRenderers.map((column) => {
                  const columnClassName = columnWidthClasses[column.id];

                  return (
                    <td
                      key={`${item.id}-${column.id}`}
                      className={`border border-slate-200 px-2 py-1.5 text-[11px] text-slate-800 align-top ${columnClassName ?? ""}`}
                    >
                      {renderCell(column, item, isEditing)}
                    </td>
                  );
                })}
                <td
                  className="sticky right-0 z-10 w-[140px] whitespace-nowrap border border-slate-200 bg-white px-3 py-2 text-[11px] align-top text-right shadow-inner relative"
                  data-inventory-action-menu
                >
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
                        className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold text-neutral-900 transition hover:bg-slate-100"
                        onClick={handleCancelEdit}
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="rounded bg-[#1E3A8A] px-3 py-1 text-xs font-medium text-white hover:bg-[#1E40AF]"
                        onClick={(event) => handleActionButtonClick(item.id, event)}
                      >
                        操作
                      </button>

                      {openMenuRowId === item.id &&
                        menuPosition &&
                        typeof document !== "undefined" &&
                        createPortal(
                          <div
                            data-inventory-action-menu
                            className="fixed z-50 w-32 rounded-md border border-slate-200 bg-white py-1 text-left shadow-lg"
                            style={{ top: menuPosition.top, left: menuPosition.left }}
                          >
                            {isListed ? (
                              <button
                                type="button"
                                className="block w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                                onClick={() => {
                                  closeMenu();
                                  handleWithdraw(item);
                                }}
                              >
                                出品停止
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="block w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                                onClick={() => {
                                  closeMenu();
                                  handleExhibit(item);
                                }}
                              >
                                出品
                              </button>
                            )}

                            <button
                              type="button"
                              className="block w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                              onClick={() => {
                                closeMenu();
                                handleShowDetail(item);
                              }}
                            >
                              詳細を見る
                            </button>

                            <button
                              type="button"
                              className="block w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                              onClick={() => {
                                closeMenu();
                                handleOpenDocuments(item);
                              }}
                            >
                              書類を開く
                            </button>

                            <button
                              type="button"
                              className="block w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                              onClick={() => {
                                closeMenu();
                                handleStartEdit(item);
                              }}
                            >
                              編集する
                            </button>
                          </div>,
                          document.body,
                        )}
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="border-t border-slate-200 px-4 py-8 text-center text-sm text-neutral-700">在庫データがありません。</div>
      )}
    </div>
    </div>
  );
}

function SortableHeaderCell({
  column,
  children,
  className,
}: {
  column: InventoryColumnSetting;
  children: React.ReactNode;
  className?: string;
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
      className={`border border-slate-200 px-2 py-1.5 text-left text-[11px] font-semibold text-neutral-800 whitespace-nowrap bg-slate-100 ${className ?? ""}`}
      {...attributes}
      {...listeners}
    >
      {children}
    </th>
  );
}
