import type { InboundSchedule, InventoryMovement, OutboundSchedule } from "@prisma/client";



type PurchaseRecordLike = {
  id: string;
  inventoryItemId: string;
  quantity: number;
  purchaseDate: Date;
  paymentStatus: string;
  createdAt: Date;
  updatedAt: Date;
};

type SalesRecordLike = {
  id: string;
  inventoryItemId: string;
  quantity: number;
  salesDate: Date;
  paymentStatus: string;
  createdAt: Date;
  updatedAt: Date;
};
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
    | "SALES_RECORDED"
    | "PURCHASE_UPDATED"
    | "SALES_UPDATED"
    | "PAYMENT_UPDATED"
    | "PURCHASE_CANCELED"
    | "SALES_CANCELED"
    | "PAYMENT_CANCELED"
    | "INVENTORY_CSV_IMPORTED"
    | "INVENTORY_CSV_IMPORT_FAILED"
    | "INVENTORY_INITIAL_STOCK_CREATED"
    | "INVENTORY_UNIT_CREATED"
    | "INVENTORY_UNIT_UPDATED"
    | "INVENTORY_UNIT_CONFIRMED"
    | "INVENTORY_UNIT_CANCELED"
    | "INVENTORY_UNIT_SCANNED"
    | "INVENTORY_UNIT_LINKED_INBOUND"
    | "INVENTORY_UNIT_LINKED_OUTBOUND"
    | "INVENTORY_UNIT_SCAN_DUPLICATE_WARNING";
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
  { value: "OUTBOUND_SCHEDULE_CREATED", label: "出庫予定" },
  { value: "INBOUND_COMPLETED", label: "入庫完了" },
  { value: "OUTBOUND_COMPLETED", label: "発送完了" },
  { value: "CANCELED", label: "取消" },
  { value: "MANUAL_ADJUSTMENT", label: "調整" },
  { value: "PURCHASE_RECORDED", label: "仕入記録" },
  { value: "SALES_RECORDED", label: "売上記録" },
  { value: "PURCHASE_UPDATED", label: "仕入更新" },
  { value: "SALES_UPDATED", label: "売上更新" },
  { value: "PAYMENT_UPDATED", label: "入出金更新" },
  { value: "PURCHASE_CANCELED", label: "仕入取消" },
  { value: "SALES_CANCELED", label: "売上取消" },
  { value: "PAYMENT_CANCELED", label: "入出金取消" },
  { value: "INVENTORY_CSV_IMPORTED", label: "CSV取込" },
  { value: "INVENTORY_CSV_IMPORT_FAILED", label: "CSV取込失敗" },
  { value: "INVENTORY_INITIAL_STOCK_CREATED", label: "初期在庫作成" },
  { value: "INVENTORY_UNIT_CREATED", label: "個体作成" },
  { value: "INVENTORY_UNIT_UPDATED", label: "個体更新" },
  { value: "INVENTORY_UNIT_CONFIRMED", label: "個体確定" },
  { value: "INVENTORY_UNIT_CANCELED", label: "個体取消" },
  { value: "INVENTORY_UNIT_SCANNED", label: "個体スキャン" },
  { value: "INVENTORY_UNIT_LINKED_INBOUND", label: "個体入庫紐付" },
  { value: "INVENTORY_UNIT_LINKED_OUTBOUND", label: "個体発送紐付" },
  { value: "INVENTORY_UNIT_SCAN_DUPLICATE_WARNING", label: "個体重複警告" },
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
  "PURCHASE_CANCELED",
  "SALES_CANCELED",
  "PAYMENT_CANCELED",
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

  if (movement.dedupeKey?.startsWith("csv-import-") || movement.note === "CSVインポート初期在庫") {
    return {
      id: `movement:${movement.id}`,
      occurredAt,
      type: "INVENTORY_INITIAL_STOCK_CREATED",
      title: `初期在庫作成：${relatedItemName} +${movement.quantityDelta}台`,
      description: "CSVインポートにより初期在庫を作成しました。",
      badgeLabel: "初期在庫",
      href: `/inventory/items/${movement.inventoryItemId}`,
      quantityDelta: movement.quantityDelta,
      sourceLabel: "InventoryMovement",
      relatedItemName,
    };
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
      description: "出庫予定が完了し在庫に反映されました。",
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
      : `出庫予定作成：${relatedItemName} ${schedule.quantity}台`,
    description: isCanceled ? "出庫予定が取り消されました。" : "出庫予定を作成しました。",
    badgeLabel: isCanceled ? "予定取消" : "出庫予定作成",
    href: "/inventory/outbound",
    quantityDelta: -Math.abs(schedule.quantity),
    sourceLabel: "OutboundSchedule",
    relatedItemName,
  };
};



const normalizePurchaseRecordToActivity = (record: PurchaseRecordLike): InventoryActivity => ({
  id: `purchase:${record.id}`, occurredAt: record.purchaseDate, type: record.paymentStatus === "CANCELED" ? "PURCHASE_CANCELED" : (record.updatedAt.getTime() > record.createdAt.getTime() ? "PURCHASE_UPDATED" : "PURCHASE_RECORDED"),
  title: `仕入記録：${record.quantity}台`, description: record.paymentStatus === "CANCELED" ? "仕入記録を取り消しました。" : (record.updatedAt.getTime() > record.createdAt.getTime() ? "仕入記録を更新しました。" : "仕入記録を登録しました。"), badgeLabel: record.paymentStatus === "CANCELED" ? "仕入取消" : "仕入", href: `/inventory/items/${record.inventoryItemId}`
});

