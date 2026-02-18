import type {
  InventoryCategory,
  InventoryStatus,
  ListingStatus,
} from "@/types/inventory";

export interface StoredInventoryItem {
  id: number;
  status: InventoryStatus;
  listingStatus?: ListingStatus;
  createdAt?: string;
  category: InventoryCategory;
  manufacturer: string;
  modelName: string;
  colorPanel: string;
  inspectionNumber: string;
  frameSerial: string;
  boardSerial: string;
  removalDate: string | null;
  usageType?: "一次" | "二次";
  warehouse: string;
  note?: string;
  installDate?: string | null;
  inspectionDate?: string | null;
  approvalDate?: string | null;
  purchaseSource?: string;
  purchaseRepresentative?: string;
  taxCategory?: string;
  isConsignment?: boolean;
  purchasePriceExTax?: number;
  purchasePriceIncTax?: number;
  saleDate?: string | null;
  saleDestination?: string;
  salePriceExTax?: number;
  salePriceIncTax?: number;
  externalCompany?: string;
  externalStore?: string;
  stockInDate?: string | null;
  stockOutDate?: string | null;
  stockOutDestination?: string;
  serialNumber?: string;
  inspectionInfo?: string;
  listingId?: string;
  hasDocuments?: boolean;
  attachments?: {
    kentuuAttachmentId?: string;
    tekkyoAttachmentId?: string;
    kakuninshoAttachmentId?: string;
  };
  quantity?: number;
  unitPrice?: number;
  supplier?: string;
}

const STORAGE_KEY = "inventory_items_v1";

export function loadAllInventory(): StoredInventoryItem[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as StoredInventoryItem[];
    }
    return [];
  } catch (error) {
    console.error("Failed to parse inventory from localStorage", error);
    return [];
  }
}

export function saveAllInventory(items: StoredInventoryItem[]): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addInventoryItems(
  newItems: StoredInventoryItem[],
): StoredInventoryItem[] {
  const currentItems = loadAllInventory();
  const updated = [...currentItems, ...newItems];
  saveAllInventory(updated);
  return updated;
}
