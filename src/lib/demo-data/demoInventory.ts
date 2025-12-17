import type { InventoryStatusOption } from "@/types/purchaseInvoices";

export type InventoryRecord = {
  id: string;
  createdAt: string;
  maker: string;
  machineName: string;
  type: string;
  deviceType?: string;
  quantity: number;
  unitPrice: number;
  remainingDebt?: number;
  arrivalDate?: string;
  removalDate?: string;
  pattern?: string;
  storageLocation?: string;
  supplier?: string;
  buyerStaff?: string;
  notes?: string;
  consignment?: boolean;
  stockStatus: InventoryStatusOption;
  purchaseInvoiceId?: string;
  customFields?: Record<string, string>;
};

export type ColumnSetting = {
  key: string;
  label: string;
  visible: boolean;
  order: number;
  isCustom?: boolean;
};

export type InvoiceDraft = {
  id: string;
  inventoryIds: string[];
};

const INVENTORY_KEY = "demo_inventory_records_v2";
const COLUMN_KEY = "demo_inventory_columns_v1";
const DRAFT_KEY = "demo_invoice_drafts_v1";

const SAMPLE_INVENTORY: InventoryRecord[] = [
  {
    id: "INV-1001",
    createdAt: new Date().toISOString(),
    maker: "三洋",
    machineName: "大海物語5",
    type: "P本体",
    deviceType: "ミドル",
    quantity: 2,
    unitPrice: 320000,
    remainingDebt: 80000,
    arrivalDate: "2024-06-12",
    removalDate: "2024-12-20",
    pattern: "ブルーパネル",
    storageLocation: "東京第1倉庫",
    supplier: "サンプル商事",
    buyerStaff: "山田",
    stockStatus: "倉庫",
    notes: "付属品一式",
  },
  {
    id: "INV-1002",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    maker: "ユニバーサル",
    machineName: "バジリスク絆3",
    type: "S本体",
    deviceType: "スマスロ",
    quantity: 1,
    unitPrice: 450000,
    arrivalDate: "2024-07-01",
    pattern: "レッドパネル",
    storageLocation: "埼玉倉庫",
    supplier: "ユニ商会",
    buyerStaff: "佐藤",
    stockStatus: "出品中",
  },
  {
    id: "INV-1003",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    maker: "SANKYO",
    machineName: "ガンダムSEED",
    type: "P本体",
    deviceType: "ライトミドル",
    quantity: 3,
    unitPrice: 280000,
    remainingDebt: 0,
    arrivalDate: "2024-05-22",
    removalDate: "2024-10-05",
    pattern: "ブラック×ネイビー",
    storageLocation: "大阪倉庫",
    supplier: "大阪商事",
    buyerStaff: "田中",
    stockStatus: "売却済",
    notes: "中古良品",
  },
];

const DEFAULT_COLUMNS: ColumnSetting[] = [
  { key: "id", label: "在庫ID", visible: true, order: 0 },
  { key: "createdAt", label: "在庫入力日", visible: true, order: 1 },
  { key: "maker", label: "メーカー名", visible: true, order: 2 },
  { key: "machineName", label: "機種名", visible: true, order: 3 },
  { key: "type", label: "種別", visible: true, order: 4 },
  { key: "deviceType", label: "タイプ", visible: true, order: 5 },
  { key: "quantity", label: "仕入数", visible: true, order: 6 },
  { key: "unitPrice", label: "仕入単価", visible: true, order: 7 },
  { key: "remainingDebt", label: "残債", visible: true, order: 8 },
  { key: "dates", label: "入庫日 / 撤去日", visible: true, order: 9 },
  { key: "pattern", label: "柄", visible: true, order: 10 },
  { key: "storageLocation", label: "保管先", visible: true, order: 11 },
  { key: "supplier", label: "仕入先", visible: true, order: 12 },
  { key: "buyerStaff", label: "仕入担当", visible: true, order: 13 },
  { key: "stockStatus", label: "状況", visible: true, order: 14 },
  { key: "notes", label: "備考", visible: true, order: 15 },
];

const readLocalStorage = <T,>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Failed to parse localStorage for ${key}`, error);
    return null;
  }
};

const writeLocalStorage = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const loadInventoryRecords = (): InventoryRecord[] => {
  const stored = readLocalStorage<InventoryRecord[]>(INVENTORY_KEY);
  if (stored && Array.isArray(stored)) return stored;
  writeLocalStorage(INVENTORY_KEY, SAMPLE_INVENTORY);
  return SAMPLE_INVENTORY;
};

export const saveInventoryRecords = (records: InventoryRecord[]): void => {
  writeLocalStorage(INVENTORY_KEY, records);
};

export const addInventoryRecords = (records: InventoryRecord[]): InventoryRecord[] => {
  const current = loadInventoryRecords();
  const updated = [...current, ...records];
  saveInventoryRecords(updated);
  return updated;
};

export const updateInventoryStatus = (id: string, status: InventoryStatusOption): InventoryRecord[] => {
  const current = loadInventoryRecords();
  const updated = current.map((item) => (item.id === id ? { ...item, stockStatus: status } : item));
  saveInventoryRecords(updated);
  return updated;
};

export const markInventoriesWithInvoice = (inventoryIds: string[], invoiceId: string): InventoryRecord[] => {
  const current = loadInventoryRecords();
  const updated = current.map((item) =>
    inventoryIds.includes(item.id)
      ? {
          ...item,
          purchaseInvoiceId: invoiceId,
        }
      : item,
  );
  saveInventoryRecords(updated);
  return updated;
};

export const loadColumnSettings = (): ColumnSetting[] => {
  const stored = readLocalStorage<ColumnSetting[]>(COLUMN_KEY);
  if (stored && Array.isArray(stored) && stored.length > 0) return stored;
  writeLocalStorage(COLUMN_KEY, DEFAULT_COLUMNS);
  return DEFAULT_COLUMNS;
};

export const saveColumnSettings = (settings: ColumnSetting[]): void => {
  writeLocalStorage(COLUMN_KEY, settings);
};

export const loadDraftById = (draftId: string): InvoiceDraft | null => {
  const drafts = readLocalStorage<Record<string, InvoiceDraft>>(DRAFT_KEY) ?? {};
  return drafts[draftId] ?? null;
};

export const saveDraft = (draft: InvoiceDraft): void => {
  const drafts = readLocalStorage<Record<string, InvoiceDraft>>(DRAFT_KEY) ?? {};
  drafts[draft.id] = draft;
  writeLocalStorage(DRAFT_KEY, drafts);
};

export const deleteDraft = (draftId: string): void => {
  const drafts = readLocalStorage<Record<string, InvoiceDraft>>(DRAFT_KEY) ?? {};
  delete drafts[draftId];
  writeLocalStorage(DRAFT_KEY, drafts);
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
