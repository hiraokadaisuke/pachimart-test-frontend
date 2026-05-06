import type {
  InboundStatus,
  InventoryShippingMethod,
  InventoryItemType,
  InventoryListingStatus,
  OutboundStatus,
  InventoryOwnershipType,
  InventoryStatus,
  PrismaClient,
  Prisma,
  RecordPaymentStatus,
  PaymentRecordStatus,
} from "@prisma/client";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { DEV_USERS } from "@/lib/dev-user/users";
import { prisma } from "@/lib/server/prisma";
import { resyncInventoryExternalLink } from "@/features/inventory/listing-sync";
import { getInventoryActivityFeed } from "@/features/inventory/activity-feed";
import { filterInventoryActivities } from "@/features/inventory/activity-feed";
import type { InventoryActivityRangeFilter, InventoryActivityTypeFilter } from "@/features/inventory/activity-feed";
import { calculateRealGrossProfit } from "@/features/inventory/real-profit";
import { ensurePurchaseAndPaymentOnInboundComplete, ensureSalesAndPaymentOnOutboundComplete } from "@/features/inventory/auto-records";
import { calculateInventoryProfitRows } from "@/features/inventory/financials";
import { importInventoryCsv, parseInventoryImportRows, validateImportRows } from "@/features/inventory/csv-import";

const DEV_USER_COOKIE_KEY = "dev_user_id";

const resolveCurrentUserId = async () => {
  const store = await cookies();
  const cookieUserId = store.get(DEV_USER_COOKIE_KEY)?.value;
  if (cookieUserId) return cookieUserId;
  return DEV_USERS.A.id;
};

const prismaClient = prisma as PrismaClient;

