import {
  loadAllInventory,
  saveAllInventory,
  type StoredInventoryItem,
} from "@/lib/inventory/storage";
import type { InventoryStatusOption, SimpleInventory } from "@/types/purchaseInvoices";

const normalizeStatus = (status?: StoredInventoryItem["status"]): InventoryStatusOption => {
  if (status === "出品中") return "出品中";
  if (status === "売却済") return "売却済";
  return "倉庫";
};

const resolveCreatedAt = (item: StoredInventoryItem): string => {
  if (item.createdAt) return item.createdAt;
  if (item.stockInDate) return item.stockInDate;
  if (item.installDate) return item.installDate;
  if (item.removalDate) return item.removalDate;
  if (typeof item.id === "number") return new Date(item.id).toISOString();
  return new Date().toISOString();
};

const toSimpleInventory = (item: StoredInventoryItem): SimpleInventory => {
  const unitPrice =
    typeof item.purchasePriceExTax === "number"
      ? item.purchasePriceExTax
      : typeof item.salePriceExTax === "number"
        ? item.salePriceExTax
        : undefined;

  const quantity = (item as { quantity?: number }).quantity ?? 1;
  const supplier = item.purchaseSource || item.externalCompany || item.saleDestination || item.warehouse;

  return {
    id: String(item.id ?? crypto.randomUUID()),
    createdAt: resolveCreatedAt(item),
    maker: item.manufacturer,
    machineName: item.modelName,
    type: item.category,
    quantity,
    unitPrice,
    supplier,
    status: normalizeStatus(item.status),
  };
};

export const loadSimpleInventory = (): SimpleInventory[] => {
  const raw = loadAllInventory();
  return raw.map((item) => toSimpleInventory(item));
};

export const updateInventoryStatus = (
  id: string,
  status: InventoryStatusOption,
): void => {
  const items = loadAllInventory();
  const updated = items.map((item) => {
    if (String(item.id) === id) {
      return { ...item, status };
    }
    return item;
  });

  saveAllInventory(updated);
};
