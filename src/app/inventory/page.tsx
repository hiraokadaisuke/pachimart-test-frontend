"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent } from "react";
import Link from "next/link";

import {
  loadInventoryRecords,
  resetInventoryRecords,
  saveDraft,
  updateInventoryRecord,
  updateInventoryStatuses,
  updateInventoryStatus,
  type ListingStatusOption,
  type InventoryRecord,
} from "@/lib/demo-data/demoInventory";
import { DEFAULT_MASTER_DATA, loadMasterData, type MasterData } from "@/lib/demo-data/demoMasterData";
import { loadPurchaseInvoices } from "@/lib/demo-data/purchaseInvoices";
import { loadSalesInvoices } from "@/lib/demo-data/salesInvoices";
import type { InventoryStatusOption, PurchaseInvoice } from "@/types/purchaseInvoices";
import type { SalesInvoice } from "@/types/salesInvoices";
import InventoryEditTable from "@/components/inventory/InventoryEditTable";
import { buildEditForm, buildPayload, resolveListingStatus, STATUS_OPTIONS } from "@/lib/inventory/editUtils";

type Column = {
  key: keyof InventoryRecord | "status";
  label: string;
  width: number;
  minWidth: number;
  visible?: boolean;
  order?: number;
};

type DateRange = {
  from: string;
  to: string;
};

type SearchFilters = {
  kind: "all" | "P" | "S";
  createdAt: DateRange;
  stockInDate: DateRange;
  maker: string;
  model: string;
  supplier: string;
  staff: string;
  showHidden: "show" | "hide";
  showStock: "show" | "hide";
  showCompleted: "show" | "hide";
  displayCount: "all" | "50" | "100" | "200";
};

const RESERVED_SELECTION_WIDTH = 48;
const COLUMN_SETTINGS_KEY = "inventory_table_columns_v1";

const NUMERIC_COLUMNS: Array<Column["key"]> = ["quantity", "unitPrice", "saleUnitPrice"];
const DATE_COLUMNS: Array<Column["key"]> = ["createdAt", "stockInDate", "removeDate"];
const WRAP_COLUMNS: Array<Column["key"]> = ["maker", "model", "warehouse", "supplier", "staff", "note"];

const INITIAL_COLUMNS: Column[] = [
  { key: "id", label: "管理ID", width: 64, minWidth: 52, visible: true },
  { key: "createdAt", label: "入力日", width: 72, minWidth: 64, visible: true },
  { key: "maker", label: "メーカー", width: 96, minWidth: 72, visible: true },
  { key: "model", label: "機種名", width: 160, minWidth: 140, visible: true },
  { key: "kind", label: "種別", width: 48, minWidth: 44, visible: true },
  { key: "type", label: "タイプ", width: 54, minWidth: 48, visible: true },
  { key: "quantity", label: "仕入数", width: 68, minWidth: 56, visible: true },
  { key: "unitPrice", label: "仕単", width: 70, minWidth: 60, visible: true },
  { key: "saleUnitPrice", label: "販単", width: 70, minWidth: 60, visible: true },
  { key: "hasRemainingDebt", label: "残債", width: 54, minWidth: 48, visible: true },
  { key: "stockInDate", label: "入庫日", width: 72, minWidth: 64, visible: true },
  { key: "removeDate", label: "撤去日", width: 72, minWidth: 64, visible: true },
  { key: "warehouse", label: "保管先", width: 108, minWidth: 88, visible: true },
  { key: "supplier", label: "仕入先", width: 108, minWidth: 88, visible: true },
  { key: "staff", label: "担当", width: 72, minWidth: 64, visible: true },
  { key: "status", label: "状況", width: 76, minWidth: 64, visible: true },
  { key: "isConsignment", label: "委託", width: 52, minWidth: 48, visible: true },
  { key: "isVisible", label: "表示", width: 52, minWidth: 48, visible: true },
  { key: "note", label: "備考", width: 120, minWidth: 96, visible: true },
];

