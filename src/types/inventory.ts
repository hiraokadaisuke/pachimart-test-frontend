export type InventoryStatus = "在庫中" | "出品中" | "成功済み";
export type InventoryCategory = "パチンコ" | "パチスロ";

export interface InventoryItem {
  id: number;
  status: InventoryStatus;
  category: InventoryCategory;
  manufacturer: string;
  modelName: string;
  colorPanel: string;
  inspectionNumber: string;
  frameSerial: string;
  boardSerial: string;
  removalDate: string | null;
  warehouse: string;
  salePrice?: number;
  saleDate?: string;
  buyer?: string;
}