export async function getInventoryItems() {
  const ownerUserId = await resolveCurrentUserId();
  return prismaClient.inventoryItem.findMany({
    where: { ownerUserId },
    include: { maker: true, machineModel: true, storageLocation: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getInventoryItemById(id: string) {
  const ownerUserId = await resolveCurrentUserId();
  const item = await prismaClient.inventoryItem.findFirst({
    where: { id, ownerUserId },
    include: {
      maker: true,
      machineModel: true,
      storageLocation: true,
      movements: { orderBy: [{ committedAt: "desc" }, { createdAt: "desc" }] },
      purchaseRecords: { orderBy: { purchaseDate: "desc" } },
      salesRecords: { orderBy: { salesDate: "desc" } },
      externalLinks: {
        where: { linkType: "EXHIBIT" },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!item) return null;
  const sourceIds = [...item.purchaseRecords.map((r) => r.id), ...item.salesRecords.map((r) => r.id)];
  const paymentRecords = sourceIds.length ? await prismaClient.paymentRecord.findMany({ where: { ownerUserId, sourceId: { in: sourceIds } }, orderBy: { createdAt: "desc" } }) : [];
  return { ...item, paymentRecords };
}



const PAYMENT_STATUS_MAP: Record<string, RecordPaymentStatus> = {
  未払い: "UNPAID",
  一部支払: "PARTIAL",
  支払済: "PAID",
  取消: "CANCELED",
};
const PAYMENT_RECORD_STATUS_VALUES: PaymentRecordStatus[] = ["PLANNED", "PAID", "CANCELED"];

const parseNonNegativeInt = (raw: FormDataEntryValue | null, field: string) => {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) throw new Error(`${field}は0以上の整数で入力してください。`);
  return value;
};

export async function createPurchaseRecord(formData: FormData) {
  const ownerUserId = await resolveCurrentUserId();
  const inventoryItemId = String(formData.get("inventoryItemId") ?? "").trim();
  const purchaseDate = new Date(String(formData.get("purchaseDate") ?? ""));
  const unitCost = Number(formData.get("unitCost"));
  const quantity = Number(formData.get("quantity"));
  const shippingCost = Number(formData.get("shippingCost") ?? "0") || 0;
  const otherCost = Number(formData.get("otherCost") ?? "0") || 0;
  if (!inventoryItemId || Number.isNaN(purchaseDate.getTime()) || !Number.isInteger(unitCost) || !Number.isInteger(quantity) || quantity < 1) throw new Error("入力内容が不正です。");
  const totalCost = unitCost * quantity + shippingCost + otherCost;
  return prismaClient.purchaseRecord.create({ data: { ownerUserId, inventoryItemId, purchaseDate, unitCost, quantity, shippingCost, otherCost, totalCost, paymentStatus: PAYMENT_STATUS_MAP[String(formData.get("paymentStatus") ?? "")] ?? "UNPAID", memo: String(formData.get("memo") ?? "").trim() || null, dealingId: Number(formData.get("dealingId")) || null, supplierCompanyId: String(formData.get("supplierCompanyId") ?? "").trim() || null } });
}

export async function createSalesRecord(formData: FormData) {
  const ownerUserId = await resolveCurrentUserId();
  const inventoryItemId = String(formData.get("inventoryItemId") ?? "").trim();
  const salesDate = new Date(String(formData.get("salesDate") ?? ""));
  const unitPrice = Number(formData.get("unitPrice"));
  const quantity = Number(formData.get("quantity"));
  const shippingFee = Number(formData.get("shippingFee") ?? "0") || 0;
  const platformFee = Number(formData.get("platformFee") ?? "0") || 0;
  const otherFee = Number(formData.get("otherFee") ?? "0") || 0;
  if (!inventoryItemId || Number.isNaN(salesDate.getTime()) || !Number.isInteger(unitPrice) || !Number.isInteger(quantity) || quantity < 1) throw new Error("入力内容が不正です。");
  const totalSales = unitPrice * quantity;
  return prismaClient.salesRecord.create({ data: { ownerUserId, inventoryItemId, salesDate, unitPrice, quantity, shippingFee, platformFee, otherFee, totalSales, paymentStatus: PAYMENT_STATUS_MAP[String(formData.get("paymentStatus") ?? "")] ?? "UNPAID", memo: String(formData.get("memo") ?? "").trim() || null, dealingId: Number(formData.get("dealingId")) || null, buyerCompanyId: String(formData.get("buyerCompanyId") ?? "").trim() || null } });
}

export async function updatePurchaseRecord(formData: FormData) {
  const ownerUserId = await resolveCurrentUserId();
  const id = String(formData.get("id") ?? "").trim();
  const purchaseDate = new Date(String(formData.get("purchaseDate") ?? ""));
  const unitCost = parseNonNegativeInt(formData.get("unitCost"), "仕入単価");
  const quantity = parseNonNegativeInt(formData.get("quantity"), "仕入台数");
  const shippingCost = parseNonNegativeInt(formData.get("shippingCost") ?? "0", "送料");
  const otherCost = parseNonNegativeInt(formData.get("otherCost") ?? "0", "その他費用");
  if (!id || Number.isNaN(purchaseDate.getTime()) || quantity < 1) throw new Error("入力内容が不正です。");
  const target = await prismaClient.purchaseRecord.findFirst({ where: { id, ownerUserId } });
  if (!target) throw new Error("対象の仕入記録が見つかりません。");
  const paymentStatus = PAYMENT_STATUS_MAP[String(formData.get("paymentStatus") ?? "")] ?? "UNPAID";
  await prismaClient.purchaseRecord.update({ where: { id }, data: { purchaseDate, unitCost, quantity, shippingCost, otherCost, totalCost: unitCost * quantity + shippingCost + otherCost, paymentStatus, memo: String(formData.get("memo") ?? "").trim() || null } });
  revalidatePath(`/inventory/items/${target.inventoryItemId}`);
}

export async function updateSalesRecord(formData: FormData) {
  const ownerUserId = await resolveCurrentUserId();
  const id = String(formData.get("id") ?? "").trim();
  const salesDate = new Date(String(formData.get("salesDate") ?? ""));
  const unitPrice = parseNonNegativeInt(formData.get("unitPrice"), "売上単価");
  const quantity = parseNonNegativeInt(formData.get("quantity"), "売上台数");
  const shippingFee = parseNonNegativeInt(formData.get("shippingFee") ?? "0", "送料");
  const platformFee = parseNonNegativeInt(formData.get("platformFee") ?? "0", "手数料");
  const otherFee = parseNonNegativeInt(formData.get("otherFee") ?? "0", "その他費用");
  if (!id || Number.isNaN(salesDate.getTime()) || quantity < 1) throw new Error("入力内容が不正です。");
  const target = await prismaClient.salesRecord.findFirst({ where: { id, ownerUserId } });
  if (!target) throw new Error("対象の売上記録が見つかりません。");
  const paymentStatus = PAYMENT_STATUS_MAP[String(formData.get("paymentStatus") ?? "")] ?? "UNPAID";
  await prismaClient.salesRecord.update({ where: { id }, data: { salesDate, unitPrice, quantity, shippingFee, platformFee, otherFee, totalSales: unitPrice * quantity, paymentStatus, memo: String(formData.get("memo") ?? "").trim() || null } });
  revalidatePath(`/inventory/items/${target.inventoryItemId}`);
}

export async function updatePaymentRecord(formData: FormData) {
  const ownerUserId = await resolveCurrentUserId();
  const id = String(formData.get("id") ?? "").trim();
  const amount = parseNonNegativeInt(formData.get("amount"), "金額");
  const status = String(formData.get("status") ?? "") as PaymentRecordStatus;
  const paidAtRaw = String(formData.get("paidAt") ?? "").trim();
  if (!id || !PAYMENT_RECORD_STATUS_VALUES.includes(status)) throw new Error("入力内容が不正です。");
  const target = await prismaClient.paymentRecord.findFirst({ where: { id, ownerUserId } });
  if (!target) throw new Error("対象の支払記録が見つかりません。");
  const paidAt = paidAtRaw ? new Date(paidAtRaw) : null;
  if (paidAt && Number.isNaN(paidAt.getTime())) throw new Error("支払日が不正です。");
  await prismaClient.paymentRecord.update({ where: { id }, data: { amount, status, paidAt, memo: String(formData.get("memo") ?? "").trim() || null } });
}
export async function getInventoryFormMasters() {
  const ownerUserId = await resolveCurrentUserId();
  const [makers, machineModels, storageLocations] = await Promise.all([
    prismaClient.maker.findMany({ orderBy: { name: "asc" } }),
    prismaClient.machineModel.findMany({ include: { maker: true }, orderBy: [{ name: "asc" }] }),
    prismaClient.storageLocation.findMany({ where: { ownerUserId, isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return { makers, machineModels, storageLocations };
}

export async function getInventorySettingsData() {
  const ownerUserId = await resolveCurrentUserId();
  const [storageLocations, user] = await Promise.all([
    prismaClient.storageLocation.findMany({ where: { ownerUserId, isActive: true }, orderBy: { name: "asc" } }),
    prismaClient.user.findUnique({ where: { id: ownerUserId } }),
  ]);

  return {
    storageLocations,
    defaultStorageLocationId: user?.defaultStorageLocationId ?? null,
  };
}

export async function updateDefaultStorageLocation(formData: FormData) {
  const ownerUserId = await resolveCurrentUserId();
  const storageLocationId = String(formData.get("storageLocationId") ?? "").trim() || null;

  if (storageLocationId) {
    const location = await prismaClient.storageLocation.findUnique({ where: { id: storageLocationId } });
    if (!location || location.ownerUserId !== ownerUserId) {
      throw new Error("他ユーザーの倉庫は既定倉庫に設定できません。");
    }
  }

  await prismaClient.user.update({
    where: { id: ownerUserId },
    data: { defaultStorageLocationId: storageLocationId },
  });

  revalidatePath("/inventory/settings");
  revalidatePath("/inventory/inbound");
}

const toIntOrNull = (raw: FormDataEntryValue | null) => {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.floor(parsed);
};

const ITEM_TYPE_MAP: Record<string, InventoryItemType> = { パチンコ: "PACHINKO", パチスロ: "SLOT" };
const OWNERSHIP_TYPE_MAP: Record<string, InventoryOwnershipType> = { 在庫: "STOCK", 設置: "INSTALLED", 非在庫: "NON_STOCK" };
const INVENTORY_STATUS_MAP: Record<string, InventoryStatus> = {
  在庫中: "IN_STOCK",
  商談中: "NEGOTIATING",
  引当済: "RESERVED",
  発送予定: "OUTBOUND_SCHEDULED",
  売却済: "SOLD",
  設置中: "INSTALLED",
  非在庫: "NON_STOCK",
};
const LISTING_STATUS_MAP: Record<string, InventoryListingStatus> = {
  未出品: "NOT_LISTED",
  出品中: "LISTED",
  商談中: "NEGOTIATING",
  成約済: "CONTRACTED",
  停止中: "SUSPENDED",
  終了: "CLOSED",
};
const INBOUND_STATUS_MAP: Record<string, InboundStatus> = {
  未入庫: "PLANNED",
  入庫待ち: "ARRIVAL_WAITING",
  一部入庫: "PARTIALLY_RECEIVED",
  入庫済: "RECEIVED",
  取消: "CANCELED",
};
const OUTBOUND_STATUS_MAP: Record<string, OutboundStatus> = {
  未発送: "PLANNED",
  ピッキング中: "PICKING",
  発送準備中: "READY_TO_SHIP",
  発送済: "SHIPPED",
  納品済: "DELIVERED",
  取消: "CANCELED",
};
const SHIPPING_METHOD_MAP: Record<string, InventoryShippingMethod> = {
  元払い: "PREPAID",
  着払い: "COLLECT",
  チャーター便: "CHARTER",
  その他: "OTHER",
};

export type InventoryFormInput = {
  makerId: string | null;
  machineModelId: string | null;
  makerNameSnapshot: string | null;
  modelNameSnapshot: string;
  itemType: InventoryItemType;
  frameColor: string | null;
  ownershipType: InventoryOwnershipType;
  inventoryStatus: InventoryStatus;
  quantityOnHand: number;
  storageLocationId: string | null;
  purchaseUnitPrice: number | null;
  plannedSaleUnitPrice: number | null;
  listingStatus: InventoryListingStatus;
  note: string | null;
};

export function parseInventoryFormData(formData: FormData): { data?: InventoryFormInput; errors: string[] } {
  const errors: string[] = [];
  const itemType = ITEM_TYPE_MAP[String(formData.get("itemType") ?? "")];
  if (!itemType) errors.push("種別は必須です。");

  const modelNameSnapshot = String(formData.get("modelNameSnapshot") ?? "").trim();
  if (!modelNameSnapshot) errors.push("機種名は必須です。");

  const quantityOnHand = Number(formData.get("quantityOnHand"));
  if (!Number.isInteger(quantityOnHand) || quantityOnHand < 1) errors.push("台数は1以上で入力してください。");

  const purchaseUnitPrice = toIntOrNull(formData.get("purchaseUnitPrice"));
  const plannedSaleUnitPrice = toIntOrNull(formData.get("plannedSaleUnitPrice"));
  if (purchaseUnitPrice != null && purchaseUnitPrice < 0) errors.push("仕入単価は0以上で入力してください。");
  if (plannedSaleUnitPrice != null && plannedSaleUnitPrice < 0) errors.push("販売予定単価は0以上で入力してください。");

  const ownershipType = OWNERSHIP_TYPE_MAP[String(formData.get("ownershipType") ?? "")];
  const inventoryStatus = INVENTORY_STATUS_MAP[String(formData.get("inventoryStatus") ?? "")];
  const listingStatus = LISTING_STATUS_MAP[String(formData.get("listingStatus") ?? "")];
  if (!ownershipType) errors.push("所有区分を選択してください。");
  if (!inventoryStatus) errors.push("在庫ステータスを選択してください。");
  if (!listingStatus) errors.push("出品状態を選択してください。");

  if (errors.length) return { errors };

  return {
    errors,
    data: {
      makerId: String(formData.get("makerId") ?? "").trim() || null,
      machineModelId: String(formData.get("machineModelId") ?? "").trim() || null,
      makerNameSnapshot: String(formData.get("makerNameSnapshot") ?? "").trim() || null,
      modelNameSnapshot,
      itemType: itemType!,
      frameColor: String(formData.get("frameColor") ?? "").trim() || null,
      ownershipType: ownershipType!,
      inventoryStatus: inventoryStatus!,
      quantityOnHand,
      storageLocationId: String(formData.get("storageLocationId") ?? "").trim() || null,
      purchaseUnitPrice,
      plannedSaleUnitPrice,
      listingStatus: listingStatus!,
      note: String(formData.get("note") ?? "").trim() || null,
    },
  };
}

export async function createInventoryItem(input: InventoryFormInput) {
  const ownerUserId = await resolveCurrentUserId();
  return prismaClient.inventoryItem.create({ data: { ...input, ownerUserId } });
}

export async function updateInventoryItem(id: string, input: InventoryFormInput) {
  const ownerUserId = await resolveCurrentUserId();
  return prismaClient.$transaction(async (tx) => {
    const existing = await tx.inventoryItem.findFirst({ where: { id, ownerUserId } });
    if (!existing) return null;

    const updated = await tx.inventoryItem.update({ where: { id }, data: input });
    if (existing.quantityOnHand !== input.quantityOnHand) {
      await tx.inventoryMovement.create({
        data: {
          ownerUserId,
          inventoryItemId: id,
          movementType: "ADJUSTMENT",
          status: "COMMITTED",
          quantityDelta: input.quantityOnHand - existing.quantityOnHand,
          committedAt: new Date(),
          sourceType: "MANUAL",
          dedupeKey: `manual-adjustment-${id}-${crypto.randomUUID()}`,
          note: "在庫編集による数量調整",
          createdByUserId: ownerUserId,
        },
      });
    }
    return updated;
  });
}

export async function getInboundSchedules() {
  const ownerUserId = await resolveCurrentUserId();
  return prismaClient.inboundSchedule.findMany({
    where: { ownerUserId },
    include: { inventoryItem: true, destinationLocation: true },
    orderBy: { expectedDate: "asc" },
  });
}

export async function getOutboundSchedules() {
  const ownerUserId = await resolveCurrentUserId();
  return prismaClient.outboundSchedule.findMany({
    where: { ownerUserId },
    include: { inventoryItem: true, originLocation: true },
    orderBy: { expectedDate: "asc" },
  });
}

export async function getInboundScheduleById(id: string) {
  const ownerUserId = await resolveCurrentUserId();
  return prismaClient.inboundSchedule.findFirst({ where: { id, ownerUserId } });
}

export async function getOutboundScheduleById(id: string) {
  const ownerUserId = await resolveCurrentUserId();
  return prismaClient.outboundSchedule.findFirst({ where: { id, ownerUserId } });
}

const summarizeByStatus = <T extends { status: string; quantity: number }>(rows: T[]) =>
  rows.reduce<Record<string, { count: number; quantity: number }>>((acc, row) => {
    const current = acc[row.status] ?? { count: 0, quantity: 0 };
    acc[row.status] = { count: current.count + 1, quantity: current.quantity + row.quantity };
    return acc;
  }, {});

export async function getInboundScheduleSummary() {
  return summarizeByStatus(await getInboundSchedules());
}
export async function getOutboundScheduleSummary() {
  return summarizeByStatus(await getOutboundSchedules());
}

export async function getInventoryDashboardData() {
  const ownerUserId = await resolveCurrentUserId();

  const [inventoryItems, inboundSchedules, outboundSchedules, recentMovements, recentInboundSchedules, recentOutboundSchedules, purchaseRecords, salesRecords] = await Promise.all([
    prismaClient.inventoryItem.findMany({
      where: {
        ownerUserId,
        inventoryStatus: { notIn: ["SOLD", "ARCHIVED"] },
      },
      select: {
        id: true,
        quantityOnHand: true,
        purchaseUnitPrice: true,
        plannedSaleUnitPrice: true,
      },
    }),
    prismaClient.inboundSchedule.findMany({
      where: {
        ownerUserId,
        status: { notIn: ["RECEIVED", "CANCELED"] },
      },
      select: {
        id: true,
        status: true,
        destinationLocationId: true,
      },
    }),
    prismaClient.outboundSchedule.findMany({
      where: {
        ownerUserId,
        status: { notIn: ["SHIPPED", "DELIVERED", "CANCELED"] },
      },
      select: { id: true },
    }),
    prismaClient.inventoryMovement.findMany({
      where: { ownerUserId },
      orderBy: [{ committedAt: "desc" }, { createdAt: "desc" }],
      take: 20,
      include: {
        inventoryItem: {
          include: {
            storageLocation: true,
          },
        },
      },
    }),
    prismaClient.inboundSchedule.findMany({
      where: { ownerUserId },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: { inventoryItem: { select: { id: true, modelNameSnapshot: true } } },
    }),
    prismaClient.outboundSchedule.findMany({
      where: { ownerUserId },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: { inventoryItem: { select: { id: true, modelNameSnapshot: true } } },
    }),
    prismaClient.purchaseRecord.findMany({ where: { ownerUserId } }),
    prismaClient.salesRecord.findMany({ where: { ownerUserId } }),
  ]);

  const inventoryUnitCount = inventoryItems.reduce((sum, item) => sum + item.quantityOnHand, 0);
  const destinationMissingCount = inboundSchedules.filter((schedule) => schedule.destinationLocationId === null).length;
  const projectedGrossProfitTotal = inventoryItems.reduce((sum, item) => {
    if (item.purchaseUnitPrice == null || item.plannedSaleUnitPrice == null) return sum;
    return sum + (item.plannedSaleUnitPrice - item.purchaseUnitPrice) * item.quantityOnHand;
  }, 0);

  const realGrossProfitTotal = calculateRealGrossProfit({
    totalSales: salesRecords.filter((row) => row.paymentStatus !== "CANCELED").reduce((sum, row) => sum + row.totalSales, 0),
    totalCost: purchaseRecords.filter((row) => row.paymentStatus !== "CANCELED").reduce((sum, row) => sum + row.totalCost, 0),
    salesSideFees: salesRecords.filter((row) => row.paymentStatus !== "CANCELED").reduce((sum, row) => sum + row.shippingFee + row.platformFee + row.otherFee, 0),
    purchaseSideCosts: purchaseRecords.filter((row) => row.paymentStatus !== "CANCELED").reduce((sum, row) => sum + row.shippingCost + row.otherCost, 0),
  }).realGrossProfit;

  const recentActivities = getInventoryActivityFeed({
    movements: recentMovements.map((movement) => ({
      ...movement,
      inventoryItem: {
        id: movement.inventoryItem.id,
        modelNameSnapshot: movement.inventoryItem.modelNameSnapshot,
      },
    })),
    inboundSchedules: recentInboundSchedules,
    outboundSchedules: recentOutboundSchedules,
    purchaseRecords,
    salesRecords,
    take: 10,
  });

  return {
    kpi: {
      inventoryCount: inventoryItems.length,
      inventoryUnitCount,
      inboundOpenCount: inboundSchedules.length,
      outboundOpenCount: outboundSchedules.length,
      inboundDestinationMissingCount: destinationMissingCount,
      projectedGrossProfitTotal,
      realGrossProfitTotal,
    },
    recentMovements,
    recentActivities,
  };
}

export async function getInventoryActivityData({
  typeFilter,
  rangeFilter,
  page,
  pageSize = 50,
  take = 50,
}: {
  typeFilter: InventoryActivityTypeFilter;
  rangeFilter: InventoryActivityRangeFilter;
  page: number;
  pageSize?: number;
  take?: number;
}) {
  const ownerUserId = await resolveCurrentUserId();
  const [movements, inboundSchedules, outboundSchedules, purchaseRecords, salesRecords] = await Promise.all([
    prismaClient.inventoryMovement.findMany({
      where: { ownerUserId },
      orderBy: [{ committedAt: "desc" }, { createdAt: "desc" }],
      take: 200,
      include: { inventoryItem: { select: { id: true, modelNameSnapshot: true } } },
    }),
    prismaClient.inboundSchedule.findMany({
      where: { ownerUserId },
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: { inventoryItem: { select: { id: true, modelNameSnapshot: true } } },
    }),
    prismaClient.outboundSchedule.findMany({
      where: { ownerUserId },
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: { inventoryItem: { select: { id: true, modelNameSnapshot: true } } },
    }),
    prismaClient.purchaseRecord.findMany({ where: { ownerUserId } }),
    prismaClient.salesRecord.findMany({ where: { ownerUserId } }),
  ]);

  const allActivities = getInventoryActivityFeed({ movements, inboundSchedules, outboundSchedules, purchaseRecords, salesRecords, take: 1000 });
  const filteredActivities = filterInventoryActivities({ activities: allActivities, typeFilter, rangeFilter });
  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;

  return {
    filteredCount: filteredActivities.length,
    activities: filteredActivities.slice(start, end).slice(0, take),
    currentPage,
    totalPages,
  };
}

export async function createInboundSchedule(formData: FormData) {
  const ownerUserId = await resolveCurrentUserId();
  const expectedDate = new Date(String(formData.get("expectedDate") ?? ""));
  const modelNameSnapshot = String(formData.get("modelNameSnapshot") ?? "").trim();
  const quantity = Number(formData.get("quantity"));
  const itemType = ITEM_TYPE_MAP[String(formData.get("itemType") ?? "")];
  const status = INBOUND_STATUS_MAP[String(formData.get("status") ?? "")];
  if (!modelNameSnapshot || Number.isNaN(expectedDate.getTime()) || !Number.isInteger(quantity) || quantity < 1 || !itemType || !status) {
    throw new Error("入力内容が不正です。");
  }
  await prismaClient.inboundSchedule.create({
    data: {
      ownerUserId, expectedDate, modelNameSnapshot, quantity, itemType, status,
      supplierName: String(formData.get("supplierName") ?? "").trim() || null,
      makerNameSnapshot: String(formData.get("makerNameSnapshot") ?? "").trim() || null,
      frameColor: String(formData.get("frameColor") ?? "").trim() || null,
      destinationLocationId: String(formData.get("destinationLocationId") ?? "").trim() || null,
      inventoryItemId: String(formData.get("inventoryItemId") ?? "").trim() || null,
      sourceType: "MANUAL",
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });
}

export async function createOutboundSchedule(formData: FormData) {
  const ownerUserId = await resolveCurrentUserId();
  const expectedDate = new Date(String(formData.get("expectedDate") ?? ""));
  const modelNameSnapshot = String(formData.get("modelNameSnapshot") ?? "").trim();
  const quantity = Number(formData.get("quantity"));
  const itemType = ITEM_TYPE_MAP[String(formData.get("itemType") ?? "")];
  const status = OUTBOUND_STATUS_MAP[String(formData.get("status") ?? "")];
  const shippingMethod = SHIPPING_METHOD_MAP[String(formData.get("shippingMethod") ?? "")];
  if (!modelNameSnapshot || Number.isNaN(expectedDate.getTime()) || !Number.isInteger(quantity) || quantity < 1 || !itemType || !status || !shippingMethod) {
    throw new Error("入力内容が不正です。");
  }
  await prismaClient.outboundSchedule.create({
    data: {
      ownerUserId, expectedDate, modelNameSnapshot, quantity, itemType, status, shippingMethod,
      buyerName: String(formData.get("buyerName") ?? "").trim() || null,
      makerNameSnapshot: String(formData.get("makerNameSnapshot") ?? "").trim() || null,
      frameColor: String(formData.get("frameColor") ?? "").trim() || null,
      originLocationId: String(formData.get("originLocationId") ?? "").trim() || null,
      inventoryItemId: String(formData.get("inventoryItemId") ?? "").trim() || null,
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });
}

export async function completeInboundSchedule(scheduleId: string) {
  const ownerUserId = await resolveCurrentUserId();

  const result = await prismaClient.$transaction(async (tx) => {
    const schedule = await tx.inboundSchedule.findFirst({
      where: { id: scheduleId, ownerUserId },
    });
    if (!schedule) throw new Error("入庫予定が見つかりません。");
    if (schedule.status === "RECEIVED" || schedule.status === "CANCELED") {
      throw new Error("この入庫予定は完了できません。");
    }
    if (!schedule.destinationLocationId) {
      throw new Error("入庫先が未設定のため、入庫完了できません");
    }

    const existingMovement = await tx.inventoryMovement.findUnique({
      where: { dedupeKey: `inbound:${schedule.id}:received` },
    });
    if (existingMovement) {
      await tx.inboundSchedule.update({ where: { id: schedule.id }, data: { status: "RECEIVED" } });
      return { inventoryItemId: schedule.inventoryItemId };
    }

    let inventoryItemId = schedule.inventoryItemId;
    if (inventoryItemId) {
      const existingItem = await tx.inventoryItem.findFirst({ where: { id: inventoryItemId, ownerUserId } });
      if (!existingItem) throw new Error("紐付け在庫が見つかりません。");
      await tx.inventoryItem.update({
        where: { id: inventoryItemId },
        data: {
          quantityOnHand: existingItem.quantityOnHand + schedule.quantity,
          inventoryStatus: "IN_STOCK",
          storageLocationId: schedule.destinationLocationId ?? existingItem.storageLocationId,
        },
      });
    } else {
      const createdItem = await tx.inventoryItem.create({
        data: {
          ownerUserId,
          makerNameSnapshot: schedule.makerNameSnapshot,
          modelNameSnapshot: schedule.modelNameSnapshot,
          itemType: schedule.itemType,
          frameColor: schedule.frameColor,
          ownershipType: "STOCK",
          inventoryStatus: "IN_STOCK",
          quantityOnHand: schedule.quantity,
          storageLocationId: schedule.destinationLocationId,
          purchaseUnitPrice: null,
          plannedSaleUnitPrice: null,
          listingStatus: "NOT_LISTED",
          note: schedule.note,
        },
      });
      inventoryItemId = createdItem.id;
    }

    await tx.inventoryMovement.create({
      data: {
        ownerUserId,
        inventoryItemId: inventoryItemId!,
        movementType: "INBOUND",
        status: "COMMITTED",
        quantityDelta: schedule.quantity,
        committedAt: new Date(),
        sourceType: schedule.sourceType === "DEALING" ? "DEALING" : "MANUAL",
        sourceId: schedule.id,
        dedupeKey: `inbound:${schedule.id}:received`,
        note: "入庫予定の完了により在庫反映",
        createdByUserId: ownerUserId,
      },
    });

    await ensurePurchaseAndPaymentOnInboundComplete(tx, { ownerUserId, schedule, inventoryItemId: inventoryItemId!, quantity: schedule.quantity, committedAt: new Date() });

    await tx.inboundSchedule.update({
      where: { id: schedule.id },
      data: { status: "RECEIVED", inventoryItemId },
    });
    return { inventoryItemId };
  });

  revalidatePath("/inventory/inbound");
  revalidatePath("/inventory/items");
  if (result.inventoryItemId) revalidatePath(`/inventory/items/${result.inventoryItemId}`);
}

export async function completeOutboundSchedule(scheduleId: string) {
  const ownerUserId = await resolveCurrentUserId();

  const result = await prismaClient.$transaction(async (tx) => {
    const schedule = await tx.outboundSchedule.findFirst({
      where: { id: scheduleId, ownerUserId },
    });
    if (!schedule) throw new Error("発送予定が見つかりません。");
    if (["SHIPPED", "DELIVERED", "CANCELED"].includes(schedule.status)) {
      throw new Error("この発送予定は完了できません。");
    }
    if (!schedule.inventoryItemId) {
      throw new Error("紐付け在庫がないため発送完了できません。");
    }

    const existingMovement = await tx.inventoryMovement.findUnique({
      where: { dedupeKey: `outbound:${schedule.id}:shipped` },
    });
    if (existingMovement) {
      await tx.outboundSchedule.update({ where: { id: schedule.id }, data: { status: "SHIPPED" } });
      return { inventoryItemId: schedule.inventoryItemId };
    }

    const item = await tx.inventoryItem.findFirst({
      where: { id: schedule.inventoryItemId, ownerUserId },
    });
    if (!item) throw new Error("紐付け在庫が見つかりません。");
    if (item.quantityOnHand < schedule.quantity) {
      throw new Error("在庫不足のため発送完了できません。");
    }

    const nextQuantity = item.quantityOnHand - schedule.quantity;
    await tx.inventoryItem.update({
      where: { id: item.id },
      data: {
        quantityOnHand: nextQuantity,
        inventoryStatus: nextQuantity === 0 ? "SOLD" : "IN_STOCK",
        listingStatus: nextQuantity === 0 ? "CONTRACTED" : item.listingStatus,
      },
    });

    await tx.inventoryMovement.create({
      data: {
        ownerUserId,
        inventoryItemId: item.id,
        movementType: "OUTBOUND",
        status: "COMMITTED",
        quantityDelta: -schedule.quantity,
        committedAt: new Date(),
        sourceType: schedule.sourceType === "DEALING" ? "DEALING" : "MANUAL",
        sourceId: schedule.id,
        dedupeKey: `outbound:${schedule.id}:shipped`,
        note: "発送予定の完了により在庫反映",
        createdByUserId: ownerUserId,
      },
    });

    await ensureSalesAndPaymentOnOutboundComplete(tx, { ownerUserId, schedule, inventoryItemId: item.id, quantity: schedule.quantity, committedAt: new Date() });

    await tx.outboundSchedule.update({ where: { id: schedule.id }, data: { status: "SHIPPED" } });
    return { inventoryItemId: item.id };
  });

  revalidatePath("/inventory/outbound");
  revalidatePath("/inventory/items");
  if (result.inventoryItemId) revalidatePath(`/inventory/items/${result.inventoryItemId}`);
}

export async function updateInboundSchedule(scheduleId: string, formData: FormData) {
  const ownerUserId = await resolveCurrentUserId();
  const schedule = await prismaClient.inboundSchedule.findFirst({ where: { id: scheduleId, ownerUserId } });
  if (!schedule) throw new Error("入庫予定が見つかりません。");
  if (["RECEIVED", "CANCELED"].includes(schedule.status)) throw new Error("完了済みまたは取消済みの予定は編集できません");
  const expectedDate = new Date(String(formData.get("expectedDate") ?? ""));
  const modelNameSnapshot = String(formData.get("modelNameSnapshot") ?? "").trim();
  const quantity = Number(formData.get("quantity"));
  const itemType = ITEM_TYPE_MAP[String(formData.get("itemType") ?? "")];
  const status = INBOUND_STATUS_MAP[String(formData.get("status") ?? "")];
  if (!modelNameSnapshot || Number.isNaN(expectedDate.getTime()) || !Number.isInteger(quantity) || quantity < 1 || !itemType || !status) throw new Error("入力内容が不正です。");
  await prismaClient.inboundSchedule.update({ where: { id: scheduleId }, data: { expectedDate, modelNameSnapshot, quantity, itemType, status, supplierName: String(formData.get("supplierName") ?? "").trim() || null, makerNameSnapshot: String(formData.get("makerNameSnapshot") ?? "").trim() || null, frameColor: String(formData.get("frameColor") ?? "").trim() || null, destinationLocationId: String(formData.get("destinationLocationId") ?? "").trim() || null, inventoryItemId: String(formData.get("inventoryItemId") ?? "").trim() || null, note: String(formData.get("note") ?? "").trim() || null } });
  revalidatePath("/inventory/inbound");
}

export async function updateOutboundSchedule(scheduleId: string, formData: FormData) {
  const ownerUserId = await resolveCurrentUserId();
  const schedule = await prismaClient.outboundSchedule.findFirst({ where: { id: scheduleId, ownerUserId } });
  if (!schedule) throw new Error("発送予定が見つかりません。");
  if (["SHIPPED", "DELIVERED", "CANCELED"].includes(schedule.status)) throw new Error("完了済みまたは取消済みの予定は編集できません");
  const expectedDate = new Date(String(formData.get("expectedDate") ?? ""));
  const modelNameSnapshot = String(formData.get("modelNameSnapshot") ?? "").trim();
  const quantity = Number(formData.get("quantity"));
  const itemType = ITEM_TYPE_MAP[String(formData.get("itemType") ?? "")];
  const status = OUTBOUND_STATUS_MAP[String(formData.get("status") ?? "")];
  const shippingMethod = SHIPPING_METHOD_MAP[String(formData.get("shippingMethod") ?? "")];
  if (!modelNameSnapshot || Number.isNaN(expectedDate.getTime()) || !Number.isInteger(quantity) || quantity < 1 || !itemType || !status || !shippingMethod) throw new Error("入力内容が不正です。");
  await prismaClient.outboundSchedule.update({ where: { id: scheduleId }, data: { expectedDate, modelNameSnapshot, quantity, itemType, status, shippingMethod, buyerName: String(formData.get("buyerName") ?? "").trim() || null, makerNameSnapshot: String(formData.get("makerNameSnapshot") ?? "").trim() || null, frameColor: String(formData.get("frameColor") ?? "").trim() || null, originLocationId: String(formData.get("originLocationId") ?? "").trim() || null, inventoryItemId: String(formData.get("inventoryItemId") ?? "").trim() || null, note: String(formData.get("note") ?? "").trim() || null } });
  revalidatePath("/inventory/outbound");
}


export async function cancelCompletedInboundSchedule(scheduleId: string) {
  const ownerUserId = await resolveCurrentUserId();

  const result = await prismaClient.$transaction(async (tx) => {
    const schedule = await tx.inboundSchedule.findFirst({ where: { id: scheduleId, ownerUserId } });
    if (!schedule) throw new Error("入庫予定が見つかりません。");
    if (schedule.status === "CANCELED") return { inventoryItemId: schedule.inventoryItemId };
    if (schedule.status !== "RECEIVED") throw new Error("入庫完了済みの予定のみ取消できます。");
    if (!schedule.inventoryItemId) throw new Error("紐付け在庫が見つかりません。");

    const originalMovement = await tx.inventoryMovement.findUnique({ where: { dedupeKey: `inbound:${schedule.id}:received` } });
    if (!originalMovement) throw new Error("元の入庫履歴が見つからないため取消できません。");

    const reverseDedupeKey = `inbound:${schedule.id}:received:reverse`;
    const reverseMovement = await tx.inventoryMovement.findUnique({ where: { dedupeKey: reverseDedupeKey } });
    if (reverseMovement) {
      await tx.inboundSchedule.update({ where: { id: schedule.id }, data: { status: "CANCELED" } });
      return { inventoryItemId: schedule.inventoryItemId };
    }

    const item = await tx.inventoryItem.findFirst({ where: { id: schedule.inventoryItemId, ownerUserId } });
    if (!item) throw new Error("紐付け在庫が見つかりません。");
    if (item.quantityOnHand < schedule.quantity) throw new Error("この入庫分は既に出庫されているため取消できません。");

    const nextQuantity = item.quantityOnHand - schedule.quantity;
    await tx.inventoryItem.update({ where: { id: item.id }, data: { quantityOnHand: nextQuantity, inventoryStatus: nextQuantity === 0 ? "ARCHIVED" : item.inventoryStatus } });

    await tx.inventoryMovement.create({
      data: {
        ownerUserId,
        inventoryItemId: item.id,
        movementType: "ADJUSTMENT",
        status: "COMMITTED",
        quantityDelta: -schedule.quantity,
        committedAt: new Date(),
        sourceType: "MANUAL",
        sourceId: schedule.id,
        dedupeKey: reverseDedupeKey,
        note: "入庫完了取消による在庫戻し",
        createdByUserId: ownerUserId,
      },
    });

    await tx.inboundSchedule.update({ where: { id: schedule.id }, data: { status: "CANCELED" } });
    return { inventoryItemId: item.id };
  });

  revalidatePath("/inventory/inbound");
  revalidatePath("/inventory/items");
  if (result.inventoryItemId) revalidatePath(`/inventory/items/${result.inventoryItemId}`);
}

export async function cancelCompletedOutboundSchedule(scheduleId: string) {
  const ownerUserId = await resolveCurrentUserId();

  const result = await prismaClient.$transaction(async (tx) => {
    const schedule = await tx.outboundSchedule.findFirst({ where: { id: scheduleId, ownerUserId } });
    if (!schedule) throw new Error("発送予定が見つかりません。");
    if (schedule.status === "CANCELED") return { inventoryItemId: schedule.inventoryItemId };
    if (!["SHIPPED", "DELIVERED"].includes(schedule.status)) throw new Error("発送完了済みの予定のみ取消できます。");
    if (!schedule.inventoryItemId) throw new Error("紐付け在庫が見つかりません。");

    const originalMovement = await tx.inventoryMovement.findUnique({ where: { dedupeKey: `outbound:${schedule.id}:shipped` } });
    if (!originalMovement) throw new Error("元の発送履歴が見つからないため取消できません。");

    const reverseDedupeKey = `outbound:${schedule.id}:shipped:reverse`;
    const reverseMovement = await tx.inventoryMovement.findUnique({ where: { dedupeKey: reverseDedupeKey } });
    if (reverseMovement) {
      await tx.outboundSchedule.update({ where: { id: schedule.id }, data: { status: "CANCELED" } });
      return { inventoryItemId: schedule.inventoryItemId };
    }

    const item = await tx.inventoryItem.findFirst({ where: { id: schedule.inventoryItemId, ownerUserId } });
    if (!item) throw new Error("紐付け在庫が見つかりません。");

    await tx.inventoryItem.update({ where: { id: item.id }, data: { quantityOnHand: item.quantityOnHand + schedule.quantity, inventoryStatus: "IN_STOCK", listingStatus: "NOT_LISTED" } });

    await tx.inventoryMovement.create({
      data: {
        ownerUserId,
        inventoryItemId: item.id,
        movementType: "ADJUSTMENT",
        status: "COMMITTED",
        quantityDelta: schedule.quantity,
        committedAt: new Date(),
        sourceType: "MANUAL",
        sourceId: schedule.id,
        dedupeKey: reverseDedupeKey,
        note: "発送完了取消による在庫戻し",
        createdByUserId: ownerUserId,
      },
    });

    await tx.outboundSchedule.update({ where: { id: schedule.id }, data: { status: "CANCELED" } });
    return { inventoryItemId: item.id };
  });

  revalidatePath("/inventory/outbound");
  revalidatePath("/inventory/items");
  if (result.inventoryItemId) revalidatePath(`/inventory/items/${result.inventoryItemId}`);
}

export async function cancelInboundSchedule(scheduleId: string) {
  const ownerUserId = await resolveCurrentUserId();
  const schedule = await prismaClient.inboundSchedule.findFirst({ where: { id: scheduleId, ownerUserId } });
  if (!schedule) throw new Error("入庫予定が見つかりません。");
  if (schedule.status === "RECEIVED") throw new Error("完了済みは取消できません。");
  if (schedule.status !== "CANCELED") await prismaClient.inboundSchedule.update({ where: { id: schedule.id }, data: { status: "CANCELED" } });
  revalidatePath("/inventory/inbound");
}

export async function cancelOutboundSchedule(scheduleId: string) {
  const ownerUserId = await resolveCurrentUserId();
  const schedule = await prismaClient.outboundSchedule.findFirst({ where: { id: scheduleId, ownerUserId } });
  if (!schedule) throw new Error("発送予定が見つかりません。");
  if (["SHIPPED", "DELIVERED"].includes(schedule.status)) throw new Error("完了済みは取消できません。");
  if (schedule.status !== "CANCELED") await prismaClient.outboundSchedule.update({ where: { id: schedule.id }, data: { status: "CANCELED" } });
  revalidatePath("/inventory/outbound");
}


export async function resyncInventoryListingStatusAction(formData: FormData) {
  const ownerUserId = await resolveCurrentUserId();
  const linkId = String(formData.get("linkId") ?? "").trim();
  const inventoryItemId = String(formData.get("inventoryItemId") ?? "").trim();
  if (!linkId || !inventoryItemId) throw new Error("再同期に必要な情報が不足しています。");

  await resyncInventoryExternalLink(linkId, ownerUserId);
  revalidatePath(`/inventory/items/${inventoryItemId}`);
}



type FinancialPageParams = { skip: number; take: number };
type FinancialCsvType = "purchases" | "sales" | "payments" | "profit";
type FinancialProfitItem = Prisma.InventoryItemGetPayload<{ include: { maker: true; purchaseRecords: true; salesRecords: true } }>;
type FinancialPaymentRow = Prisma.PaymentRecordGetPayload<{}>;

const buildInventoryProfitRows = (
  items: FinancialProfitItem[],
  payments: FinancialPaymentRow[],
) => {

  return calculateInventoryProfitRows(
    items.map((item) => {
      const sourceIds = [...item.purchaseRecords.map((purchase) => purchase.id), ...item.salesRecords.map((sale) => sale.id)];
      return {
        id: item.id,
        makerName: item.maker?.name ?? item.makerNameSnapshot,
        modelName: item.modelNameSnapshot,
        quantityOnHand: item.quantityOnHand,
        inventoryStatus: item.inventoryStatus,
        purchaseRecords: item.purchaseRecords,
        salesRecords: item.salesRecords,
        paymentRecords: payments
          .filter((payment) => sourceIds.includes(payment.sourceId))
          .map((payment) => ({ sourceType: payment.sourceType, status: payment.status })),
      };
    }),
  );
};

type FinancialPurchaseCsvRow = Prisma.PurchaseRecordGetPayload<{ include: { inventoryItem: true } }>;
type FinancialSalesCsvRow = Prisma.SalesRecordGetPayload<{ include: { inventoryItem: true } }>;
type FinancialPaymentCsvRow = Prisma.PaymentRecordGetPayload<{}>;
type FinancialProfitCsvRow = ReturnType<typeof buildInventoryProfitRows>[number];
export async function getFinancialSummaryData() {
  const ownerUserId = await resolveCurrentUserId();
  const [purchases, sales, payments] = await Promise.all([
    prismaClient.purchaseRecord.findMany({ where: { ownerUserId }, select: { totalCost: true, paymentStatus: true } }),
    prismaClient.salesRecord.findMany({ where: { ownerUserId }, select: { totalSales: true, paymentStatus: true } }),
    prismaClient.paymentRecord.findMany({ where: { ownerUserId }, select: { amount: true, status: true, sourceType: true } }),
  ]);
  return { purchases, sales, payments };
}

export async function getFinancialPurchasesPage(params: FinancialPageParams) {
  const ownerUserId = await resolveCurrentUserId();
  const where = { ownerUserId };
  const [rows, totalCount] = await Promise.all([
    prismaClient.purchaseRecord.findMany({ where, include: { inventoryItem: { include: { maker: true, machineModel: true } } }, orderBy: { purchaseDate: "desc" }, skip: params.skip, take: params.take }),
    prismaClient.purchaseRecord.count({ where }),
  ]);
  return { rows, totalCount };
}

export async function getFinancialSalesPage(params: FinancialPageParams) {
  const ownerUserId = await resolveCurrentUserId();
  const where = { ownerUserId };
  const [rows, totalCount] = await Promise.all([
    prismaClient.salesRecord.findMany({ where, include: { inventoryItem: { include: { maker: true, machineModel: true } } }, orderBy: { salesDate: "desc" }, skip: params.skip, take: params.take }),
    prismaClient.salesRecord.count({ where }),
  ]);
  return { rows, totalCount };
}

export async function getFinancialPaymentsPage(params: FinancialPageParams) {
  const ownerUserId = await resolveCurrentUserId();
  const where = { ownerUserId };
  const [rows, totalCount] = await Promise.all([
    prismaClient.paymentRecord.findMany({ where, orderBy: { createdAt: "desc" }, skip: params.skip, take: params.take }),
    prismaClient.paymentRecord.count({ where }),
  ]);
  return { rows, totalCount };
}

export async function getFinancialProfitPage(params: FinancialPageParams) {
  const ownerUserId = await resolveCurrentUserId();
  const where = { ownerUserId };
  const [items, totalCount, payments] = await Promise.all([
    prismaClient.inventoryItem.findMany({ where, include: { maker: true, purchaseRecords: true, salesRecords: true }, orderBy: { updatedAt: "desc" }, skip: params.skip, take: params.take }),
    prismaClient.inventoryItem.count({ where }),
    prismaClient.paymentRecord.findMany({ where }),
  ]);
  const rows = buildInventoryProfitRows(items, payments);
  return { rows, totalCount };
}

export async function getFinancialCsvData(type: "purchases"): Promise<FinancialPurchaseCsvRow[]>;
export async function getFinancialCsvData(type: "sales"): Promise<FinancialSalesCsvRow[]>;
export async function getFinancialCsvData(type: "payments"): Promise<FinancialPaymentCsvRow[]>;
export async function getFinancialCsvData(type: "profit"): Promise<FinancialProfitCsvRow[]>;
export async function getFinancialCsvData(type: FinancialCsvType) {

  const ownerUserId = await resolveCurrentUserId();
  if (type === "purchases") return prismaClient.purchaseRecord.findMany({ where: { ownerUserId }, include: { inventoryItem: true }, orderBy: { purchaseDate: "desc" } });
  if (type === "sales") return prismaClient.salesRecord.findMany({ where: { ownerUserId }, include: { inventoryItem: true }, orderBy: { salesDate: "desc" } });
  if (type === "payments") return prismaClient.paymentRecord.findMany({ where: { ownerUserId }, orderBy: { createdAt: "desc" } });

  const [items, payments] = await Promise.all([
    prismaClient.inventoryItem.findMany({ where: { ownerUserId }, include: { maker: true, purchaseRecords: true, salesRecords: true }, orderBy: { updatedAt: "desc" } }),
    prismaClient.paymentRecord.findMany({ where: { ownerUserId } }),
  ]);
  return buildInventoryProfitRows(items, payments);
}


export async function runInventoryCsvImport(csvText: string) {
  const ownerUserId = await resolveCurrentUserId();
  const parsed = parseInventoryImportRows(csvText);
  const issues = [...parsed.issues, ...validateImportRows(parsed.rows)];
  if (issues.some((i) => i.level === "error")) {
    throw new Error(`CSV import validation failed: ${issues.map((i) => `${i.rowNumber}:${i.message}`).join(",")}`);
  }
  const defaultStorage = await prismaClient.storageLocation.findFirst({ where: { ownerUserId, isDefault: true, isActive: true } });
  const importBatchId = `${Date.now()}`;
  await prismaClient.$transaction(async (tx) => {
    await importInventoryCsv(tx, { ownerUserId, rows: parsed.rows, importBatchId, defaultStorageLocationId: defaultStorage?.id ?? null });
  });
  revalidatePath("/inventory");
  revalidatePath("/inventory/activity");
}
