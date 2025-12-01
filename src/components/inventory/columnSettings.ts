export type InventoryColumnId =
  | "status"
  | "category"
  | "maker"
  | "model"
  | "frameColorPanel"
  | "inspectionNumber"
  | "frameSerial"
  | "boardSerial"
  | "removalDate"
  | "usageType"
  | "warehouse"
  | "note"
  | "installDate"
  | "installPeriod"
  | "inspectionDate"
  | "inspectionExpiry"
  | "approvalDate"
  | "approvalExpiry"
  | "purchaseSource"
  | "purchasePriceExTax"
  | "purchasePriceIncTax"
  | "saleDate"
  | "saleDestination"
  | "salePriceExTax"
  | "salePriceIncTax"
  | "externalCompany"
  | "externalStore"
  | "stockInDate"
  | "stockOutDate"
  | "stockOutDestination"
  | "serialNumber"
  | "inspectionInfo"
  | "listingId";

export type InventoryColumnSetting = {
  id: InventoryColumnId;
  label: string;
  visible: boolean;
  width?: number;
};

export type InventorySortKey =
  | "status"
  | "category"
  | "maker"
  | "model"
  | "frameColorPanel"
  | "inspectionNumber"
  | "frameSerial"
  | "boardSerial"
  | "removalDate"
  | "warehouse"
  | "installDate"
  | "inspectionDate"
  | "approvalDate"
  | "purchasePriceExTax"
  | "saleDate"
  | "salePriceExTax";

export const DEFAULT_INVENTORY_COLUMNS: InventoryColumnSetting[] = [
  { id: "category", label: "種別", visible: true, width: 90 },
  { id: "status", label: "状況", visible: true, width: 110 },
  { id: "maker", label: "メーカー", visible: true, width: 120 },
  { id: "model", label: "機種名", visible: true, width: 200 },
  { id: "frameColorPanel", label: "枠色・パネル", visible: true, width: 140 },
  { id: "inspectionNumber", label: "遊技盤番号", visible: true, width: 130 },
  { id: "frameSerial", label: "枠番号", visible: true, width: 120 },
  { id: "boardSerial", label: "主要基板番号", visible: true, width: 140 },
  { id: "removalDate", label: "撤去日", visible: true, width: 120 },
  { id: "usageType", label: "使用次", visible: true, width: 90 },
  { id: "warehouse", label: "倉庫", visible: true, width: 140 },
  { id: "note", label: "備考", visible: true, width: 180 },
  { id: "installDate", label: "設置日", visible: true, width: 120 },
  { id: "installPeriod", label: "設置期間", visible: true, width: 120 },
  { id: "inspectionDate", label: "検定日", visible: true, width: 120 },
  { id: "inspectionExpiry", label: "検定期限", visible: true, width: 120 },
  { id: "approvalDate", label: "認定日", visible: true, width: 120 },
  { id: "approvalExpiry", label: "認定期限", visible: true, width: 120 },
  { id: "purchaseSource", label: "購入元", visible: true, width: 140 },
  { id: "purchasePriceExTax", label: "購入金額（税抜）", visible: true, width: 150 },
  { id: "purchasePriceIncTax", label: "購入金額（税込）", visible: true, width: 150 },
  { id: "saleDate", label: "売却日", visible: true, width: 120 },
  { id: "saleDestination", label: "売却先", visible: true, width: 160 },
  { id: "salePriceExTax", label: "売却金額（税抜）", visible: true, width: 160 },
  { id: "salePriceIncTax", label: "売却金額（税込）", visible: true, width: 160 },
  { id: "externalCompany", label: "外れ法人", visible: true, width: 140 },
  { id: "externalStore", label: "外れ店", visible: true, width: 140 },
  { id: "stockInDate", label: "入庫日", visible: true, width: 120 },
  { id: "stockOutDate", label: "出庫日", visible: true, width: 120 },
  { id: "stockOutDestination", label: "出庫先", visible: true, width: 140 },
  { id: "serialNumber", label: "シリアル番号", visible: true, width: 150 },
  { id: "inspectionInfo", label: "検査情報", visible: true, width: 180 },
  { id: "listingId", label: "出品ID", visible: true, width: 150 },
];
