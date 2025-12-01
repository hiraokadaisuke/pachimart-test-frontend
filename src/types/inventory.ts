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
  usageCount?: number;
  note?: string;
  installDate?: string;
  installPeriod?: string;
  inspectionDate?: string;
  inspectionExpiry?: string;
  approvalDate?: string;
  approvalExpiry?: string;
  purchaseSource?: string;
  purchasePriceExTax?: number;
  purchasePriceIncTax?: number;
  saleDestination?: string;
  salePriceExTax?: number;
  salePriceIncTax?: number;
  externalCompany?: string;
  externalStore?: string;
  stockInDate?: string;
  scanDate?: string;
  scanStaff?: string;
  storageFeeCalc?: string;
  glassCylinder?: string;
  pachimartSalePrice?: number;
  nailSheet?: string;
  pachimartStatus?: string;
  hasDocuments?: boolean;
}

export type InventoryDocumentKind =
  | "kentei_notice"
  | "tekkyo_meisai"
  | "chuko_kakunin";

export const INVENTORY_DOCUMENT_LABELS: Record<InventoryDocumentKind, string> = {
  kentei_notice: "検定通知書",
  tekkyo_meisai: "撤去明細書",
  chuko_kakunin: "中古遊技機確認書",
};

export interface InventoryDocumentMeta {
  kind: InventoryDocumentKind;
  fileName: string;
  size: number;
  uploadedAt: string;
  objectUrl: string;
}
