import type { InventoryStatusOption } from "@/types/purchaseInvoices";

export type InventoryRecord = {
  id: string;
  createdAt: string;
  status: InventoryStatusOption;
  stockStatus?: InventoryStatusOption;
  maker?: string;
  model?: string;
  machineName?: string;
  kind?: "P" | "S";
  type?: "本体" | "枠" | "セル" | string;
  deviceType?: string;
  quantity?: number;
  unitPrice?: number;
  remainingDebt?: number;
  stockInDate?: string;
  arrivalDate?: string;
  removeDate?: string;
  removalDate?: string;
  pattern?: string;
  warehouse?: string;
  storageLocation?: string;
  supplier?: string;
  staff?: string;
  buyerStaff?: string;
  note?: string;
  notes?: string;
  consignment?: boolean;
  customFields?: Record<string, string>;
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

const safeParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error("Failed to parse localStorage data", error);
    return null;
  }
};

const normalizeInventory = (record: InventoryRecord): InventoryRecord => {
  const status = record.status ?? record.stockStatus ?? "倉庫";
  return {
    ...record,
    status,
    stockStatus: status,
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
    return stored.map(normalizeInventory);
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

export const updateInventoryStatus = (id: string, status: InventoryStatusOption): InventoryRecord[] => {
  const current = loadInventoryRecords();
  const updated = current.map((item) => (item.id === id ? { ...item, status, stockStatus: status } : item));
  saveInventoryRecords(updated);
  return updated;
};

export const resetInventoryRecords = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(INVENTORY_KEY);
};

export const generateInventoryId = (): string => `INV-${Date.now()}`;

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
