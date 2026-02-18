"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  loadInventoryRecords,
  resetInventoryRecords,
  saveDraft,
  saveInventoryRecords,
  updateInventoryRecord,
  generateInventoryId,
  type InventoryRecord,
} from "@/lib/demo-data/demoInventory";
import { DEFAULT_MASTER_DATA, loadMasterData, type MasterData } from "@/lib/demo-data/demoMasterData";
import { loadPurchaseInvoices, savePurchaseInvoices } from "@/lib/demo-data/purchaseInvoices";
import { loadSalesInvoices } from "@/lib/demo-data/salesInvoices";
import type { InventoryStatusOption, PurchaseInvoice } from "@/types/purchaseInvoices";
import type { SalesInvoice } from "@/types/salesInvoices";
import InventoryEditTable from "@/components/inventory/InventoryEditTable";
import { buildEditForm, buildPayload } from "@/lib/inventory/editUtils";
import {
  loadSerialDraft,
  loadSerialInput,
  loadSerialRows,
  loadSerialRowsSync,
  type SerialInputRow,
} from "@/lib/serialInputStorage";
import { formatCompactId } from "@/lib/inventory/idDisplay";
import { openAttachmentInNewTab } from "@/lib/attachments/attachmentStore";

type Column = {
  key: keyof InventoryRecord;
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

type TriStateFilter = "all" | "only" | "exclude";

type SearchFilters = {
  kind: "all" | "P" | "S";
  createdAt: DateRange;
  stockInDate: DateRange;
  maker: string;
  model: string;
  serialQuery: string;
  serialBoard: boolean;
  serialFrame: boolean;
  supplier: string;
  staff: string;
  warehouse: string;
  showHidden: TriStateFilter;
  showCompleted: TriStateFilter;
};

const RESERVED_SELECTION_WIDTH = 48;
const COLUMN_SETTINGS_KEY = "inventory_table_columns_v1";
const SALES_INVOICE_CREATE_SELECTED_IDS_KEY = "sales_invoice_create_selected_ids";

const normalizeAttachmentId = (value?: string | null): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const NUMERIC_COLUMNS: Array<Column["key"]> = ["quantity", "unitPrice", "saleUnitPrice"];
const DATE_COLUMNS: Array<Column["key"]> = ["createdAt", "stockInDate", "removeDate"];
const WRAP_COLUMNS: Array<Column["key"]> = ["maker", "model", "warehouse", "supplier", "staff", "note"];
const REQUIRED_SERIAL_KEYS: Array<keyof SerialInputRow> = ["board"];

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
  serialQuery: "",
  serialBoard: false,
  serialFrame: false,
  supplier: "",
  staff: "",
  warehouse: "",
  showHidden: "exclude",
  showCompleted: "all",
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

const matchesTriState = (value: boolean, filter: TriStateFilter) => {
  if (filter === "all") return true;
  if (filter === "only") return value;
  return !value;
};

const isSerialRowComplete = (row: SerialInputRow) =>
  REQUIRED_SERIAL_KEYS.every((key) => String(row[key] ?? "").trim() !== "");

const isSerialCompleteForQuantity = (rows: SerialInputRow[], quantity: number) => {
  if (rows.length !== quantity) return false;
  return rows.every((row) => isSerialRowComplete(row));
};

const computePurchaseInvoiceTotal = (invoice: PurchaseInvoice): number => {
  const items = invoice.items ?? [];
  const subtotal = items.reduce((sum, item) => {
    const amount = item.amount ?? (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    return sum + (Number.isNaN(amount) ? 0 : amount);
  }, 0);
  const tax = Math.floor(subtotal * 0.1);
  const shippingInsurance = Number(invoice.formInput?.shippingInsurance || 0);
  const extraCostTotal = (invoice.extraCosts ?? []).reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0,
  );
  return subtotal + tax + shippingInsurance + extraCostTotal;
};

const formatInventoryShortId = (value: string) => formatCompactId(value, 6);

const parseNonNegativeInteger = (value: string) => {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return { normalized: "", parsed: undefined, error: "" };
  if (!/^\d+$/.test(normalized)) {
    return { normalized, parsed: undefined, error: "0以上の整数で入力してください。" };
  }
  return { normalized, parsed: Number(normalized), error: "" };
};

const compareInventoryRecordsByNewest = (a: InventoryRecord, b: InventoryRecord) => {
  const createdAtDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  if (createdAtDiff !== 0) return createdAtDiff;
  return b.id.localeCompare(a.id, "ja", { numeric: true, sensitivity: "base" });
};

export default function InventoryPage() {
  const router = useRouter();
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
  const [saleModalRecord, setSaleModalRecord] = useState<InventoryRecord | null>(null);
  const [saleDraft, setSaleDraft] = useState<string>("");
  const [saleSaving, setSaleSaving] = useState(false);
  const [saleError, setSaleError] = useState("");
  const [decomposeTarget, setDecomposeTarget] = useState<InventoryRecord | null>(null);
  const [decomposeCellDraft, setDecomposeCellDraft] = useState("");
  const [decomposeFrameDraft, setDecomposeFrameDraft] = useState("");
  const [decomposeError, setDecomposeError] = useState("");
  const [decomposeSaving, setDecomposeSaving] = useState(false);
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
  const [serialCompletionMap, setSerialCompletionMap] = useState<Record<string, boolean>>({});
  const [warehouseOptions, setWarehouseOptions] = useState<string[]>([]);
  const [hoveredColumnKey, setHoveredColumnKey] = useState<Column["key"] | null>(null);

  useEffect(() => {
    setRecords(loadInventoryRecords());
  }, []);

  useEffect(() => {
    setMasterData(loadMasterData());
  }, []);

  useEffect(() => {
    if (masterData.warehouses.length > 0) {
      setWarehouseOptions(masterData.warehouses);
      return;
    }
    setWarehouseOptions(["東京第1倉庫", "埼玉倉庫", "大阪倉庫"]);
  }, [masterData.warehouses]);

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
    if (records.length === 0 || salesInvoices.length === 0) return;
    const soldIds = new Set(
      salesInvoices.flatMap((invoice) => [
        ...(invoice.inventoryIds ?? []),
        ...(invoice.items ?? [])
          .map((item) => item.inventoryId)
          .filter((id): id is string => Boolean(id)),
      ]),
    );
    let updated = false;
    const nextRecords = records.map((record): InventoryRecord => {
      if (!soldIds.has(record.id)) return record;
      if (record.listingStatus === "sold") return record;
      updated = true;
      return {
        ...record,
        listingStatus: "sold",
        status: "売却済",
        stockStatus: "売却済",
      };
    });
    if (updated) {
      saveInventoryRecords(nextRecords);
      setRecords(nextRecords);
    }
  }, [records, salesInvoices]);

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
    const serialQuery = searchFilters.serialQuery.trim().toLowerCase();
    const serialBoard = searchFilters.serialBoard;
    const serialFrame = searchFilters.serialFrame;
    const keywordSupplier = searchFilters.supplier.trim().toLowerCase();
    const keywordStaff = searchFilters.staff.trim().toLowerCase();
    const hiddenFilter = searchFilters.showHidden;
    const completedFilter = searchFilters.showCompleted;

    const sorted = [...records].sort(compareInventoryRecordsByNewest);

    return sorted.filter((item) => {
      if (searchFilters.kind !== "all" && item.kind !== searchFilters.kind) {
        return false;
      }

      const isHidden = item.isVisible === false;
      if (!matchesTriState(isHidden, hiddenFilter)) {
        return false;
      }

      const statusValue = (item.status ?? item.stockStatus ?? "倉庫") as InventoryStatusOption;
      const isCompleted = statusValue === "売却済";

      if (!matchesTriState(isCompleted, completedFilter)) return false;

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

      if (searchFilters.warehouse) {
        const warehouseValue = item.warehouse ?? item.storageLocation ?? "";
        if (warehouseValue !== searchFilters.warehouse) {
          return false;
        }
      }

      if (!matchesDateRange(item.createdAt, searchFilters.createdAt)) return false;

      const stockInValue = item.stockInDate ?? item.arrivalDate;
      if (!matchesDateRange(stockInValue, searchFilters.stockInDate)) return false;

      if (serialQuery && (serialBoard || serialFrame)) {
        const rows = loadSerialRowsSync(item.id);
        const matchesBoard =
          serialBoard && rows.some((row) => (row.board ?? "").toLowerCase().includes(serialQuery));
        const matchesFrame =
          serialFrame && rows.some((row) => (row.frame ?? "").toLowerCase().includes(serialQuery));
        if (!matchesBoard && !matchesFrame) return false;
      }

      return true;
    });
  }, [records, searchFilters]);

  const displayRecords = filteredRecords;

  useEffect(() => {
    let active = true;

    const refreshSerialCompletion = async () => {
      if (displayRecords.length === 0) {
        if (active) setSerialCompletionMap({});
        return;
      }

      const entries = await Promise.all(
        displayRecords.map(async (record) => {
          const rows = await loadSerialRows(record.id);
          const targetQuantity = Math.max(1, Number(record.quantity ?? 1) || 1);
          const isComplete = isSerialCompleteForQuantity(rows, targetQuantity);
          return [record.id, isComplete] as const;
        }),
      );

      if (!active) return;
      setSerialCompletionMap(Object.fromEntries(entries));
    };

    void refreshSerialCompletion();

    const handleFocus = () => void refreshSerialCompletion();
    window.addEventListener("focus", handleFocus);
    return () => {
      active = false;
      window.removeEventListener("focus", handleFocus);
    };
  }, [displayRecords]);

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

  const purchaseLinkedIds = useMemo(() => {
    const ids = new Set<string>();
    purchaseInvoices.forEach((invoice) => {
      invoice.inventoryIds?.forEach((id) => ids.add(id));
      invoice.items?.forEach((item) => {
        if (item.inventoryId) ids.add(item.inventoryId);
      });
    });
    return ids;
  }, [purchaseInvoices]);

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

  const handleUpdateRecord = (id: string, payload: Partial<InventoryRecord>) => {
    const updated = updateInventoryRecord(id, payload);
    setRecords(updated);
  };

  const handleBulkToggleVisibility = () => {
    if (selectedIds.size === 0) {
      alert("在庫を選択してください。");
      return;
    }

    let updatedRecords = records;
    selectedRecords.forEach((record) => {
      const nextVisible = record.isVisible === false;
      updatedRecords = updateInventoryRecord(record.id, { isVisible: nextVisible });
    });
    setRecords(updatedRecords);
  };

  const handleWarehouseChange = (id: string, warehouse: string) => {
    handleUpdateRecord(id, { warehouse, storageLocation: warehouse });
  };

  const updatePurchaseInvoicesForInventoryDelete = (inventoryId: string) => {
    let updated = false;
    const nextInvoices: PurchaseInvoice[] = [];

    purchaseInvoices.forEach((invoice) => {
      const nextItems = (invoice.items ?? []).filter((item) => item.inventoryId !== inventoryId);
      const nextInventoryIds = (invoice.inventoryIds ?? []).filter((id) => id !== inventoryId);
      const itemsChanged = nextItems.length !== (invoice.items ?? []).length;
      const idsChanged = nextInventoryIds.length !== (invoice.inventoryIds ?? []).length;

      if (!itemsChanged && !idsChanged) {
        nextInvoices.push(invoice);
        return;
      }

      updated = true;
      if (nextItems.length === 0) {
        return;
      }

      const nextInvoice: PurchaseInvoice = {
        ...invoice,
        items: nextItems,
        inventoryIds: nextInventoryIds,
      };
      nextInvoice.totalAmount = computePurchaseInvoiceTotal(nextInvoice);
      nextInvoices.push(nextInvoice);
    });

    if (updated) {
      savePurchaseInvoices(nextInvoices);
      setPurchaseInvoices(nextInvoices);
    }
  };

  const updatePurchaseInvoicesForInventorySplit = (
    inventoryId: string,
    nextIds: [string, string],
  ) => {
    let updated = false;
    const nextInvoices = purchaseInvoices.map((invoice) => {
      const items = invoice.items ?? [];
      const inventoryIds = invoice.inventoryIds ?? [];
      const itemMatched = items.some((item) => item.inventoryId === inventoryId);
      const idMatched = inventoryIds.includes(inventoryId);
      if (!itemMatched && !idMatched) return invoice;

      updated = true;
      const nextItems = items.flatMap((item) => {
        if (item.inventoryId !== inventoryId) return [item];
        const unitPrice = Number(item.unitPrice) || 0;
        const buildItem = (type: string, nextId: string) => ({
          ...item,
          inventoryId: nextId,
          type,
          quantity: 1,
          amount: unitPrice ? unitPrice * 1 : Number(item.amount) || 0,
        });
        return [buildItem("セル", nextIds[0]), buildItem("枠", nextIds[1])];
      });
      const nextInventoryIds = inventoryIds.flatMap((id) =>
        id === inventoryId ? nextIds : [id],
      );
      const nextInvoice: PurchaseInvoice = {
        ...invoice,
        items: nextItems,
        inventoryIds: nextInventoryIds,
      };
      nextInvoice.totalAmount = computePurchaseInvoiceTotal(nextInvoice);
      return nextInvoice;
    });

    if (updated) {
      savePurchaseInvoices(nextInvoices);
      setPurchaseInvoices(nextInvoices);
    }
  };

  const handleDeleteRecord = (record: InventoryRecord) => {
    const hasPurchaseInvoice =
      Boolean(record.purchaseInvoiceId) || purchaseLinkedIds.has(record.id);
    const hasSalesInvoice = salesInvoiceMap.has(record.id);
    if (hasSalesInvoice) {
      alert("販売伝票に紐づいているため削除できません。");
      return;
    }
    const confirmed = window.confirm(
      hasPurchaseInvoice
        ? "対象の在庫を削除します。関連する購入伝票も更新されます。よろしいですか？"
        : "対象の在庫を削除します。よろしいですか？",
    );
    if (!confirmed) return;
    const updated = records.filter((item) => item.id !== record.id);
    saveInventoryRecords(updated);
    setRecords(updated);
    updatePurchaseInvoicesForInventoryDelete(record.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(record.id);
      return next;
    });
  };

  const handleDecomposeInventory = async () => {
    if (selectedIds.size === 0) {
      alert("在庫を選択してください。");
      return;
    }
    if (selectedIds.size > 1) {
      alert("分解は1件ずつ実行してください。");
      return;
    }

    const targetId = Array.from(selectedIds)[0];
    const target = records.find((record) => record.id === targetId);
    if (!target) {
      alert("対象の在庫が見つかりません。");
      return;
    }

    const normalizedKind = (target.kind ?? "").toString().toUpperCase();
    const resolvedType = (target.type ?? target.deviceType ?? "").toString().trim();
    const quantity = Number(target.quantity ?? 1);

    if (salesInvoiceMap.has(target.id)) {
      alert("販売伝票作成済みのため分解できません。");
      return;
    }
    if (normalizedKind !== "P") {
      alert("種別がPの在庫のみ分解できます。");
      return;
    }
    if (resolvedType !== "本体") {
      alert("タイプが本体の在庫のみ分解できます。");
      return;
    }
    if (quantity !== 1) {
      alert("仕入数が1の在庫のみ分解できます。");
      return;
    }

    const serialInput = loadSerialInput(target.id) ?? loadSerialDraft(target.id);
    const serialRows = await loadSerialRows(target.id);
    if (serialInput || serialRows.length > 0) {
      alert("番号入力済みのため分解できません。");
      return;
    }

    openDecomposeModal(target);
  };

  const handleSalesCreate = () => {
    if (selectedIds.size === 0) {
      alert("在庫を選択してください。");
      return;
    }
    const ids = [...selectedIds];
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SALES_INVOICE_CREATE_SELECTED_IDS_KEY, JSON.stringify(ids));
    }
    const params = new URLSearchParams({ ids: ids.join(",") });
    router.push(`/sales/sales-invoice/create?${params.toString()}`);
  };

  const openInventoryDetail = (inventoryId: string) => {
    router.push(`/sales/${inventoryId}`);
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
        return record.saleUnitPrice == null || record.saleUnitPrice === 0
          ? "応相談"
          : record.saleUnitPrice.toLocaleString();
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

  const openDecomposeModal = (record: InventoryRecord) => {
    setDecomposeTarget(record);
    const basePrice = record.unitPrice ?? 0;
    setDecomposeCellDraft(basePrice.toLocaleString());
    setDecomposeFrameDraft("0");
    setDecomposeError("");
  };

  const closeDecomposeModal = () => {
    setDecomposeTarget(null);
    setDecomposeCellDraft("");
    setDecomposeFrameDraft("");
    setDecomposeError("");
    setDecomposeSaving(false);
  };

  const saveDecompose = () => {
    if (!decomposeTarget) return;
    const cellResult = parseNonNegativeInteger(decomposeCellDraft);
    const frameResult = parseNonNegativeInteger(decomposeFrameDraft);
    if (cellResult.error) {
      setDecomposeError(cellResult.error);
      return;
    }
    if (frameResult.error) {
      setDecomposeError(frameResult.error);
      return;
    }

    const basePrice = decomposeTarget.unitPrice ?? 0;
    const cellPrice = cellResult.parsed ?? 0;
    const framePrice = frameResult.parsed ?? 0;
    if (cellPrice + framePrice !== basePrice) {
      setDecomposeError("セル単価と枠単価の合計を本体単価に合わせてください。");
      return;
    }

    setDecomposeSaving(true);
    const cellId = generateInventoryId();
    const frameId = generateInventoryId();
    const baseRecord: InventoryRecord = {
      ...decomposeTarget,
      quantity: 1,
    };
    const cellRecord: InventoryRecord = {
      ...baseRecord,
      id: cellId,
      type: "セル",
      unitPrice: cellPrice,
    };
    const frameRecord: InventoryRecord = {
      ...baseRecord,
      id: frameId,
      type: "枠",
      unitPrice: framePrice,
    };
    const updatedRecords = records.flatMap((record) => {
      if (record.id !== decomposeTarget.id) return [record];
      return [cellRecord, frameRecord];
    });
    saveInventoryRecords(updatedRecords);
    setRecords(updatedRecords);
    updatePurchaseInvoicesForInventorySplit(decomposeTarget.id, [cellId, frameId]);
    setSelectedIds(new Set());
    closeDecomposeModal();
  };

  const handleCsvDownload = () => {
    const headers = visibleColumns.map((col) => col.label);
    const rows = displayRecords.map((record) =>
      visibleColumns
        .map((col) => {
          const value =
            col.key === "id" ? formatInventoryShortId(record.id) : getCellText(record, String(col.key));
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
    setSaleModalRecord(record);
    setSaleDraft(record.saleUnitPrice != null ? record.saleUnitPrice.toLocaleString() : "");
    setSaleError("");
  };

  const closeSaleModal = () => {
    setSaleModalRecord(null);
    setSaleDraft("");
    setSaleError("");
    setSaleSaving(false);
  };

  const saveSaleEdit = () => {
    if (!saleModalRecord) return;
    const { parsed, error } = parseNonNegativeInteger(saleDraft);
    if (error) {
      setSaleError(error);
      return;
    }
    setSaleSaving(true);
    handleUpdateRecord(saleModalRecord.id, { saleUnitPrice: parsed });
    closeSaleModal();
  };

  useEffect(() => {
    if (!saleModalRecord) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSaleModal();
      }
      if (event.key === "Enter") {
        event.preventDefault();
        saveSaleEdit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeSaleModal, saleModalRecord, saveSaleEdit]);

  useEffect(() => {
    if (!decomposeTarget) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDecomposeModal();
      }
      if (event.key === "Enter") {
        event.preventDefault();
        saveDecompose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeDecomposeModal, decomposeTarget, saveDecompose]);

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

    let nextUrl: string | null = null;
    Array.from(grouped.entries()).forEach(([, items], index) => {
      const invoiceType = resolveSupplierCategory(items[0]);
      const draftId = `${Date.now()}-${Math.floor(Math.random() * 1000)}-${index}`;
      saveDraft({ id: draftId, inventoryIds: items.map((item) => item.id) });
      nextUrl = `/sales/purchase-invoice/${invoiceType}/${draftId}`;
    });
    if (nextUrl) {
      router.push(nextUrl);
    }
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
    const url = `/sales/sales-invoice/${type}/create?${params.toString()}`;
    router.push(url);
    setSalesModalOpen(false);
    setSalesCandidateIds([]);
  };

  const totalPageCount = 1;
  const currentPage = 1;
  const columnHeaderHoverClass = "shadow-[inset_0_-2px_0_rgba(255,255,255,0.7)]";
  const saleDraftParsed = saleModalRecord ? parseNonNegativeInteger(saleDraft) : null;
  const saleValidationMessage = saleError || saleDraftParsed?.error || "";
  const canSaveSale = Boolean(saleModalRecord) && !saleSaving && !saleDraftParsed?.error;
  const decomposeCellParsed = decomposeTarget ? parseNonNegativeInteger(decomposeCellDraft) : null;
  const decomposeFrameParsed = decomposeTarget ? parseNonNegativeInteger(decomposeFrameDraft) : null;
  const decomposeBasePrice = decomposeTarget?.unitPrice ?? 0;
  const decomposeInputsFilled = Boolean(
    decomposeCellParsed?.normalized && decomposeFrameParsed?.normalized,
  );
  const decomposeCurrentSum = (decomposeCellParsed?.parsed ?? 0) + (decomposeFrameParsed?.parsed ?? 0);
  const decomposeSumMatches =
    decomposeInputsFilled &&
    decomposeCurrentSum === decomposeBasePrice;
  const decomposeValidationMessage =
    decomposeError || decomposeCellParsed?.error || decomposeFrameParsed?.error || "";
  const canSaveDecompose =
    Boolean(decomposeTarget) &&
    !decomposeSaving &&
    !decomposeCellParsed?.error &&
    !decomposeFrameParsed?.error &&
    decomposeInputsFilled &&
    decomposeSumMatches;

  return (
    <div className="min-h-screen bg-white py-4">
      <div className="mx-auto max-w-[1800px] px-8">
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
                href="/sales/new"
                className="border border-gray-300 bg-[#f7f3e9] px-3 py-1 text-sm font-semibold text-neutral-700 shadow-[inset_0_1px_0_#fff]"
              >
                在庫を登録
              </Link>
            </div>
          </div>

          <div className="mt-4 border-2 border-gray-300">
            <div className="bg-slate-600 px-3 py-2 text-sm font-bold text-white">検索条件</div>
            <form onSubmit={handleSearchSubmit} className="bg-white">
              <table className="w-full border-collapse text-[12px]">
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
                        <button
                          type="button"
                          onClick={() =>
                            setSearchDraft((prev) => {
                              const next = { ...prev, createdAt: { from: "", to: "" } };
                              setSearchFilters((current) => ({ ...current, createdAt: next.createdAt }));
                              return next;
                            })
                          }
                          className="border border-gray-300 bg-[#f7f3e9] px-2 py-0.5 text-[11px] font-semibold"
                        >
                          クリア
                        </button>
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
                        <button
                          type="button"
                          onClick={() =>
                            setSearchDraft((prev) => {
                              const next = { ...prev, stockInDate: { from: "", to: "" } };
                              setSearchFilters((current) => ({ ...current, stockInDate: next.stockInDate }));
                              return next;
                            })
                          }
                          className="border border-gray-300 bg-[#f7f3e9] px-2 py-0.5 text-[11px] font-semibold"
                        >
                          クリア
                        </button>
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
                      遊技機番号/枠番号
                    </th>
                    <td className="border border-gray-300 px-2 py-1">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col gap-1 text-[11px] text-neutral-700">
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={searchDraft.serialBoard}
                              onChange={(event) =>
                                setSearchDraft((prev) => ({
                                  ...prev,
                                  serialBoard: event.target.checked,
                                }))
                              }
                            />
                            <span>遊技機番号</span>
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={searchDraft.serialFrame}
                              onChange={(event) =>
                                setSearchDraft((prev) => ({
                                  ...prev,
                                  serialFrame: event.target.checked,
                                }))
                              }
                            />
                            <span>枠番号</span>
                          </label>
                        </div>
                        <input
                          value={searchDraft.serialQuery}
                          onChange={(event) =>
                            setSearchDraft((prev) => ({ ...prev, serialQuery: event.target.value }))
                          }
                          placeholder="番号を入力"
                          className="flex-1 border border-[#c98200] bg-[#fff4d6] px-2 py-1 text-xs"
                        />
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
                    <th className="border border-gray-300 bg-[#e8f5e9] px-2 py-1 text-left text-xs font-semibold">
                      保管先倉庫
                    </th>
                    <td className="border border-gray-300 px-2 py-1">
                      <select
                        value={searchDraft.warehouse}
                        onChange={(event) =>
                          setSearchDraft((prev) => ({ ...prev, warehouse: event.target.value }))
                        }
                        className="w-full border border-[#c98200] bg-[#fff4d6] px-2 py-1 text-xs"
                      >
                        <option value="">未選択（全件）</option>
                        {warehouseOptions.map((warehouse) => (
                          <option key={warehouse} value={warehouse}>
                            {warehouse}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <th className="border border-gray-300 bg-[#e8f5e9] px-2 py-1 text-left text-xs font-semibold">
                      販売済みの表示
                    </th>
                    <td className="border border-gray-300 px-2 py-1">
                      <div className="flex items-center gap-3 text-xs">
                        {[
                          { value: "all", label: "すべて" },
                          { value: "only", label: "販売済みのみ" },
                          { value: "exclude", label: "販売済み以外" },
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
                      非表示物件の表示
                    </th>
                    <td className="border border-gray-300 px-2 py-1">
                      <div className="flex items-center gap-3 text-xs">
                        {[
                          { value: "all", label: "すべて" },
                          { value: "only", label: "非表示のみ" },
                          { value: "exclude", label: "非表示以外" },
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
                    <td colSpan={2} className="border border-gray-300 px-2 py-1 text-xs text-neutral-500">
                      ※倉庫や販売済みの表示条件は検索ボタン押下後に反映されます。
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
              </div>
            </form>
          </div>

          <p className="mt-2 text-[11px] text-neutral-600">
            ※販売伝票作成済みの在庫は在庫0相当として扱われ、一覧では薄いグレー表示になります。
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 border border-gray-300 px-2 py-2 text-[11px]">
            <div className="flex flex-wrap items-center gap-2 text-neutral-700">
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
              <button
                type="button"
                onClick={handleSalesCreate}
                disabled={selectedIds.size === 0}
                className="border border-gray-300 bg-[#f7f3e9] px-3 py-1 text-xs font-semibold shadow-[inset_0_1px_0_#fff] disabled:cursor-not-allowed disabled:opacity-40"
              >
                販売
              </button>
                <button
                  type="button"
                  onClick={handleDecomposeInventory}
                  className="border border-gray-300 bg-[#f7f3e9] px-3 py-1 text-xs font-semibold shadow-[inset_0_1px_0_#fff]"
                >
                  分解
                </button>
                <button
                  type="button"
                  onClick={handleBulkToggleVisibility}
                  className="border border-gray-300 bg-[#f7f3e9] px-3 py-1 text-xs font-semibold shadow-[inset_0_1px_0_#fff]"
                >
                  表示変更
                </button>
              </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
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
          <p className="mt-1 text-[11px] text-neutral-600">
            ・項目をドラッグして並び替えすることができます。
          </p>

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
            <div className="mb-1 flex flex-wrap items-center gap-4 text-[11px] text-neutral-700">
              <span className="font-semibold">選択: {selectedIds.size}件</span>
              <span>
                総{filteredRecords.length}件 / {displayRecords.length}件表示 / {currentPage}/{totalPageCount}ページ
              </span>
            </div>
            <table
              className="min-w-full table-fixed border-collapse border-2 border-gray-300 text-[11px]"
              onMouseLeave={() => setHoveredColumnKey(null)}
            >
              <thead className="bg-slate-600 text-left font-semibold text-white">
                <tr>
                  <th className="w-10 border border-gray-300 px-1 py-1" />
                  {visibleColumns.map((col) => (
                    <th
                      key={col.key}
                      draggable
                      onDragStart={() => handleDragStart(String(col.key))}
                      onDragOver={(event) => handleDragOver(event, String(col.key))}
                      onDrop={() => handleDrop(String(col.key))}
                      onMouseEnter={() => setHoveredColumnKey(col.key)}
                      className={`relative select-none border border-gray-300 px-1 py-1 ${
                        hoveredColumnKey === col.key ? columnHeaderHoverClass : ""
                      }`}
                      style={{ width: `${col.width}px`, minWidth: `${col.minWidth}px` }}
                      data-col={col.key}
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
                  <th className="w-[96px] border border-gray-300 px-1 py-1 text-center leading-tight">
                    <span className="block">番号</span>
                    <span className="block">編集</span>
                  </th>
                  <th className="w-[64px] border border-gray-300 px-1 py-1 text-center">購伝票</th>
                  <th className="w-[64px] border border-gray-300 px-1 py-1 text-center">販伝票</th>
                  <th className="w-[56px] border border-gray-300 px-1 py-1 text-center">検通</th>
                  <th className="w-[56px] border border-gray-300 px-1 py-1 text-center">撤明</th>
                  <th className="w-[56px] border border-gray-300 px-1 py-1" />
                </tr>
              </thead>
              <tbody>
                {displayRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumns.length + 7}
                      className="border border-gray-300 px-3 py-6 text-center text-sm text-neutral-600"
                    >
                      登録された在庫がありません。
                    </td>
                  </tr>
                ) : (
                  displayRecords.map((item) => {
                    const isSalesInvoiced = salesInvoiceMap.has(item.id);
                    const isDeletionBlocked = isSalesInvoiced;
                    const kentuuAttachmentId = normalizeAttachmentId(item.attachments?.kentuuAttachmentId);
                    const tekkyoAttachmentId = normalizeAttachmentId(item.attachments?.tekkyoAttachmentId);
                    const isSelected = selectedIds.has(item.id);
                    const baseRowClass = isSalesInvoiced ? "bg-gray-100" : "bg-white";
                    const hoverClass = "group-hover:bg-[#fffbe6]";
                    const rowBgClass = isSelected ? "bg-[#fff2c7]" : baseRowClass;
                    const columnHoverClass = hoverClass.replace("group-hover:", "!");
                    return (
                      <tr key={item.id} className="group border-t border-gray-300 text-[11px]">
                      <td
                        className={`w-10 border border-gray-300 px-1 py-0.5 align-middle ${rowBgClass} ${hoverClass}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => handleSelectRow(item.id)}
                          className="h-4 w-4 border-gray-300"
                        />
                      </td>
                      {visibleColumns.map((col) => {
                        const fullText = getCellText(item, String(col.key));
                        const displayText = col.key === "id" ? formatInventoryShortId(item.id) : fullText;
                        const numeric = NUMERIC_COLUMNS.includes(col.key);
                        const isDate = DATE_COLUMNS.includes(col.key);
                        const shouldWrap = WRAP_COLUMNS.includes(col.key);
                        const isColumnHovered = hoveredColumnKey === col.key;

                        return (
                          <td
                            key={col.key}
                            className={`border border-gray-300 px-1 py-0.5 align-middle text-neutral-800 ${rowBgClass} ${hoverClass} ${
                              numeric ? "text-right" : ""
                            } ${isDate || numeric ? "whitespace-nowrap" : ""} ${
                              shouldWrap ? "whitespace-normal break-words" : ""
                            } ${isColumnHovered ? columnHoverClass : ""}`}
                            style={{ width: `${col.width}px`, minWidth: `${col.minWidth}px` }}
                            title={col.key === "id" ? item.id : undefined}
                            data-col={col.key}
                            onMouseEnter={() => setHoveredColumnKey(col.key)}
                          >
                            {col.key === "isVisible" ? (
                              <span className="block text-center">{displayText}</span>
                            ) : col.key === "saleUnitPrice" ? (
                              <button
                                type="button"
                                onClick={() => startSaleEdit(item)}
                                className="w-full text-right hover:bg-[#fff4d6]"
                              >
                                {displayText}
                              </button>
                            ) : col.key === "warehouse" ? (
                              <select
                                value={item.warehouse ?? item.storageLocation ?? ""}
                                onChange={(event) => handleWarehouseChange(item.id, event.target.value)}
                                className="w-full border border-gray-300 bg-white px-1 py-0.5 text-xs"
                              >
                                {[
                                  item.warehouse ?? item.storageLocation,
                                  ...warehouseOptions,
                                ]
                                  .filter((warehouse): warehouse is string => Boolean(warehouse))
                                  .filter((warehouse, index, list) => list.indexOf(warehouse) === index)
                                  .map((warehouse) => (
                                    <option key={warehouse} value={warehouse}>
                                      {warehouse}
                                    </option>
                                  ))}
                              </select>
                            ) : (
                              <span className={`block max-w-full ${numeric ? "tabular-nums" : ""}`}>
                                {displayText}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td
                        className={`w-[96px] border border-gray-300 px-1 py-0.5 text-center ${rowBgClass} ${hoverClass}`}
                      >
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => openInventoryDetail(item.id)}
                            className={`block w-full border border-gray-300 px-1 py-1 text-[11px] font-semibold shadow-[inset_0_1px_0_#fff] ${
                              serialCompletionMap[item.id]
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-[#f7f3e9] text-neutral-800"
                            }`}
                          >
                            ＋
                          </button>
                        </div>
                      </td>
                      <td
                        className={`w-[64px] border border-gray-300 px-1 py-0.5 text-center ${rowBgClass} ${hoverClass}`}
                      >
                        {item.purchaseInvoiceId ? (
                          <button
                            type="button"
                            onClick={() => {
                              const invoice = purchaseInvoiceMap.get(item.purchaseInvoiceId ?? "");
                              const invoiceType = invoice?.invoiceType ?? "vendor";
                              const url = `/sales/purchase-invoice/${invoiceType}/${item.purchaseInvoiceId}`;
                              router.push(url);
                            }}
                            className="w-full border border-gray-300 bg-[#fff4d6] px-1 py-1 text-[11px] font-semibold text-emerald-700"
                          >
                            ○
                          </button>
                        ) : (
                          <span className="text-transparent">-</span>
                        )}
                      </td>
                      <td
                        className={`w-[64px] border border-gray-300 px-1 py-0.5 text-center ${rowBgClass} ${hoverClass}`}
                      >
                        {salesInvoiceMap.has(item.id) ? (
                          <button
                            type="button"
                            onClick={() => {
                              const invoice = salesInvoiceMap.get(item.id);
                              if (!invoice) return;
                              const url = `/sales/sales-invoice/${invoice.invoiceType}/${invoice.invoiceId}`;
                              router.push(url);
                            }}
                            className="w-full border border-gray-300 bg-[#fff4d6] px-1 py-1 text-[11px] font-semibold text-emerald-700"
                          >
                            済
                          </button>
                        ) : (
                          <span className="text-transparent">-</span>
                        )}
                      </td>
                      <td
                        className={`w-[56px] border border-gray-300 px-1 py-0.5 text-center ${rowBgClass} ${hoverClass}`}
                      >
                        {kentuuAttachmentId ? (
                          <button
                            type="button"
                            onClick={() => void openAttachmentInNewTab(kentuuAttachmentId)}
                            className="w-full text-center text-[13px] font-semibold text-emerald-700 hover:text-emerald-800"
                          >
                            ●
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openInventoryDetail(item.id)}
                            className="w-full text-center text-[11px] font-semibold text-neutral-500 hover:text-neutral-700"
                          >
                            未
                          </button>
                        )}
                      </td>
                      <td
                        className={`w-[56px] border border-gray-300 px-1 py-0.5 text-center ${rowBgClass} ${hoverClass}`}
                      >
                        {tekkyoAttachmentId ? (
                          <button
                            type="button"
                            onClick={() => void openAttachmentInNewTab(tekkyoAttachmentId)}
                            className="w-full text-center text-[13px] font-semibold text-emerald-700 hover:text-emerald-800"
                          >
                            ●
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openInventoryDetail(item.id)}
                            className="w-full text-center text-[11px] font-semibold text-neutral-500 hover:text-neutral-700"
                          >
                            未
                          </button>
                        )}
                      </td>
                      <td
                        className={`w-[56px] border border-gray-300 px-1 py-0.5 text-center ${rowBgClass} ${hoverClass}`}
                      >
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(item)}
                          disabled={isDeletionBlocked}
                          title={isDeletionBlocked ? "販売伝票作成済みのため削除できません。" : "在庫を削除"}
                          className="border border-gray-300 bg-white px-1 py-1 text-[10px] font-semibold text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-neutral-400"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {saleModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md border-2 border-gray-300 bg-white shadow-lg">
            <div className="bg-slate-600 px-4 py-3 text-sm font-semibold text-white">販売単価を編集</div>
            <div className="space-y-3 px-4 py-4 text-sm text-neutral-800">
              <div className="space-y-1 text-xs text-neutral-600">
                <p>管理ID: {saleModalRecord.id}</p>
                <p>機種名: {saleModalRecord.model ?? saleModalRecord.machineName ?? "-"}</p>
                <p>
                  現在値:{" "}
                  {saleModalRecord.saleUnitPrice == null || saleModalRecord.saleUnitPrice === 0
                    ? "応相談"
                    : `${saleModalRecord.saleUnitPrice.toLocaleString()} 円`}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-700" htmlFor="sale-unit-price-input">
                  販売単価（円）
                </label>
                <input
                  id="sale-unit-price-input"
                  autoFocus
                  inputMode="numeric"
                  value={saleDraft}
                  onChange={(event) => {
                    setSaleDraft(event.target.value);
                    setSaleError("");
                  }}
                  className="w-full rounded border border-[#c98200] bg-[#fff4d6] px-3 py-2 text-right text-2xl font-semibold tracking-wide"
                  placeholder="0"
                  disabled={saleSaving}
                />
                {saleValidationMessage && (
                  <p className="text-xs text-red-600">{saleValidationMessage}</p>
                )}
                <p className="text-[11px] text-neutral-500">Enterで保存 / Escでキャンセル</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-300 px-4 py-3">
              <button
                type="button"
                onClick={closeSaleModal}
                className="border border-gray-300 bg-[#f7f3e9] px-4 py-1 text-sm font-semibold"
                disabled={saleSaving}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={saveSaleEdit}
                disabled={!canSaveSale}
                className="border border-gray-300 bg-[#1E3A8A] px-4 py-1 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {decomposeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border-2 border-gray-300 bg-white shadow-lg">
            <div className="bg-slate-600 px-4 py-3 text-sm font-semibold text-white">分解確認</div>
            <div className="space-y-4 px-4 py-4 text-sm text-neutral-800">
              <div className="grid grid-cols-2 gap-3 text-xs text-neutral-600">
                <div>
                  <p className="font-semibold text-neutral-700">管理ID</p>
                  <p>{decomposeTarget.id}</p>
                </div>
                <div>
                  <p className="font-semibold text-neutral-700">機種名</p>
                  <p>{decomposeTarget.model ?? decomposeTarget.machineName ?? "-"}</p>
                </div>
                <div>
                  <p className="font-semibold text-neutral-700">本体単価</p>
                  <p>{decomposeBasePrice.toLocaleString()} 円</p>
                </div>
                <div>
                  <p className="font-semibold text-neutral-700">仕入数</p>
                  <p>{decomposeTarget.quantity ?? 1}</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-700" htmlFor="decompose-cell-price">
                    セル単価（円）
                  </label>
                  <input
                    id="decompose-cell-price"
                    inputMode="numeric"
                    value={decomposeCellDraft}
                    onChange={(event) => {
                      setDecomposeCellDraft(event.target.value);
                      setDecomposeError("");
                    }}
                    className="w-full rounded border border-[#c98200] bg-[#fff4d6] px-3 py-2 text-right text-xl font-semibold"
                    placeholder="0"
                    disabled={decomposeSaving}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-700" htmlFor="decompose-frame-price">
                    枠単価（円）
                  </label>
                  <input
                    id="decompose-frame-price"
                    inputMode="numeric"
                    value={decomposeFrameDraft}
                    onChange={(event) => {
                      setDecomposeFrameDraft(event.target.value);
                      setDecomposeError("");
                    }}
                    className="w-full rounded border border-[#c98200] bg-[#fff4d6] px-3 py-2 text-right text-xl font-semibold"
                    placeholder="0"
                    disabled={decomposeSaving}
                  />
                </div>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-neutral-600">
                合計: {decomposeCurrentSum.toLocaleString()} 円 / 本体単価: {decomposeBasePrice.toLocaleString()} 円
                {!decomposeSumMatches && decomposeInputsFilled && (
                  <span className="ml-2 text-red-600">合計が一致していません。</span>
                )}
              </div>
              {decomposeValidationMessage && (
                <p className="text-xs text-red-600">{decomposeValidationMessage}</p>
              )}
              <p className="text-[11px] text-neutral-500">Enterで実行 / Escでキャンセル</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-300 px-4 py-3">
              <button
                type="button"
                onClick={closeDecomposeModal}
                className="border border-gray-300 bg-[#f7f3e9] px-4 py-1 text-sm font-semibold"
                disabled={decomposeSaving}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={saveDecompose}
                disabled={!canSaveDecompose}
                className="border border-gray-300 bg-[#1E3A8A] px-4 py-1 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                保存して分解
              </button>
            </div>
          </div>
        </div>
      )}

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
                  const url = `/sales/purchase-invoice/${existingInvoicePrompt.invoiceType}/${existingInvoicePrompt.invoiceId}`;
                  router.push(url);
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
                  const url = `/sales/sales-invoice/${existingSalesInvoicePrompt.invoiceType}/${existingSalesInvoicePrompt.invoiceId}`;
                  router.push(url);
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
