import type { InboundSchedule, InventoryMovement, OutboundSchedule, PurchaseRecord, SalesRecord } from "@prisma/client";

export type InventoryActivity = {
  id: string;
  occurredAt: Date;
  type:
    | "INBOUND_SCHEDULE_CREATED"
    | "OUTBOUND_SCHEDULE_CREATED"
    | "INBOUND_COMPLETED"
    | "OUTBOUND_COMPLETED"
    | "INBOUND_COMPLETION_CANCELED"
    | "OUTBOUND_COMPLETION_CANCELED"
    | "MANUAL_ADJUSTMENT"
    | "SCHEDULE_CANCELED"
    | "PURCHASE_RECORDED"
    | "SALES_RECORDED";
  title: string;
  description: string;
  badgeLabel: string;
  href: string;
  quantityDelta?: number;
  sourceLabel?: string;
  relatedItemName?: string;
};

export const INVENTORY_ACTIVITY_TYPE_FILTERS = [
  { value: "ALL", label: "全て" },
  { value: "INBOUND_SCHEDULE_CREATED", label: "入庫予定" },
  { value: "OUTBOUND_SCHEDULE_CREATED", label: "発送予定" },
  { value: "INBOUND_COMPLETED", label: "入庫完了" },
  { value: "OUTBOUND_COMPLETED", label: "発送完了" },
  { value: "CANCELED", label: "取消" },
  { value: "MANUAL_ADJUSTMENT", label: "調整" },
  { value: "PURCHASE_RECORDED", label: "仕入記録" },
  { value: "SALES_RECORDED", label: "売上記録" },
] as const;

export const INVENTORY_ACTIVITY_RANGE_FILTERS = [
  { value: "ALL", label: "全期間", days: null },
  { value: "7D", label: "7日以内", days: 7 },
  { value: "30D", label: "30日以内", days: 30 },
  { value: "90D", label: "90日以内", days: 90 },
] as const;

export type InventoryActivityTypeFilter = (typeof INVENTORY_ACTIVITY_TYPE_FILTERS)[number]["value"];
export type InventoryActivityRangeFilter = (typeof INVENTORY_ACTIVITY_RANGE_FILTERS)[number]["value"];

const CANCELED_ACTIVITY_TYPES: InventoryActivity["type"][] = [
  "INBOUND_COMPLETION_CANCELED",
  "OUTBOUND_COMPLETION_CANCELED",
  "SCHEDULE_CANCELED",
];

type MovementWithItem = InventoryMovement & {
  inventoryItem: {
    id: string;
    modelNameSnapshot: string;
  };
};

type ScheduleWithItem<T> = T & {
  inventoryItem: {
    id: string;
    modelNameSnapshot: string;
  } | null;
};

const resolveModelName = (modelNameSnapshot: string, item: { modelNameSnapshot: string } | null) =>
  item?.modelNameSnapshot ?? modelNameSnapshot;

