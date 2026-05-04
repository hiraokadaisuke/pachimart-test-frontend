export type InventoryStatus = "在庫" | "商談中" | "発送予定" | "売却済";
export type ListingStatus = "未出品" | "出品中" | "成約済";

export type InventoryItem = {
  id: string;
  type: "パチンコ" | "パチスロ";
  manufacturer: string;
  modelName: string;
  frameColor: string;
  quantity: number;
  storageLocation: string;
  purchasePrice: number;
  plannedSalePrice: number;
  status: InventoryStatus;
  listingStatus: ListingStatus;
  notes: string;
};

export type InboundSchedule = {
  id: string;
  expectedDate: string;
  supplier: string;
  type: "パチンコ" | "パチスロ";
  manufacturer: string;
  modelName: string;
  quantity: number;
  destination: string;
  status: "未入庫" | "入庫待ち" | "一部入庫";
};

export type OutboundSchedule = {
  id: string;
  expectedDate: string;
  buyer: string;
  type: "パチンコ" | "パチスロ";
  manufacturer: string;
  modelName: string;
  quantity: number;
  origin: string;
  shippingMethod: "元払い" | "着払い";
  status: "発送準備中" | "未発送" | "発送済";
};

export type InventoryActivity = {
  date: string;
  category: "入庫" | "出品" | "発送" | "商談" | "購入";
  modelName: string;
  quantity: number;
  location: string;
  status: string;
};
