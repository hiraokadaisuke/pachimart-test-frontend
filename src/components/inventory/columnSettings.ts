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
  | "warehouse"
  | "salePrice"
  | "soldAt"
  | "buyer";

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
  | "salePrice"
  | "soldAt"
  | "buyer";

export const DEFAULT_INVENTORY_COLUMNS: InventoryColumnSetting[] = [
  { id: "status", label: "状況（設置・倉庫・売却）", visible: true, width: 110 },
  { id: "category", label: "種別", visible: true, width: 80 },
  { id: "maker", label: "メーカー", visible: true, width: 100 },
  { id: "model", label: "機種名", visible: true, width: 200 },
  { id: "frameColorPanel", label: "枠色・パネル", visible: true, width: 140 },
  { id: "inspectionNumber", label: "検定番号", visible: true, width: 120 },
  { id: "frameSerial", label: "枠番号", visible: true, width: 120 },
  { id: "boardSerial", label: "主基板番号等", visible: false, width: 120 },
  { id: "removalDate", label: "撤去日", visible: true, width: 120 },
  { id: "warehouse", label: "倉庫", visible: true, width: 140 },
  { id: "salePrice", label: "売却価格", visible: true, width: 120 },
  { id: "soldAt", label: "売却日", visible: true, width: 120 },
  { id: "buyer", label: "売却先", visible: true, width: 160 },
];