export const normalizeInventoryMovementToActivity = (movement: MovementWithItem): InventoryActivity | null => {
  const occurredAt = movement.committedAt ?? movement.createdAt;
  const relatedItemName = movement.inventoryItem.modelNameSnapshot;

  if (movement.dedupeKey?.endsWith(":reverse")) {
    if (movement.dedupeKey.startsWith("inbound:")) {
      return {
        id: `movement:${movement.id}`,
        occurredAt,
        type: "INBOUND_COMPLETION_CANCELED",
        title: `入庫完了取消：${relatedItemName} ${movement.quantityDelta > 0 ? `+${movement.quantityDelta}` : movement.quantityDelta}台`,
        description: "入庫完了を取り消して在庫を調整しました。",
        badgeLabel: "入庫完了取消",
        href: `/inventory/items/${movement.inventoryItemId}`,
        quantityDelta: movement.quantityDelta,
        sourceLabel: "InventoryMovement",
        relatedItemName,
      };
    }
    if (movement.dedupeKey.startsWith("outbound:")) {
      return {
        id: `movement:${movement.id}`,
        occurredAt,
        type: "OUTBOUND_COMPLETION_CANCELED",
        title: `発送完了取消：${relatedItemName} ${movement.quantityDelta > 0 ? `+${movement.quantityDelta}` : movement.quantityDelta}台`,
        description: "発送完了を取り消して在庫を調整しました。",
        badgeLabel: "発送完了取消",
        href: `/inventory/items/${movement.inventoryItemId}`,
        quantityDelta: movement.quantityDelta,
        sourceLabel: "InventoryMovement",
        relatedItemName,
      };
    }
  }

  if (movement.movementType === "ADJUSTMENT") {
    return {
      id: `movement:${movement.id}`,
      occurredAt,
      type: "MANUAL_ADJUSTMENT",
      title: `手動調整：${relatedItemName} ${movement.quantityDelta > 0 ? `+${movement.quantityDelta}` : movement.quantityDelta}台`,
      description: "在庫数を手動で調整しました。",
      badgeLabel: "手動調整",
      href: `/inventory/items/${movement.inventoryItemId}`,
      quantityDelta: movement.quantityDelta,
      sourceLabel: "InventoryMovement",
      relatedItemName,
    };
  }

  if (movement.movementType === "INBOUND" && movement.status === "COMMITTED") {
    return {
      id: `movement:${movement.id}`,
      occurredAt,
      type: "INBOUND_COMPLETED",
      title: `入庫完了：${relatedItemName} ${movement.quantityDelta > 0 ? `+${movement.quantityDelta}` : movement.quantityDelta}台`,
      description: "入庫予定が完了し在庫に反映されました。",
      badgeLabel: "入庫完了",
      href: `/inventory/items/${movement.inventoryItemId}`,
      quantityDelta: movement.quantityDelta,
      sourceLabel: "InventoryMovement",
      relatedItemName,
    };
  }

  if (movement.movementType === "OUTBOUND" && movement.status === "COMMITTED") {
    return {
      id: `movement:${movement.id}`,
      occurredAt,
      type: "OUTBOUND_COMPLETED",
      title: `発送完了：${relatedItemName} ${movement.quantityDelta > 0 ? `+${movement.quantityDelta}` : movement.quantityDelta}台`,
      description: "発送予定が完了し在庫に反映されました。",
      badgeLabel: "発送完了",
      href: `/inventory/items/${movement.inventoryItemId}`,
      quantityDelta: movement.quantityDelta,
      sourceLabel: "InventoryMovement",
      relatedItemName,
    };
  }

  return null;
};

export const normalizeInboundScheduleToActivity = (schedule: ScheduleWithItem<InboundSchedule>): InventoryActivity => {
  const relatedItemName = resolveModelName(schedule.modelNameSnapshot, schedule.inventoryItem);
  const isCanceled = schedule.status === "CANCELED";
  const isCompleted = schedule.status === "RECEIVED";

  return {
    id: `inbound:${schedule.id}`,
    occurredAt: isCompleted ? schedule.updatedAt : schedule.createdAt,
    type: isCanceled ? "SCHEDULE_CANCELED" : "INBOUND_SCHEDULE_CREATED",
    title: isCanceled
      ? `予定取消：${relatedItemName} ${schedule.quantity}台`
      : `入庫予定作成：${relatedItemName} ${schedule.quantity}台`,
    description: isCanceled ? "入庫予定が取り消されました。" : "入庫予定を作成しました。",
    badgeLabel: isCanceled ? "予定取消" : "入庫予定作成",
    href: "/inventory/inbound",
    quantityDelta: schedule.quantity,
    sourceLabel: "InboundSchedule",
    relatedItemName,
  };
};

