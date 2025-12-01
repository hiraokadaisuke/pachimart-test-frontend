export type InventoryStatus = "設置中" | "倉庫" | "出品中" | "売却済" | "廃棄";
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
  usageType?: "一次" | "二次";
  note?: string;
  installDate?: string | null;
  inspectionDate?: string | null;
  approvalDate?: string | null;
  purchaseSource?: string;
  purchasePriceExTax?: number;
  purchasePriceIncTax?: number;
  saleDestination?: string;
  salePriceExTax?: number;
  salePriceIncTax?: number;
  saleDate?: string | null;
  salePrice?: number;
  buyer?: string;
  externalCompany?: string;
  externalStore?: string;
  stockInDate?: string | null;
  stockOutDate?: string | null;
  stockOutDestination?: string;
  serialNumber?: string;
  inspectionInfo?: string;
  listingId?: string;
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
