export type InventoryColumnId =
  | "status"
  | "category"
  | "maker"
  | "model"
  | "frameColorPanel"
  | "gameBoardNumber"
  | "frameSerial"
  | "mainBoardSerial"
  | "removalDate"
  | "usageCount"
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
  | "scanDate"
  | "scanStaff"
  | "storageFeeCalc"
  | "glassCylinder"
  | "pachimartSalePrice"
  | "nailSheet"
  | "pachimartStatus";

export interface InventoryColumnOption {
  id: InventoryColumnId;
  label: string;
  defaultVisible: boolean;
}

export type InventorySortKey =
  | "status"
  | "category"
  | "maker"
  | "model"
  | "frameColorPanel"
  | "gameBoardNumber"
  | "frameSerial"
  | "mainBoardSerial"
  | "removalDate"
  | "warehouse"
  | "salePrice"
  | "saleDate"
  | "saleDestination";

export const ALL_INVENTORY_COLUMN_OPTIONS: InventoryColumnOption[] = [
  { id: "status", label: "状況（設置・倉庫・売却）", defaultVisible: true },
  { id: "category", label: "種別", defaultVisible: true },
  { id: "maker", label: "メーカー", defaultVisible: true },
  { id: "model", label: "機種", defaultVisible: true },
  { id: "frameColorPanel", label: "枠色・パネル", defaultVisible: true },
  { id: "gameBoardNumber", label: "遊技盤番号等", defaultVisible: true },
  { id: "frameSerial", label: "枠番号", defaultVisible: true },
  { id: "mainBoardSerial", label: "主基板番号等", defaultVisible: true },
  { id: "removalDate", label: "撤去日", defaultVisible: true },
  { id: "usageCount", label: "使用次", defaultVisible: false },
  { id: "warehouse", label: "倉庫", defaultVisible: true },
  { id: "note", label: "備考", defaultVisible: false },
  { id: "installDate", label: "設置日", defaultVisible: false },
  { id: "installPeriod", label: "設置期間", defaultVisible: false },
  { id: "inspectionDate", label: "検定日", defaultVisible: false },
  { id: "inspectionExpiry", label: "検定期限", defaultVisible: false },
  { id: "approvalDate", label: "認定日", defaultVisible: false },
  { id: "approvalExpiry", label: "認定期限", defaultVisible: false },
  { id: "purchaseSource", label: "購入元", defaultVisible: false },
  { id: "purchasePriceExTax", label: "購入金額（税抜）", defaultVisible: false },
  { id: "purchasePriceIncTax", label: "購入金額（税込）", defaultVisible: false },
  { id: "saleDate", label: "売却日", defaultVisible: true },
  { id: "saleDestination", label: "売却先", defaultVisible: true },
  { id: "salePriceExTax", label: "売却金額（税抜）", defaultVisible: false },
  { id: "salePriceIncTax", label: "売却金額（税込）", defaultVisible: false },
  { id: "externalCompany", label: "外れ法人", defaultVisible: false },
  { id: "externalStore", label: "外れ店", defaultVisible: false },
  { id: "stockInDate", label: "入庫日", defaultVisible: false },
  { id: "scanDate", label: "読取日", defaultVisible: false },
  { id: "scanStaff", label: "読取担当者", defaultVisible: false },
  { id: "storageFeeCalc", label: "保管料計算", defaultVisible: false },
  { id: "glassCylinder", label: "ガラス・シリンダー", defaultVisible: false },
  { id: "pachimartSalePrice", label: "販売価格", defaultVisible: true },
  { id: "nailSheet", label: "釘シート", defaultVisible: false },
  { id: "pachimartStatus", label: "状態", defaultVisible: false },
];