export const normalizeOutboundScheduleToActivity = (schedule: ScheduleWithItem<OutboundSchedule>): InventoryActivity => {
  const relatedItemName = resolveModelName(schedule.modelNameSnapshot, schedule.inventoryItem);
  const isCanceled = schedule.status === "CANCELED";
  const isCompleted = ["SHIPPED", "DELIVERED"].includes(schedule.status);

  return {
    id: `outbound:${schedule.id}`,
    occurredAt: isCompleted ? schedule.updatedAt : schedule.createdAt,
    type: isCanceled ? "SCHEDULE_CANCELED" : "OUTBOUND_SCHEDULE_CREATED",
    title: isCanceled
      ? `予定取消：${relatedItemName} ${schedule.quantity}台`
      : `発送予定作成：${relatedItemName} ${schedule.quantity}台`,
    description: isCanceled ? "発送予定が取り消されました。" : "発送予定を作成しました。",
    badgeLabel: isCanceled ? "予定取消" : "発送予定作成",
    href: "/inventory/outbound",
    quantityDelta: -Math.abs(schedule.quantity),
    sourceLabel: "OutboundSchedule",
    relatedItemName,
  };
};



const normalizePurchaseRecordToActivity = (record: PurchaseRecord): InventoryActivity => ({
  id: `purchase:${record.id}`, occurredAt: record.purchaseDate, type: "PURCHASE_RECORDED",
  title: `仕入記録：${record.quantity}台`, description: "仕入記録を登録しました。", badgeLabel: "仕入", href: `/inventory/items/${record.inventoryItemId}`
});

const normalizeSalesRecordToActivity = (record: SalesRecord): InventoryActivity => ({
  id: `sales:${record.id}`, occurredAt: record.salesDate, type: "SALES_RECORDED",
  title: `売上記録：${record.quantity}台`, description: "売上記録を登録しました。", badgeLabel: "売上", href: `/inventory/items/${record.inventoryItemId}`
});
export const getInventoryActivityFeed = ({
  movements,
  inboundSchedules,
  outboundSchedules,
  purchaseRecords = [],
  salesRecords = [],
  take = 10,
}: {
  movements: MovementWithItem[];
  inboundSchedules: ScheduleWithItem<InboundSchedule>[];
  outboundSchedules: ScheduleWithItem<OutboundSchedule>[];
  purchaseRecords?: PurchaseRecord[];
  salesRecords?: SalesRecord[];
  take?: number;
}) => {
  const movementActivities = movements
    .map(normalizeInventoryMovementToActivity)
    .filter((activity): activity is InventoryActivity => activity !== null);

  const inboundActivities = inboundSchedules.map(normalizeInboundScheduleToActivity);
  const outboundActivities = outboundSchedules.map(normalizeOutboundScheduleToActivity);

  const purchaseActivities = purchaseRecords.map(normalizePurchaseRecordToActivity);
  const salesActivities = salesRecords.map(normalizeSalesRecordToActivity);

  return [...movementActivities, ...inboundActivities, ...outboundActivities, ...purchaseActivities, ...salesActivities]
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, take);
};

export const filterInventoryActivities = ({
  activities,
  typeFilter,
  rangeFilter,
  now = new Date(),
}: {
  activities: InventoryActivity[];
  typeFilter: InventoryActivityTypeFilter;
  rangeFilter: InventoryActivityRangeFilter;
  now?: Date;
}) => {
  const range = INVENTORY_ACTIVITY_RANGE_FILTERS.find((item) => item.value === rangeFilter) ?? INVENTORY_ACTIVITY_RANGE_FILTERS[0];
  const threshold = range.days == null ? null : new Date(now.getTime() - range.days * 24 * 60 * 60 * 1000);

  return activities.filter((activity) => {
    const typeMatched =
      typeFilter === "ALL" ||
      (typeFilter === "CANCELED"
        ? CANCELED_ACTIVITY_TYPES.includes(activity.type)
        : activity.type === typeFilter);
    if (!typeMatched) return false;
    if (!threshold) return true;
    return activity.occurredAt.getTime() >= threshold.getTime();
  });
};