const normalizeSalesRecordToActivity = (record: SalesRecordLike): InventoryActivity => ({
  id: `sales:${record.id}`, occurredAt: record.salesDate, type: record.paymentStatus === "CANCELED" ? "SALES_CANCELED" : (record.updatedAt.getTime() > record.createdAt.getTime() ? "SALES_UPDATED" : "SALES_RECORDED"),
  title: `売上記録：${record.quantity}台`, description: record.paymentStatus === "CANCELED" ? "売上記録を取り消しました。" : (record.updatedAt.getTime() > record.createdAt.getTime() ? "売上記録を更新しました。" : "売上記録を登録しました。"), badgeLabel: record.paymentStatus === "CANCELED" ? "売上取消" : "売上", href: `/inventory/items/${record.inventoryItemId}`
});

type InventoryUnitLike = {
  id: string;
  inventoryItemId: string;
  displayCode: string | null;
  status: string;
  inboundScheduleId: string | null;
  outboundScheduleId: string | null;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt: Date | null;
  canceledAt?: Date | null;
};

const normalizeInventoryUnitToActivities = (unit: InventoryUnitLike): InventoryActivity[] => {
  const label = unit.displayCode ?? unit.id.slice(0, 8);
  const base: InventoryActivity[] = [{ id: `unit:${unit.id}:created`, occurredAt: unit.createdAt, type: "INVENTORY_UNIT_CREATED", title: `個体作成：${label}`, description: "個体を登録しました。", badgeLabel: "個体作成", href: `/inventory/items/${unit.inventoryItemId}` }];
  if (unit.updatedAt.getTime() > unit.createdAt.getTime()) base.push({ id: `unit:${unit.id}:updated`, occurredAt: unit.updatedAt, type: "INVENTORY_UNIT_UPDATED", title: `個体更新：${label}`, description: "個体情報を更新しました。", badgeLabel: "個体更新", href: `/inventory/items/${unit.inventoryItemId}` });
  if (unit.confirmedAt) base.push({ id: `unit:${unit.id}:confirmed`, occurredAt: unit.confirmedAt, type: "INVENTORY_UNIT_CONFIRMED", title: `個体確定：${label}`, description: "個体を確定しました。", badgeLabel: "個体確定", href: `/inventory/items/${unit.inventoryItemId}` });
  if (unit.status === "CANCELED") base.push({ id: `unit:${unit.id}:canceled`, occurredAt: unit.canceledAt ?? unit.updatedAt, type: "INVENTORY_UNIT_CANCELED", title: `個体取消：${label}`, description: "個体を取消しました。", badgeLabel: "個体取消", href: `/inventory/items/${unit.inventoryItemId}` });
  if (unit.inboundScheduleId) base.push({ id: `unit:${unit.id}:inbound`, occurredAt: unit.updatedAt, type: "INVENTORY_UNIT_LINKED_INBOUND", title: `個体を入庫予定に紐付：${label}`, description: "入庫予定に個体を紐づけました。", badgeLabel: "入庫紐付", href: `/inventory/items/${unit.inventoryItemId}` });
  if (unit.outboundScheduleId) base.push({ id: `unit:${unit.id}:outbound`, occurredAt: unit.updatedAt, type: "INVENTORY_UNIT_LINKED_OUTBOUND", title: `個体を出庫予定に紐付：${label}`, description: "出庫予定に個体を紐づけました。", badgeLabel: "発送紐付", href: `/inventory/items/${unit.inventoryItemId}` });
  return base;
};
export const getInventoryActivityFeed = ({
  movements,
  inboundSchedules,
  outboundSchedules,
  purchaseRecords = [],
  salesRecords = [],
  take = 10,
  inventoryUnits = [],
}: {
  movements: MovementWithItem[];
  inboundSchedules: ScheduleWithItem<InboundSchedule>[];
  outboundSchedules: ScheduleWithItem<OutboundSchedule>[];
  purchaseRecords?: PurchaseRecordLike[];
  salesRecords?: SalesRecordLike[];
  take?: number;
  inventoryUnits?: InventoryUnitLike[];
}) => {
  const movementActivities = movements
    .map(normalizeInventoryMovementToActivity)
    .filter((activity): activity is InventoryActivity => activity !== null);

  const inboundActivities = inboundSchedules.map(normalizeInboundScheduleToActivity);
  const outboundActivities = outboundSchedules.map(normalizeOutboundScheduleToActivity);

  const purchaseActivities = purchaseRecords.map(normalizePurchaseRecordToActivity);
  const salesActivities = salesRecords.map(normalizeSalesRecordToActivity);
  const inventoryUnitActivities = inventoryUnits.flatMap(normalizeInventoryUnitToActivities);

  return [...movementActivities, ...inboundActivities, ...outboundActivities, ...purchaseActivities, ...salesActivities, ...inventoryUnitActivities]
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