const defaultFilters: SearchFilters = {
  kind: "all",
  createdAt: { from: "", to: "" },
  stockInDate: { from: "", to: "" },
  maker: "",
  model: "",
  supplier: "",
  staff: "",
  showHidden: "hide",
  showStock: "show",
  showCompleted: "show",
  displayCount: "all",
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const year = parsed.getFullYear().toString().slice(-2);
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

const toDateOnly = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const matchesDateRange = (value: string | undefined, range: DateRange) => {
  if (!range.from && !range.to) return true;
  if (!value) return false;
  const target = toDateOnly(value);
  if (!target) return false;
  const fromDate = range.from ? toDateOnly(range.from) : null;
  const toDate = range.to ? toDateOnly(range.to) : null;

  if (fromDate && target < fromDate) return false;
  if (toDate && target > toDate) return false;
  return true;
};

const statusLabelMap = new Map(STATUS_OPTIONS.map((option) => [option.value, option.label]));

const buildManagementId = (index: number) => {
  const globalIndex = index + 1;
  const group = Math.floor((globalIndex - 1) / 9999) + 1;
  const sequence = ((globalIndex - 1) % 9999) + 1;
  return {
    group,
    sequence,
    label: `${group}-${sequence}`,
    isSplit: sequence >= 100,
  };
};

export default function InventoryPage() {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<{ key: string; position: "left" | "right" } | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columnEditorOpen, setColumnEditorOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState<SearchFilters>(defaultFilters);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>(defaultFilters);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditForms, setBulkEditForms] = useState<Record<string, Partial<InventoryRecord>>>({});
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [saleDraft, setSaleDraft] = useState<string>("");
  const [saleSavingId, setSaleSavingId] = useState<string | null>(null);
  const [saleErrors, setSaleErrors] = useState<Record<string, string>>({});
  const [showMakerSuggestions, setShowMakerSuggestions] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [masterData, setMasterData] = useState<MasterData>(DEFAULT_MASTER_DATA);
  const [existingInvoicePrompt, setExistingInvoicePrompt] = useState<{
    invoiceId: string;
    invoiceType: PurchaseInvoice["invoiceType"];
  } | null>(null);
  const [existingSalesInvoicePrompt, setExistingSalesInvoicePrompt] = useState<{
    invoiceId: string;
    invoiceType: SalesInvoice["invoiceType"];
  } | null>(null);
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [salesCandidateIds, setSalesCandidateIds] = useState<string[]>([]);

  useEffect(() => {
    setRecords(loadInventoryRecords());
  }, []);

  useEffect(() => {
    setMasterData(loadMasterData());
  }, []);

  useEffect(() => {
    const refreshInvoices = () => setPurchaseInvoices(loadPurchaseInvoices());
    refreshInvoices();
    window.addEventListener("focus", refreshInvoices);
    return () => window.removeEventListener("focus", refreshInvoices);
  }, []);

  useEffect(() => {
    const refreshInvoices = () => setSalesInvoices(loadSalesInvoices());
    refreshInvoices();
    window.addEventListener("focus", refreshInvoices);
    return () => window.removeEventListener("focus", refreshInvoices);
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
      const availableWidth = Math.max(containerWidth - RESERVED_SELECTION_WIDTH, 0);
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

  const makerOptions = useMemo(
    () => Array.from(new Set(records.map((item) => item.maker).filter(Boolean))) as string[],
    [records],
  );

  const modelOptions = useMemo(() => {
    const targetRecords = searchDraft.maker
      ? records.filter((item) => item.maker === searchDraft.maker)
      : records;
    return Array.from(
      new Set(
        targetRecords
          .map((item) => item.model ?? item.machineName)
          .filter(Boolean),
      ),
    ) as string[];
  }, [records, searchDraft.maker]);

  const filteredRecords = useMemo(() => {
    const keywordMaker = searchFilters.maker.trim().toLowerCase();
    const keywordModel = searchFilters.model.trim().toLowerCase();
    const keywordSupplier = searchFilters.supplier.trim().toLowerCase();
    const keywordStaff = searchFilters.staff.trim().toLowerCase();
    const showHidden = searchFilters.showHidden === "show";
    const showStock = searchFilters.showStock === "show";
    const showCompleted = searchFilters.showCompleted === "show";

    const sorted = [...records].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return sorted.filter((item) => {
      if (searchFilters.kind !== "all" && item.kind !== searchFilters.kind) {
        return false;
      }

      if (!showHidden && item.isVisible === false) {
        return false;
      }

      const statusValue = (item.status ?? item.stockStatus ?? "倉庫") as InventoryStatusOption;
      const isCompleted = statusValue === "売却済";
      const isStock = !isCompleted;

      if (!showStock && isStock) return false;
      if (!showCompleted && isCompleted) return false;

      if (keywordMaker && !(item.maker ?? "").toLowerCase().includes(keywordMaker)) {
        return false;
      }

      const modelValue = item.model ?? item.machineName ?? "";
      if (keywordModel && !modelValue.toLowerCase().includes(keywordModel)) {
        return false;
      }

      if (keywordSupplier && !(item.supplier ?? "").toLowerCase().includes(keywordSupplier)) {
        return false;
      }

      if (keywordStaff && !(item.staff ?? item.buyerStaff ?? "").toLowerCase().includes(keywordStaff)) {
        return false;
      }

      if (!matchesDateRange(item.createdAt, searchFilters.createdAt)) return false;

      const stockInValue = item.stockInDate ?? item.arrivalDate;
      if (!matchesDateRange(stockInValue, searchFilters.stockInDate)) return false;

      return true;
    });
  }, [records, searchFilters]);

  const displayRecords = useMemo(() => {
    if (searchFilters.displayCount === "all") return filteredRecords;
    return filteredRecords.slice(0, Number(searchFilters.displayCount));
  }, [filteredRecords, searchFilters.displayCount]);

  useEffect(() => {
    const allowed = new Set(displayRecords.map((record) => record.id));
    setSelectedIds((prev) => new Set([...prev].filter((id) => allowed.has(id))));
  }, [displayRecords]);

  const selectedRecords = useMemo(
    () => records.filter((record) => selectedIds.has(record.id)),
    [records, selectedIds],
  );

  const groupedSelected = useMemo(() => {
    const groups = new Map<string, InventoryRecord[]>();
    selectedRecords.forEach((record) => {
      const supplier = record.supplier?.trim() || "未設定";
      const current = groups.get(supplier) ?? [];
      current.push(record);
      groups.set(supplier, current);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, "ja"));
  }, [selectedRecords]);

  const purchaseInvoiceMap = useMemo(
    () => new Map(purchaseInvoices.map((invoice) => [invoice.invoiceId, invoice])),
    [purchaseInvoices],
  );

  const salesInvoiceMap = useMemo(() => {
    const map = new Map<string, { invoiceId: string; invoiceType: SalesInvoice["invoiceType"] }>();
    salesInvoices.forEach((invoice) => {
      const inventoryIds = invoice.inventoryIds ?? [];
      inventoryIds.forEach((id) => map.set(id, { invoiceId: invoice.invoiceId, invoiceType: invoice.invoiceType }));
      invoice.items?.forEach((item) => {
        if (item.inventoryId) {
          map.set(item.inventoryId, { invoiceId: invoice.invoiceId, invoiceType: invoice.invoiceType });
        }
      });
    });
    return map;
  }, [salesInvoices]);

  const resolveSupplierCategory = (record: InventoryRecord): PurchaseInvoice["invoiceType"] => {
    if (record.supplierCategory) {
      return record.supplierCategory === "hall" ? "hall" : "vendor";
    }
    const supplierName = record.supplierCorporate || record.supplier || "";
    const match = masterData.suppliers.find((supplier) => supplier.corporateName === supplierName);
    if (match?.category === "hall") return "hall";
    return "vendor";
  };

  const handleStatusChange = (id: string, status: ListingStatusOption) => {
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
      setSelectedIds(new Set(displayRecords.map((item) => item.id)));
      return;
    }
    setSelectedIds(new Set());
  };

  const handleBulkUpdate = (status: ListingStatusOption) => {
    if (selectedIds.size === 0) {
      alert("行を選択してください");
      return;
    }

    const statusLabel = statusLabelMap.get(status) ?? status;
    const message = `${selectedIds.size}件を${statusLabel}に変更します。よろしいですか？`;
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
      case "hasRemainingDebt":
        return record.hasRemainingDebt ? "有" : "無";
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
      case "status":
        return statusLabelMap.get(resolveListingStatus(record)) ?? "非出品";
      case "isConsignment":
        return record.isConsignment ?? record.consignment ? "○" : "-";
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

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchFilters(searchDraft);
    setSelectedIds(new Set());
  };

  const handleResetFilters = () => {
    setSearchDraft(defaultFilters);
    setSearchFilters(defaultFilters);
    setSelectedIds(new Set());
  };

  const handleBulkEditOpen = () => {
    if (selectedIds.size === 0) return;
    setBulkEditForms(() => {
      const next: Record<string, Partial<InventoryRecord>> = {};
      selectedRecords.forEach((record) => {
        next[record.id] = buildEditForm(record);
      });
      return next;
    });
    setBulkEditOpen(true);
  };

  const handleBulkEditClose = () => {
    setBulkEditOpen(false);
  };

  const handleBulkFormChange = <K extends keyof InventoryRecord>(
    id: string,
    key: K,
    value: InventoryRecord[K],
  ) => {
    setBulkEditForms((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value,
      },
    }));
  };

  const handleBulkSave = () => {
    let updatedRecords = records;
    selectedRecords.forEach((record) => {
      const form = bulkEditForms[record.id];
      if (!form) return;
      updatedRecords = updateInventoryRecord(record.id, buildPayload(form));
    });
    setRecords(updatedRecords);
    setBulkEditOpen(false);
    setSelectedIds(new Set());
  };

  const handleCsvDownload = () => {
    const headers = visibleColumns.map((col) => col.label);
    const rows = displayRecords.map((record, index) =>
      visibleColumns
        .map((col) => {
          const value =
            col.key === "id"
              ? buildManagementId(index).label
              : getCellText(record, String(col.key));
          const normalized = value ?? "";
          return `"${String(normalized).replace(/"/g, '""')}"`;
        })
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

  const startSaleEdit = (record: InventoryRecord) => {
    setEditingSaleId(record.id);
    setSaleDraft(record.saleUnitPrice != null ? String(record.saleUnitPrice) : "");
    setSaleErrors((prev) => ({ ...prev, [record.id]: "" }));
  };

  const cancelSaleEdit = () => {
    setEditingSaleId(null);
    setSaleDraft("");
  };

  const saveSaleEdit = (record: InventoryRecord) => {
    const normalized = saleDraft.replace(/,/g, "").trim();
    if (normalized && Number.isNaN(Number(normalized))) {
      setSaleErrors((prev) => ({ ...prev, [record.id]: "数値で入力してください。" }));
      return;
    }
    setSaleSavingId(record.id);
    const nextValue = normalized === "" ? undefined : Number(normalized);
    handleUpdateRecord(record.id, { saleUnitPrice: nextValue });
    setSaleSavingId(null);
    setEditingSaleId(null);
    setSaleDraft("");
  };

  const handleBulkCreatePurchaseInvoice = () => {
    if (selectedRecords.length === 0) {
      alert("在庫を選択してください。");
      return;
    }
    const created = selectedRecords.filter((record) => record.purchaseInvoiceId);
    const uncreated = selectedRecords.filter((record) => !record.purchaseInvoiceId);

    if (uncreated.length === 0 && created.length > 0) {
      const firstInvoiceId = created[0]?.purchaseInvoiceId ?? "";
      const invoice = purchaseInvoiceMap.get(firstInvoiceId);
      if (invoice) {
        setExistingInvoicePrompt({ invoiceId: invoice.invoiceId, invoiceType: invoice.invoiceType });
        return;
      }
      alert("選択した在庫はすでに購入伝票が作成済みです。");
      return;
    }

    if (created.length > 0) {
      alert("作成済みの在庫は除外しました。");
    }

    const grouped = new Map<string, InventoryRecord[]>();
    uncreated.forEach((record) => {
      const supplier = record.supplier?.trim() || record.supplierCorporate?.trim() || "未設定";
      const list = grouped.get(supplier) ?? [];
      list.push(record);
      grouped.set(supplier, list);
    });

    const summary = Array.from(grouped.entries())
      .map(([supplier, items]) => `${supplier}：${items.length}件`)
      .join("\n");
    const confirmed = window.confirm(`購入伝票を仕入先ごとに作成します。\n${summary}`);
    if (!confirmed) return;

    Array.from(grouped.entries()).forEach(([supplier, items], index) => {
      const invoiceType = resolveSupplierCategory(items[0]);
      const draftId = `${Date.now()}-${Math.floor(Math.random() * 1000)}-${index}`;
      saveDraft({ id: draftId, inventoryIds: items.map((item) => item.id) });
      const url = `/inventory/purchase-invoice/${invoiceType}/${draftId}`;
      window.open(url, "_blank", "noopener,noreferrer");
    });
  };

  const handleBulkCreateSalesInvoice = () => {
    if (selectedRecords.length === 0) {
      alert("在庫を選択してください。");
      return;
    }

    const blocked = selectedRecords
      .map((record) => salesInvoiceMap.get(record.id))
      .filter((item): item is { invoiceId: string; invoiceType: SalesInvoice["invoiceType"] } => Boolean(item));

    if (blocked.length > 0) {
      setExistingSalesInvoicePrompt(blocked[0]);
      return;
    }

    setSalesCandidateIds(selectedRecords.map((record) => record.id));
    setSalesModalOpen(true);
  };

  const handleSalesTypeSelect = (type: "hall" | "vendor") => {
    if (salesCandidateIds.length === 0) return;
    const params = new URLSearchParams({
      ids: salesCandidateIds.join(","),
      sellToType: type,
    });
    const url = `/inventory/sales-invoice/${type}/create?${params.toString()}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSalesModalOpen(false);
    setSalesCandidateIds([]);
  };

  return (
    <div className="min-h-screen bg-white py-6 mx-[1cm]">
      <div className="mx-auto max-w-[1600px] px-[38px]">
        <div className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-300 pb-3">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">在庫一覧</h1>
              <p className="text-xs text-neutral-600">登録された在庫の確認やステータス更新を行います。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleResetData}
                className="border border-gray-300 bg-[#f7f3e9] px-3 py-1 text-sm font-semibold text-neutral-700 shadow-[inset_0_1px_0_#fff]"
              >
                データ初期化
              </button>
              <Link
                href="/inventory/new"
                className="border border-gray-300 bg-[#f7f3e9] px-3 py-1 text-sm font-semibold text-neutral-700 shadow-[inset_0_1px_0_#fff]"
              >
                在庫を登録
              </Link>
            </div>
          </div>

          <div className="mt-4 border-2 border-gray-300">
            <div className="bg-slate-600 px-3 py-2 text-sm font-bold text-white">検索条件</div>
            <form onSubmit={handleSearchSubmit} className="bg-white">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  <tr>
                    <th className="w-32 border border-gray-300 bg-[#e8f5e9] px-2 py-1 text-left text-xs font-semibold">
                      P/S
                    </th>
                    <td className="border border-gray-300 px-2 py-1">
                      <div className="flex items-center gap-3 text-xs">
                        {["all", "P", "S"].map((value) => (
                          <label key={value} className="flex items-center gap-1">
                            <input
                              type="radio"
                              name="kind"
                              value={value}
                              checked={searchDraft.kind === value}
                              onChange={() =>
                                setSearchDraft((prev) => ({
                                  ...prev,
                                  kind: value as SearchFilters["kind"],
                                }))
                              }
                            />
                            <span>{value === "all" ? "全て" : value}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                    <th className="w-36 border border-gray-300 bg-[#e8f5e9] px-2 py-1 text-left text-xs font-semibold">
                      在庫入力日
                    </th>
                    <td className="border border-gray-300 px-2 py-1">
                      <div className="flex items-center gap-2 text-xs">
                        <input
                          type="date"
                          value={searchDraft.createdAt.from}
                          onChange={(event) =>
                            setSearchDraft((prev) => ({
                              ...prev,
                              createdAt: { ...prev.createdAt, from: event.target.value },
                            }))
                          }
                          className="w-full max-w-[130px] border border-[#c98200] bg-[#fff4d6] px-1 py-0.5"
                        />
                        <span>〜</span>
                        <input
                          type="date"
                          value={searchDraft.createdAt.to}
                          onChange={(event) =>
                            setSearchDraft((prev) => ({
                              ...prev,
                              createdAt: { ...prev.createdAt, to: event.target.value },
                            }))
                          }
                          className="w-full max-w-[130px] border border-[#c98200] bg-[#fff4d6] px-1 py-0.5"
                        />
                      </div>
                    </td>
                    <th className="w-28 border border-gray-300 bg-[#e8f5e9] px-2 py-1 text-left text-xs font-semibold">
                      入庫日
                    </th>
                    <td className="border border-gray-300 px-2 py-1">
                      <div className="flex items-center gap-2 text-xs">
                        <input
                          type="date"
                          value={searchDraft.stockInDate.from}
                          onChange={(event) =>
                            setSearchDraft((prev) => ({
                              ...prev,
                              stockInDate: { ...prev.stockInDate, from: event.target.value },
                            }))
                          }
                          className="w-full max-w-[130px] border border-[#c98200] bg-[#fff4d6] px-1 py-0.5"
                        />
                        <span>〜</span>
                        <input
                          type="date"
                          value={searchDraft.stockInDate.to}
                          onChange={(event) =>
                            setSearchDraft((prev) => ({
                              ...prev,
                              stockInDate: { ...prev.stockInDate, to: event.target.value },
                            }))
                          }
                          className="w-full max-w-[130px] border border-[#c98200] bg-[#fff4d6] px-1 py-0.5"
                        />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th className="border border-gray-300 bg-[#e8f5e9] px-2 py-1 text-left text-xs font-semibold">
                      メーカー
                    </th>
                    <td className="relative border border-gray-300 px-2 py-1">
                      <input
                        value={searchDraft.maker}
                        onChange={(event) =>
                          setSearchDraft((prev) => ({ ...prev, maker: event.target.value }))
                        }
                        onFocus={() => setShowMakerSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowMakerSuggestions(false), 150)}
                        className="w-full border border-[#c98200] bg-[#fff4d6] px-2 py-1 text-xs"
                      />
                      {showMakerSuggestions && makerOptions.length > 0 && (
                        <div className="absolute left-0 top-full z-10 mt-1 w-full border border-gray-300 bg-white text-xs">
                          {makerOptions
                            .filter((option) =>
                              option.toLowerCase().includes(searchDraft.maker.trim().toLowerCase()),
                            )
                            .slice(0, 6)
                            .map((option) => (
                              <button
                                key={option}
                                type="button"
                                className="block w-full px-2 py-1 text-left hover:bg-[#fff4d6]"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() =>
                                  setSearchDraft((prev) => ({ ...prev, maker: option }))
                                }
                              >
                                {option}
                              </button>
                            ))}
                        </div>
                      )}
                    </td>
                    <th className="border border-gray-300 bg-[#e8f5e9] px-2 py-1 text-left text-xs font-semibold">
                      機種名
                    </th>
                    <td className="relative border border-gray-300 px-2 py-1">
                      <input
                        value={searchDraft.model}
                        onChange={(event) =>
                          setSearchDraft((prev) => ({ ...prev, model: event.target.value }))
                        }
                        onFocus={() => setShowModelSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowModelSuggestions(false), 150)}
                        className="w-full border border-[#c98200] bg-[#fff4d6] px-2 py-1 text-xs"
                      />
                      {showModelSuggestions && modelOptions.length > 0 && (
                        <div className="absolute left-0 top-full z-10 mt-1 w-full border border-gray-300 bg-white text-xs">
                          {modelOptions
                            .filter((option) =>
                              option.toLowerCase().includes(searchDraft.model.trim().toLowerCase()),
                            )
                            .slice(0, 6)
                            .map((option) => (
                              <button
                                key={option}
                                type="button"
                                className="block w-full px-2 py-1 text-left hover:bg-[#fff4d6]"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() =>
                                  setSearchDraft((prev) => ({ ...prev, model: option }))
                                }
                              >
                                {option}
                              </button>
                            ))}
                        </div>
                      )}
                    </td>
                    <th className="border border-gray-300 bg-[#e8f5e9] px-2 py-1 text-left text-xs font-semibold">
                      仕入先
                    </th>
                    <td className="border border-gray-300 px-2 py-1">
                      <div className="flex items-center gap-2">
                        <input
                          value={searchDraft.supplier}
                          onChange={(event) =>
                            setSearchDraft((prev) => ({ ...prev, supplier: event.target.value }))
                          }
                          className="flex-1 border border-[#c98200] bg-[#fff4d6] px-2 py-1 text-xs"
                        />
                        <button
                          type="button"
                          className="border border-gray-300 bg-[#f7f3e9] px-2 py-0.5 text-xs font-semibold"
                        >
                          仕入先検索
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th className="border border-gray-300 bg-[#e8f5e9] px-2 py-1 text-left text-xs font-semibold">
                      仕入担当
                    </th>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        value={searchDraft.staff}
                        onChange={(event) =>
                          setSearchDraft((prev) => ({ ...prev, staff: event.target.value }))
                        }
                        className="w-full border border-[#c98200] bg-[#fff4d6] px-2 py-1 text-xs"
                      />
                    </td>
                    <th className="border border-gray-300 bg-[#e8f5e9] px-2 py-1 text-left text-xs font-semibold">
                      非表示物件
                    </th>
                    <td className="border border-gray-300 px-2 py-1">
                      <div className="flex items-center gap-3 text-xs">
                        {[
                          { value: "hide", label: "しない" },
                          { value: "show", label: "する" },
                        ].map((option) => (
                          <label key={option.value} className="flex items-center gap-1">
                            <input
                              type="radio"
                              name="hidden"
                              value={option.value}
                              checked={searchDraft.showHidden === option.value}
                              onChange={() =>
                                setSearchDraft((prev) => ({
                                  ...prev,
                                  showHidden: option.value as SearchFilters["showHidden"],
                                }))
                              }
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                    <th className="border border-gray-300 bg-[#e8f5e9] px-2 py-1 text-left text-xs font-semibold">
                      在庫物件
                    </th>
                    <td className="border border-gray-300 px-2 py-1">
                      <div className="flex items-center gap-3 text-xs">
                        {[
                          { value: "show", label: "する" },
                          { value: "hide", label: "しない" },
                        ].map((option) => (
                          <label key={option.value} className="flex items-center gap-1">
                            <input
                              type="radio"
                              name="stock"
                              value={option.value}
                              checked={searchDraft.showStock === option.value}
                              onChange={() =>
                                setSearchDraft((prev) => ({
                                  ...prev,
                                  showStock: option.value as SearchFilters["showStock"],
                                }))
                              }
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th className="border border-gray-300 bg-[#e8f5e9] px-2 py-1 text-left text-xs font-semibold">
                      完了物件
                    </th>
                    <td className="border border-gray-300 px-2 py-1">
                      <div className="flex items-center gap-3 text-xs">
                        {[
                          { value: "show", label: "する" },
                          { value: "hide", label: "しない" },
                        ].map((option) => (
                          <label key={option.value} className="flex items-center gap-1">
                            <input
                              type="radio"
                              name="completed"
                              value={option.value}
                              checked={searchDraft.showCompleted === option.value}
                              onChange={() =>
                                setSearchDraft((prev) => ({
                                  ...prev,
                                  showCompleted: option.value as SearchFilters["showCompleted"],
                                }))
                              }
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                    <th className="border border-gray-300 bg-[#e8f5e9] px-2 py-1 text-left text-xs font-semibold">
                      表示数
                    </th>
                    <td className="border border-gray-300 px-2 py-1">
                      <select
                        value={searchDraft.displayCount}
                        onChange={(event) =>
                          setSearchDraft((prev) => ({
                            ...prev,
                            displayCount: event.target.value as SearchFilters["displayCount"],
                          }))
                        }
                        className="border border-[#c98200] bg-[#fff4d6] px-2 py-1 text-xs"
                      >
                        <option value="all">全件</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                      </select>
                    </td>
                    <th className="border border-gray-300 bg-[#e8f5e9] px-2 py-1 text-left text-xs font-semibold">
                      表示件数
                    </th>
                    <td className="border border-gray-300 px-2 py-1 text-xs">
                      {displayRecords.length} 件
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="flex flex-wrap items-center gap-2 border-t border-gray-300 px-3 py-2">
                <button
                  type="submit"
                  className="border border-gray-300 bg-[#f7f3e9] px-4 py-1 text-sm font-semibold shadow-[inset_0_1px_0_#fff]"
                >
                  検索する
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="border border-gray-300 bg-[#f7f3e9] px-4 py-1 text-sm font-semibold shadow-[inset_0_1px_0_#fff]"
                >
                  リセット
                </button>
                <button
                  type="button"
                  onClick={handleCsvDownload}
                  className="border border-gray-300 bg-[#f7f3e9] px-4 py-1 text-sm font-semibold shadow-[inset_0_1px_0_#fff]"
                >
                  Download
                </button>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-neutral-700">選択: {selectedIds.size}件</span>
                  <button
                    type="button"
                    onClick={handleBulkEditOpen}
                    disabled={selectedIds.size === 0}
                    className="border border-gray-300 bg-[#f7f3e9] px-4 py-1 text-sm font-semibold shadow-[inset_0_1px_0_#fff] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    編集
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border border-gray-300 px-2 py-2 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-neutral-700">
              <span className="font-semibold">表示操作：</span>
              <span>ヘッダーをドラッグして並び替え</span>
              <button
                type="button"
                onClick={handleBulkCreatePurchaseInvoice}
                disabled={selectedIds.size === 0}
                className="border border-gray-300 bg-[#f7f3e9] px-3 py-1 text-xs font-semibold shadow-[inset_0_1px_0_#fff] disabled:cursor-not-allowed disabled:opacity-40"
              >
                購入伝票作成
              </button>
              <button
                type="button"
                onClick={handleBulkCreateSalesInvoice}
                disabled={selectedIds.size === 0}
                className="border border-gray-300 bg-[#f7f3e9] px-3 py-1 text-xs font-semibold shadow-[inset_0_1px_0_#fff] disabled:cursor-not-allowed disabled:opacity-40"
              >
                販売伝票作成
              </button>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleBulkUpdate("sold")}
                disabled={selectedIds.size === 0}
                className="border border-gray-300 bg-[#f7f3e9] px-3 py-1 text-xs font-semibold shadow-[inset_0_1px_0_#fff] disabled:cursor-not-allowed disabled:opacity-40"
              >
                一括：売却
              </button>
              <button
                type="button"
                onClick={() => handleBulkUpdate("listing")}
                disabled={selectedIds.size === 0}
                className="border border-gray-300 bg-[#f7f3e9] px-3 py-1 text-xs font-semibold shadow-[inset_0_1px_0_#fff] disabled:cursor-not-allowed disabled:opacity-40"
              >
                一括：出品
              </button>
              <button
                type="button"
                onClick={() => handleBulkUpdate("not_listing")}
                disabled={selectedIds.size === 0}
                className="border border-gray-300 bg-[#f7f3e9] px-3 py-1 text-xs font-semibold shadow-[inset_0_1px_0_#fff] disabled:cursor-not-allowed disabled:opacity-40"
              >
                一括：非出品
              </button>
              <button
                type="button"
                onClick={handleBulkEditOpen}
                disabled={selectedIds.size === 0}
                className="border border-gray-300 bg-[#f7f3e9] px-3 py-1 text-xs font-semibold shadow-[inset_0_1px_0_#fff] disabled:cursor-not-allowed disabled:opacity-40"
              >
                一括編集
              </button>
              <button
                type="button"
                onClick={() => setColumnEditorOpen(true)}
                className="border border-gray-300 bg-[#f7f3e9] px-3 py-1 text-xs font-semibold shadow-[inset_0_1px_0_#fff]"
              >
                表示項目編集
              </button>
            </div>
          </div>

          {bulkEditOpen && (
            <div className="mt-4 border-2 border-gray-300">
              <div className="bg-slate-600 px-3 py-2 text-sm font-bold text-white">
                一括編集 ({selectedIds.size}件)
              </div>
              <div className="space-y-4 bg-white p-3">
                <InventoryEditTable
                  groups={groupedSelected}
                  bulkEditForms={bulkEditForms}
                  onChange={handleBulkFormChange}
                />
                {groupedSelected.length === 0 && (
                  <div className="border border-gray-300 px-4 py-6 text-center text-sm text-neutral-600">
                    編集対象の在庫を選択してください。
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleBulkEditClose}
                    className="border border-gray-300 bg-[#f7f3e9] px-4 py-1 text-sm font-semibold shadow-[inset_0_1px_0_#fff]"
                  >
                    閉じる
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkSave}
                    className="border border-gray-300 bg-[#f7f3e9] px-4 py-1 text-sm font-semibold shadow-[inset_0_1px_0_#fff]"
                  >
                    一括保存
                  </button>
                </div>
              </div>
            </div>
          )}

          <div ref={tableRef} className="mt-4 w-full overflow-x-auto">
            <table className="min-w-full table-fixed border-collapse border-2 border-gray-300 text-[11px]">
              <thead className="bg-slate-600 text-left font-semibold text-white">
                <tr>
                  <th className="w-10 border border-gray-300 px-1 py-1">
                    <input
                      type="checkbox"
                      checked={displayRecords.length > 0 && selectedIds.size === displayRecords.length}
                      onChange={(event) => handleSelectAll(event.target.checked)}
                      className="h-4 w-4 border-gray-300"
                    />
                  </th>
                  {visibleColumns.map((col) => (
                    <th
                      key={col.key}
                      draggable
                      onDragStart={() => handleDragStart(String(col.key))}
                      onDragOver={(event) => handleDragOver(event, String(col.key))}
                      onDrop={() => handleDrop(String(col.key))}
                      className="relative select-none border border-gray-300 px-1 py-1"
                      style={{ width: `${col.width}px`, minWidth: `${col.minWidth}px` }}
                    >
                      <span
                        className={`block px-0.5 py-0.5 ${dragOver?.key === col.key ? "bg-white/20" : ""}`}
                      >
                        {col.label}
                      </span>
                      {dragOver && dragOver.key === col.key && (
                        <div
                          className={`absolute inset-y-1 ${dragOver.position === "left" ? "left-1" : "right-1"} w-0.5 bg-white`}
                        />
                      )}
                    </th>
                  ))}
                  <th className="border border-gray-300 px-1 py-1 text-center">番号・編集</th>
                  <th className="border border-gray-300 px-1 py-1 text-center">購伝票</th>
                  <th className="border border-gray-300 px-1 py-1 text-center">販伝票</th>
                </tr>
              </thead>
              <tbody>
                {displayRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumns.length + 4}
                      className="border border-gray-300 px-3 py-6 text-center text-sm text-neutral-600"
                    >
                      登録された在庫がありません。
                    </td>
                  </tr>
                ) : (
                  displayRecords.map((item, index) => (
                    <tr key={item.id} className="border-t border-gray-300 text-[11px] hover:bg-[#fffbe6]">
                      <td className="w-10 border border-gray-300 px-1 py-0.5 align-middle">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => handleSelectRow(item.id)}
                          className="h-4 w-4 border-gray-300"
                        />
                      </td>
                      {visibleColumns.map((col) => {
                        const fullText = getCellText(item, String(col.key));
                        const statusValue = resolveListingStatus(item);
                        const managementId = col.key === "id" ? buildManagementId(index) : null;
                        const displayText = col.key === "id" ? managementId?.label ?? fullText : fullText;
                        const numeric = NUMERIC_COLUMNS.includes(col.key);
                        const isDate = DATE_COLUMNS.includes(col.key);
                        const shouldWrap = WRAP_COLUMNS.includes(col.key);

                        return (
                          <td
                            key={col.key}
                            className={`border border-gray-300 px-1 py-0.5 align-middle text-neutral-800 ${
                              numeric ? "text-right" : ""
                            } ${isDate || numeric ? "whitespace-nowrap" : ""} ${
                              shouldWrap ? "whitespace-normal break-words" : ""
                            }`}
                            style={{ width: `${col.width}px`, minWidth: `${col.minWidth}px` }}
                            title={col.key === "id" ? item.id : undefined}
                          >
                            {col.key === "status" ? (
                              <select
                                value={statusValue}
                                onChange={(event) =>
                                  handleStatusChange(item.id, event.target.value as ListingStatusOption)
                                }
                                className="w-full border border-[#c98200] bg-[#fff4d6] px-1 py-0.5 text-xs"
                              >
                                {STATUS_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            ) : col.key === "isVisible" ? (
                              <div className="flex items-center justify-center">
                                <select
                                  value={item.isVisible === false ? "0" : "1"}
                                  onChange={(event) => handleVisibilityChange(item.id, event.target.value === "1")}
                                  className="w-[70px] border border-[#c98200] bg-[#fff4d6] px-1 py-0.5 text-xs"
                                >
                                  <option value="1">する</option>
                                  <option value="0">しない</option>
                                </select>
                              </div>
                            ) : col.key === "saleUnitPrice" ? (
                              <div className="space-y-1">
                                {editingSaleId === item.id ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      value={saleDraft}
                                      onChange={(event) => setSaleDraft(event.target.value)}
                                      className="w-full border border-[#c98200] bg-[#fff4d6] px-1 py-0.5 text-right text-xs"
                                      disabled={saleSavingId === item.id}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => saveSaleEdit(item)}
                                      disabled={saleSavingId === item.id}
                                      className="border border-gray-300 bg-[#f7f3e9] px-1 text-xs"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelSaleEdit}
                                      disabled={saleSavingId === item.id}
                                      className="border border-gray-300 bg-[#f7f3e9] px-1 text-xs"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => startSaleEdit(item)}
                                    className="w-full text-right hover:bg-[#fff4d6]"
                                  >
                                    {displayText}
                                  </button>
                                )}
                                {saleErrors[item.id] && (
                                  <p className="text-[10px] text-red-600">{saleErrors[item.id]}</p>
                                )}
                              </div>
                            ) : col.key === "id" && managementId ? (
                              managementId.isSplit ? (
                                <span className="flex flex-col items-center leading-tight">
                                  <span>{`${managementId.group}-`}</span>
                                  <span>{managementId.sequence}</span>
                                </span>
                              ) : (
                                <span className="block text-center">{managementId.label}</span>
                              )
                            ) : (
                              <span className={`block max-w-full ${numeric ? "tabular-nums" : ""}`}>
                                {displayText}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="border border-gray-300 px-1 py-0.5 text-center">
                        <Link
                          href={`/inventory/${item.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full border border-gray-300 bg-[#f7f3e9] px-1 py-1 text-[11px] font-semibold text-neutral-800 shadow-[inset_0_1px_0_#fff]"
                        >
                          ＋
                        </Link>
                      </td>
                      <td className="border border-gray-300 px-1 py-0.5 text-center">
                        {item.purchaseInvoiceId ? (
                          <button
                            type="button"
                            onClick={() => {
                              const invoice = purchaseInvoiceMap.get(item.purchaseInvoiceId ?? "");
                              const invoiceType = invoice?.invoiceType ?? "vendor";
                              const url = `/inventory/purchase-invoice/${invoiceType}/${item.purchaseInvoiceId}`;
                              window.open(url, "_blank", "noopener,noreferrer");
                            }}
                            className="w-full border border-gray-300 bg-[#fff4d6] px-1 py-1 text-[11px] font-semibold text-emerald-700"
                          >
                            ○
                          </button>
                        ) : (
                          <span className="text-transparent">-</span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-1 py-0.5 text-center">
                        {salesInvoiceMap.has(item.id) ? (
                          <button
                            type="button"
                            onClick={() => {
                              const invoice = salesInvoiceMap.get(item.id);
                              if (!invoice) return;
                              const url = `/inventory/sales-invoice/${invoice.invoiceType}/${invoice.invoiceId}`;
                              window.open(url, "_blank", "noopener,noreferrer");
                            }}
                            className="w-full border border-gray-300 bg-[#fff4d6] px-1 py-1 text-[11px] font-semibold text-emerald-700"
                          >
                            済
                          </button>
                        ) : (
                          <span className="text-transparent">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {columnEditorOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg border-2 border-gray-300 bg-white">
            <div className="flex items-center justify-between border-b border-gray-300 px-4 py-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">表示項目を編集</h3>
                <p className="text-xs text-neutral-600">チェックを外すと列が非表示になります。設定はブラウザに保存されます。</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetColumns}
                  className="border border-gray-300 bg-[#f7f3e9] px-2 py-1 text-xs font-semibold"
                >
                  初期化
                </button>
                <button
                  type="button"
                  onClick={() => setColumnEditorOpen(false)}
                  className="border border-gray-300 bg-[#f7f3e9] px-2 py-1 text-xs font-semibold"
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
                    className="flex items-center justify-between gap-3 border border-gray-300 px-3 py-2 text-sm text-neutral-800"
                  >
                    <span className="flex-1 truncate">{col.label}</span>
                    <input
                      type="checkbox"
                      checked={col.visible !== false}
                      onChange={(event) => toggleColumnVisibility(col.key, event.target.checked)}
                      className="h-4 w-4 border-gray-300"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {existingInvoicePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md border-2 border-gray-300 bg-white">
            <div className="bg-slate-600 px-4 py-3 text-sm font-semibold text-white">購入伝票ガード</div>
            <div className="space-y-4 px-4 py-4 text-sm text-neutral-800">
              <p>既に作成済みの伝票を開きますか？</p>
              <p className="text-xs text-neutral-500">伝票ID: {existingInvoicePrompt.invoiceId}</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-300 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  const url = `/inventory/purchase-invoice/${existingInvoicePrompt.invoiceType}/${existingInvoicePrompt.invoiceId}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                  setExistingInvoicePrompt(null);
                }}
                className="border border-gray-300 bg-[#f7f3e9] px-4 py-1 text-sm font-semibold"
              >
                作成済み伝票を開く
              </button>
              <button
                type="button"
                onClick={() => setExistingInvoicePrompt(null)}
                className="border border-gray-300 bg-[#f7f3e9] px-4 py-1 text-sm font-semibold"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {salesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm border-2 border-gray-400 bg-white">
            <div className="border-b-2 border-gray-400 bg-gray-200 px-4 py-2 text-sm font-semibold text-neutral-800">
              売り先種別を選択
            </div>
            <div className="space-y-2 px-4 py-4 text-sm text-neutral-800">
              <button
                type="button"
                onClick={() => handleSalesTypeSelect("hall")}
                className="w-full border-2 border-gray-400 bg-[#f7f3e9] px-4 py-2 text-sm font-semibold"
              >
                ホール
              </button>
              <button
                type="button"
                onClick={() => handleSalesTypeSelect("vendor")}
                className="w-full border-2 border-gray-400 bg-[#f7f3e9] px-4 py-2 text-sm font-semibold"
              >
                業者
              </button>
              <button
                type="button"
                onClick={() => {
                  setSalesModalOpen(false);
                  setSalesCandidateIds([]);
                }}
                className="w-full border-2 border-gray-400 bg-white px-4 py-2 text-sm font-semibold text-neutral-600"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {existingSalesInvoicePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md border-2 border-gray-300 bg-white">
            <div className="bg-slate-600 px-4 py-3 text-sm font-semibold text-white">販売伝票ガード</div>
            <div className="space-y-4 px-4 py-4 text-sm text-neutral-800">
              <p>作成済みの在庫が含まれています。作成済み伝票を開きますか？</p>
              <p className="text-xs text-neutral-500">伝票ID: {existingSalesInvoicePrompt.invoiceId}</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-300 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  const url = `/inventory/sales-invoice/${existingSalesInvoicePrompt.invoiceType}/${existingSalesInvoicePrompt.invoiceId}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                  setExistingSalesInvoicePrompt(null);
                }}
                className="border border-gray-300 bg-[#f7f3e9] px-4 py-1 text-sm font-semibold"
              >
                作成済み伝票を開く
              </button>
              <button
                type="button"
                onClick={() => setExistingSalesInvoicePrompt(null)}
                className="border border-gray-300 bg-[#f7f3e9] px-4 py-1 text-sm font-semibold"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
