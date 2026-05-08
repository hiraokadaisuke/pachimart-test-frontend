import type {
  InboundStatus,
  InventoryShippingMethod,
  InventoryItemType,
  InventoryListingStatus,
  InventoryMovementStatus,
  InventoryMovementType,
  OutboundStatus,
  InventoryStatus,
} from "@prisma/client";

export const formatCurrency = (value: number | null | undefined) =>
  value == null ? "-" : `¥${value.toLocaleString("ja-JP")}`;

export const formatQuantity = (value: number) => `${value}台`;

export const inventoryItemTypeLabel = (value: InventoryItemType) =>
  value === "PACHINKO" ? "パチンコ" : "パチスロ";

export const inventoryStatusLabel = (value: InventoryStatus) => {
  const map: Record<InventoryStatus, string> = {
    DRAFT: "下書き",
    IN_STOCK: "在庫",
    NEGOTIATING: "商談中",
    RESERVED: "引当済",
    OUTBOUND_SCHEDULED: "出庫予定",
    SOLD: "売却済",
    INSTALLED: "設置済",
    NON_STOCK: "非在庫",
    ARCHIVED: "アーカイブ",
  };
  return map[value];
};

export const inventoryListingStatusLabel = (value: InventoryListingStatus) => {
  const map: Record<InventoryListingStatus, string> = {
    NOT_LISTED: "未出品",
    LISTED: "出品中",
    NEGOTIATING: "商談中",
    CONTRACTED: "成約済",
    SUSPENDED: "停止中",
    CLOSED: "終了",
  };
  return map[value];
};

export const inventoryMovementStatusLabel = (value: InventoryMovementStatus) =>
  value === "PLANNED" ? "予定" : value === "COMMITTED" ? "確定" : "取消";

export const inventoryMovementTypeLabel = (value: InventoryMovementType) => {
  const map: Record<InventoryMovementType, string> = {
    INBOUND: "入庫",
    OUTBOUND: "出庫",
    ADJUSTMENT: "調整",
    TRANSFER: "移動",
  };
  return map[value];
};

export const inboundStatusLabel = (value: InboundStatus) => ({
  PLANNED: "未入庫",
  ARRIVAL_WAITING: "入庫待ち",
  PARTIALLY_RECEIVED: "一部入庫",
  RECEIVED: "入庫済",
  CANCELED: "取消",
})[value];

export const outboundStatusLabel = (value: OutboundStatus) => ({
  PLANNED: "未発送",
  PICKING: "ピッキング中",
  READY_TO_SHIP: "発送準備中",
  SHIPPED: "発送済",
  DELIVERED: "納品済",
  CANCELED: "取消",
})[value];

export const shippingMethodLabel = (value: InventoryShippingMethod) => ({
  PREPAID: "元払い",
  COLLECT: "着払い",
  CHARTER: "チャーター便",
  OTHER: "その他",
})[value];
