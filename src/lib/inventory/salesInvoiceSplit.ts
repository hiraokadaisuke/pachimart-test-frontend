import {
  generateInventoryId,
  loadInventoryRecords,
  saveInventoryRecords,
  type InventoryRecord,
} from "@/lib/demo-data/demoInventory";
import {
  clearSerialDraft,
  saveSerialInput,
  saveSerialRows,
  type SerialInputRow,
} from "@/lib/serialInputStorage";

export type SalesSplitRow = {
  inventoryId?: string;
  quantity: number;
  maxQuantity?: number;
  selectedSerialIndexes?: number[];
  serialRows?: SerialInputRow[];
};

export type SalesSplitResult = {
  inventoryIdMap: Map<string, string>;
  soldInventoryIds: string[];
};

export const splitInventoryForSales = (rows: SalesSplitRow[]): SalesSplitResult => {
  const inventoryIdMap = new Map<string, string>();
  const soldInventoryIds: string[] = [];
  const current = loadInventoryRecords();
  const inventoryMap = new Map(current.map((record) => [record.id, record]));
  const newInventories: InventoryRecord[] = [];
  const now = new Date().toISOString();

  rows.forEach((row) => {
    if (!row.inventoryId) return;
    const saleQuantity = Number(row.quantity) || 0;
    if (saleQuantity <= 0) return;
    const target = inventoryMap.get(row.inventoryId);
    if (!target) return;

    const baseQuantity = Number(row.maxQuantity ?? target.quantity ?? saleQuantity);
    if (saleQuantity >= baseQuantity) {
      soldInventoryIds.push(row.inventoryId);
      return;
    }

    const selectedIndexes = row.selectedSerialIndexes ?? [];
    const selectedSet = new Set(selectedIndexes);
    const allRows = row.serialRows ?? [];
    const remainingRows = allRows.filter((_, index) => !selectedSet.has(index));
    const movedRows = allRows.filter((_, index) => selectedSet.has(index));
    const nextRows = remainingRows.map((serialRow, index) => ({ ...serialRow, p: index + 1 }));
    const newRows = movedRows.map((serialRow, index) => ({ ...serialRow, p: index + 1 }));
    const newInventoryId = generateInventoryId();

    inventoryIdMap.set(row.inventoryId, newInventoryId);
    soldInventoryIds.push(newInventoryId);

    inventoryMap.set(row.inventoryId, {
      ...target,
      quantity: baseQuantity - saleQuantity,
    });

    newInventories.push({
      ...target,
      id: newInventoryId,
      createdAt: now,
      quantity: 0,
      status: "売却済",
      stockStatus: "売却済",
      listingStatus: "sold",
    });

    if (allRows.length > 0) {
      saveSerialInput({
        inventoryId: row.inventoryId,
        units: nextRows.length,
        rows: nextRows,
        updatedAt: now,
      });
      saveSerialInput({
        inventoryId: newInventoryId,
        units: newRows.length,
        rows: newRows,
        updatedAt: now,
      });
      void saveSerialRows(row.inventoryId, nextRows);
      void saveSerialRows(newInventoryId, newRows);
      clearSerialDraft(row.inventoryId);
      clearSerialDraft(newInventoryId);
    }
  });

  if (newInventories.length > 0) {
    const updated = [...inventoryMap.values(), ...newInventories];
    saveInventoryRecords(updated);
  }

  return { inventoryIdMap, soldInventoryIds };
};
