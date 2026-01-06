import type { InventoryStatusOption } from "@/types/purchaseInvoices";

export type ListingStatusOption = "listing" | "sold" | "not_listing";

export type InventoryRecord = {
  id: string;
  createdAt: string;
  status: InventoryStatusOption;
  stockStatus?: InventoryStatusOption;
  isVisible?: boolean;
  listingStatus?: ListingStatusOption;
  hasRemainingDebt?: boolean;
  taxType?: "inclusive" | "exclusive";
  isConsignment?: boolean;
  purchaseInvoiceId?: string;
  maker?: string;
  model?: string;
  machineName?: string;
  kind?: "P" | "S";
  type?: "本体" | "枠" | "セル" | string;
  deviceType?: string;
  quantity?: number;
  unitPrice?: number;
  saleUnitPrice?: number;
  remainingDebt?: number;
  stockInDate?: string;
  arrivalDate?: string;
  removeDate?: string;
  removalDate?: string;
  pattern?: string;
  warehouse?: string;
  storageLocation?: string;
  supplier?: string;
  supplierCategory?: "vendor" | "hall";
  supplierCorporate?: string;
  supplierBranch?: string;
  supplierPostalCode?: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierFax?: string;
  staff?: string;
  buyerStaff?: string;
  note?: string;
  notes?: string;
  consignment?: boolean;
  customFields?: Record<string, string>;
  isPickupAvailable?: boolean;
  hasNailSheet?: boolean;
  hasManual?: boolean;
  isShippingTwoPackages?: boolean;
  isHandlingFeeTwoPackages?: boolean;
  isSeparateSaleProhibited?: boolean;
};

export type ColumnSetting = {
  key: string;
  label: string;
  width: number;
  minWidth: number;
  visible?: boolean;
  order?: number;
  isCustom?: boolean;
};

const INVENTORY_KEY = "pachimart_demo_inventory_v1";
const DRAFT_KEY = "pachimart_demo_invoice_drafts_v1";

type InvoiceDraft = {
  id: string;
  inventoryIds: string[];
};

const safeParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error("Failed to parse localStorage data", error);
    return null;
  }
};

const mapStatusToListingStatus = (status?: InventoryStatusOption): ListingStatusOption => {
  if (status === "売却済") return "sold";
  if (status === "出品中") return "listing";
  return "not_listing";
};

const mapListingStatusToStockStatus = (status: ListingStatusOption): InventoryStatusOption => {
  if (status === "sold") return "売却済";
  if (status === "listing") return "出品中";
  return "倉庫";
};

const normalizeInventory = (record: InventoryRecord): InventoryRecord => {
  const fallbackStatus = record.status ?? record.stockStatus ?? "倉庫";
  const listingStatus = record.listingStatus ?? mapStatusToListingStatus(fallbackStatus);
  const stockStatus = mapListingStatusToStockStatus(listingStatus);
  return {
    ...record,
    status: stockStatus,
    stockStatus,
    listingStatus,
    isVisible: record.isVisible ?? true,
    hasRemainingDebt: record.hasRemainingDebt ?? false,
    taxType: record.taxType ?? "exclusive",
    isConsignment: record.isConsignment ?? record.consignment ?? false,
    isPickupAvailable: record.isPickupAvailable ?? false,
    hasNailSheet: record.hasNailSheet ?? false,
    hasManual: record.hasManual ?? false,
    isShippingTwoPackages: record.isShippingTwoPackages ?? false,
    isHandlingFeeTwoPackages: record.isHandlingFeeTwoPackages ?? false,
    isSeparateSaleProhibited: record.isSeparateSaleProhibited ?? false,
  };
};

const readLocalStorage = <T,>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  return safeParse<T>(raw);
};

const writeLocalStorage = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const loadInventoryRecords = (): InventoryRecord[] => {
  const stored = readLocalStorage<InventoryRecord[]>(INVENTORY_KEY);
  if (stored && Array.isArray(stored)) {
    const uniqueMap = new Map<string, InventoryRecord>();
    stored.forEach((record) => {
      uniqueMap.set(record.id, record);
    });
    const deduped = Array.from(uniqueMap.values()).map(normalizeInventory);
    if (deduped.length !== stored.length) {
      writeLocalStorage(INVENTORY_KEY, deduped);
    }
    return deduped;
  }
  return [];
};

export const saveInventoryRecords = (records: InventoryRecord[]): void => {
  writeLocalStorage(
    INVENTORY_KEY,
    records.map((record) => normalizeInventory(record)),
  );
};

export const addInventoryRecords = (records: InventoryRecord[]): InventoryRecord[] => {
  const current = loadInventoryRecords();
  const updated = [...current, ...records.map(normalizeInventory)];
  saveInventoryRecords(updated);
  return updated;
};

export const updateInventoryStatus = (id: string, status: ListingStatusOption): InventoryRecord[] => {
  const current = loadInventoryRecords();
  const stockStatus = mapListingStatusToStockStatus(status);
  const updated = current.map((item) =>
    item.id === id ? { ...item, listingStatus: status, status: stockStatus, stockStatus } : item,
  );
  saveInventoryRecords(updated);
  return updated;
};

export const updateInventoryStatuses = (ids: string[], status: ListingStatusOption): InventoryRecord[] => {
  const current = loadInventoryRecords();
  const targets = new Set(ids);
  const stockStatus = mapListingStatusToStockStatus(status);
  const updated = current.map((item) =>
    targets.has(item.id) ? { ...item, listingStatus: status, status: stockStatus, stockStatus } : item,
  );
  saveInventoryRecords(updated);
  return updated;
};

export const updateInventoryRecord = (id: string, payload: Partial<InventoryRecord>): InventoryRecord[] => {
  const current = loadInventoryRecords();
  const updated = current.map((item) => (item.id === id ? normalizeInventory({ ...item, ...payload }) : item));
  saveInventoryRecords(updated);
  return updated;
};

const loadDrafts = (): InvoiceDraft[] => {
  const stored = readLocalStorage<InvoiceDraft[]>(DRAFT_KEY);
  if (stored && Array.isArray(stored)) return stored;
  return [];
};

const saveDrafts = (drafts: InvoiceDraft[]) => {
  writeLocalStorage(DRAFT_KEY, drafts);
};

export const saveDraft = (draft: InvoiceDraft): InvoiceDraft[] => {
  const drafts = loadDrafts();
  const filtered = drafts.filter((item) => item.id !== draft.id);
  const updated = [...filtered, draft];
  saveDrafts(updated);
  return updated;
};

export const loadDraftById = (id: string): InvoiceDraft | null => {
  const drafts = loadDrafts();
  return drafts.find((draft) => draft.id === id) ?? null;
};

export const deleteDraft = (id: string): InvoiceDraft[] => {
  const drafts = loadDrafts();
  const updated = drafts.filter((draft) => draft.id !== id);
  saveDrafts(updated);
  return updated;
};

export const markInventoriesWithInvoice = (ids: string[], invoiceId: string): InventoryRecord[] => {
  const current = loadInventoryRecords();
  const updated = current.map((item) =>
    ids.includes(item.id) ? { ...item, purchaseInvoiceId: invoiceId } : item,
  );
  saveInventoryRecords(updated);
  return updated;
};

export const resetInventoryRecords = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(INVENTORY_KEY);
};

const generateUniqueSuffix = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

export const generateInventoryId = (): string => `INV-${generateUniqueSuffix()}`;

export const formatCurrency = (value?: number): string => {
  if (value == null || Number.isNaN(value)) return "-";
  return value.toLocaleString("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  });
};

export const formatDate = (value?: string): string => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("ja-JP");
};
