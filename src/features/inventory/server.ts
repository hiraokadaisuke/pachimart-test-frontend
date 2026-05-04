import type {
  InboundStatus,
  InventoryShippingMethod,
  InventoryItemType,
  InventoryListingStatus,
  OutboundStatus,
  InventoryOwnershipType,
  InventoryStatus,
  PrismaClient,
} from "@prisma/client";
import { cookies } from "next/headers";

import { DEV_USERS } from "@/lib/dev-user/users";
import { prisma } from "@/lib/server/prisma";

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
  return prismaClient.inventoryItem.findFirst({
    where: { id, ownerUserId },
    include: {
      maker: true,
      machineModel: true,
      storageLocation: true,
      movements: { orderBy: [{ committedAt: "desc" }, { createdAt: "desc" }] },
    },
  });
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
