import type {
  InboundStatus,
  InventoryShippingMethod,
  InventoryItemType,
  InventoryListingStatus,
  OutboundStatus,
  InventoryOwnershipType,
  InventoryStatus,
  PrismaClient,
  RecordPaymentStatus,
  PaymentRecordStatus,
  InventoryUnitCodeType,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
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
import { computeCsvFileHash, importInventoryCsv, parseInventoryImportRows, validateImportRows } from "@/features/inventory/csv-import";
import { normalizeDisplayCode, parseMachineQr } from "@/features/inventory/qr-code";

const DEV_USER_COOKIE_KEY = "dev_user_id";

const resolveCurrentUserId = async () => {
  const store = await cookies();
  const cookieUserId = store.get(DEV_USER_COOKIE_KEY)?.value;
  if (cookieUserId) return cookieUserId;
  return DEV_USERS.A.id;
};

export const prismaClient = prisma as PrismaClient;

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
      inventoryUnits: { orderBy: { createdAt: "desc" } },
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


const INVENTORY_UNIT_CODE_TYPE_MAP: Record<string, InventoryUnitCodeType> = {
  MAIN_BOARD: "MAIN_BOARD", CERTIFICATE: "CERTIFICATE", BODY: "BODY", FRAME: "FRAME", BOARD: "BOARD", OTHER: "OTHER", UNKNOWN: "UNKNOWN",
};

export async function createInventoryUnit(formData: FormData) {
  const ownerUserId = await resolveCurrentUserId();
  const inventoryItemId = String(formData.get("inventoryItemId") ?? "").trim();
  if (!inventoryItemId) throw new Error("在庫IDは必須です。");
  const item = await prismaClient.inventoryItem.findFirst({ where: { id: inventoryItemId, ownerUserId } });
  if (!item) throw new Error("在庫が見つかりません。");

  const displayCodeRaw = String(formData.get("displayCode") ?? "");
  const rawQr = String(formData.get("rawQr") ?? "").trim() || null;
  const normalizedDisplayCode = normalizeDisplayCode(displayCodeRaw) || null;
  const parsed = rawQr ? parseMachineQr(rawQr, item.itemType) : null;
  const displayCode = normalizedDisplayCode ?? parsed?.displayCodeCandidate ?? null;

  const duplicate = displayCode
    ? await prismaClient.inventoryUnit.findFirst({ where: { ownerUserId, displayCode } })
    : null;

  const unit = await prismaClient.inventoryUnit.create({
    data: {
      ownerUserId,
      inventoryItemId,
      displayCode,
      rawQr,
      parsedQr: parsed?.parsedQr ? (parsed.parsedQr as Prisma.InputJsonValue) : undefined,
      itemType: item.itemType,
      codeType: INVENTORY_UNIT_CODE_TYPE_MAP[String(formData.get("codeType") ?? "")] ?? "UNKNOWN",
      bodySerialNumber: String(formData.get("bodySerialNumber") ?? "").trim() || null,
      frameSerialNumber: String(formData.get("frameSerialNumber") ?? "").trim() || null,
      mainBoardSerialNumber: String(formData.get("mainBoardSerialNumber") ?? "").trim() || null,
      memo: String(formData.get("memo") ?? "").trim() || null,
      status: displayCode ? "IN_STOCK" : "PROVISIONAL",
      storageLocationId: item.storageLocationId,
      confirmedAt: displayCode ? new Date() : null,
    },
  });

  revalidatePath(`/inventory/items/${inventoryItemId}`);
  return { unit, duplicateWarning: Boolean(duplicate) };
}


const INVENTORY_UNIT_STATUS_MAP = {
  PROVISIONAL: "PROVISIONAL",
  IN_STOCK: "IN_STOCK",
  RESERVED: "RESERVED",
  SHIPPED: "SHIPPED",
  CANCELED: "CANCELED",
} as const;


export async function parseUnitScanInput(formData: FormData) {
  const ownerUserId = await resolveCurrentUserId();
  void ownerUserId;
  const rawQr = String(formData.get("rawQr") ?? "").trim();
  const displayCodeInput = String(formData.get("displayCode") ?? "");
  const inventoryItemId = String(formData.get("inventoryItemId") ?? "").trim();
  const item = inventoryItemId ? await prismaClient.inventoryItem.findFirst({ where: { id: inventoryItemId, ownerUserId } }) : null;
  const parsed = rawQr && item ? parseMachineQr(rawQr, item.itemType) : null;
  const parsedDisplayCodeCandidate = normalizeDisplayCode(displayCodeInput) || parsed?.displayCodeCandidate || null;
  return { rawQr, parsedQr: parsed?.parsedQr ?? null, parsedDisplayCodeCandidate };
}

export async function findInventoryUnitByScan(rawQr?: string | null, displayCode?: string | null) {
  const ownerUserId = await resolveCurrentUserId();
  const normalizedDisplayCode = normalizeDisplayCode(displayCode ?? "");
  return prismaClient.inventoryUnit.findFirst({ where: { ownerUserId, OR: [{ rawQr: rawQr?.trim() || undefined }, { displayCode: normalizedDisplayCode || undefined }] } });
}

export async function checkInventoryUnitDuplicate(ownerUserId: string, displayCode?: string | null, rawQr?: string | null) {
  const normalizedDisplayCode = normalizeDisplayCode(displayCode ?? "");
  const [displayCodeDuplicate, rawQrDuplicate] = await Promise.all([
    normalizedDisplayCode ? prismaClient.inventoryUnit.findFirst({ where: { ownerUserId, displayCode: normalizedDisplayCode } }) : Promise.resolve(null),
    rawQr?.trim() ? prismaClient.inventoryUnit.findFirst({ where: { ownerUserId, rawQr: rawQr.trim() } }) : Promise.resolve(null),
  ]);
  return { displayCodeDuplicate, rawQrDuplicate };
}


export async function validateUnitScheduleLink(input: { ownerUserId: string; unitId: string; outboundScheduleId: string }) {
  const [unit, outbound] = await Promise.all([
    prismaClient.inventoryUnit.findFirst({ where: { id: input.unitId, ownerUserId: input.ownerUserId } }),
    prismaClient.outboundSchedule.findFirst({ where: { id: input.outboundScheduleId, ownerUserId: input.ownerUserId } }),
  ]);
  if (!unit || !outbound) throw new Error("紐づけ対象が見つかりません。");
  if (["SHIPPED", "CANCELED"].includes(unit.status)) throw new Error("発送済み/取消済み個体は紐づけ不可です。");
  if (unit.inventoryItemId !== outbound.inventoryItemId) throw new Error("別InventoryItemの個体は発送予定へ紐づけできません。");
  const linkedCount = await prismaClient.inventoryUnit.count({ where: { ownerUserId: input.ownerUserId, outboundScheduleId: outbound.id } });
  return { unit, outbound, overCapacity: linkedCount >= outbound.quantity, linkedCount };
}

export async function getInventoryUnitScanOptions() {
  const ownerUserId = await resolveCurrentUserId();
  const [recentItems, inboundSchedules, outboundSchedules] = await Promise.all([
    prismaClient.inventoryItem.findMany({
      where: { ownerUserId },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { maker: true, inventoryUnits: { select: { id: true } } },
    }),
    prismaClient.inboundSchedule.findMany({
      where: { ownerUserId, status: { notIn: ["RECEIVED", "CANCELED"] } },
      orderBy: { expectedDate: "asc" },
      include: { inventoryItem: { include: { maker: true } } },
    }),
    prismaClient.outboundSchedule.findMany({
      where: { ownerUserId, status: { notIn: ["SHIPPED", "DELIVERED", "CANCELED"] } },
      orderBy: { expectedDate: "asc" },
      include: { inventoryItem: { include: { maker: true } } },
    }),
  ]);
  const [inboundCounts, outboundCounts] = await Promise.all([
    prismaClient.inventoryUnit.groupBy({ by: ["inboundScheduleId"], where: { ownerUserId, inboundScheduleId: { not: null } }, _count: { _all: true } }),
    prismaClient.inventoryUnit.groupBy({ by: ["outboundScheduleId"], where: { ownerUserId, outboundScheduleId: { not: null } }, _count: { _all: true } }),
  ]);
  const inboundCountMap = new Map(inboundCounts.map((x) => [x.inboundScheduleId, x._count._all]));
  const outboundCountMap = new Map(outboundCounts.map((x) => [x.outboundScheduleId, x._count._all]));
  return {
    recentItems: recentItems.map((i) => ({ ...i, unitCount: i.inventoryUnits.length })),
    inboundSchedules: inboundSchedules.map((s) => ({ ...s, registeredUnitCount: inboundCountMap.get(s.id) ?? 0 })),
    outboundSchedules: outboundSchedules.map((s) => ({ ...s, selectedUnitCount: outboundCountMap.get(s.id) ?? 0 })),
  };
}

export async function createInventoryUnitFromScan(formData: FormData) {
  const ownerUserId = await resolveCurrentUserId();
  const inventoryItemId = String(formData.get("inventoryItemId") ?? "").trim();
  if (!inventoryItemId) throw new Error("在庫IDは必須です。");
  const item = await prismaClient.inventoryItem.findFirst({ where: { id: inventoryItemId, ownerUserId } });
  if (!item) throw new Error("在庫が見つかりません。");
  const parsedInput = await parseUnitScanInput(formData);
  const displayCode = parsedInput.parsedDisplayCodeCandidate;
  const rawQr = parsedInput.rawQr || null;
  const provisional = String(formData.get("provisional") ?? "") === "1";
  const inboundScheduleId = String(formData.get("inboundScheduleId") ?? "").trim() || null;
  let warning: string | null = null;
  if (inboundScheduleId) {
    const inbound = await prismaClient.inboundSchedule.findFirst({ where: { id: inboundScheduleId, ownerUserId } });
    if (!inbound) throw new Error("他ユーザーの入庫予定には紐づけできません。");
    if (inbound.inventoryItemId !== inventoryItemId) throw new Error("別InventoryItemの入庫予定には紐づけできません。");
    const inboundCount = await prismaClient.inventoryUnit.count({ where: { ownerUserId, inboundScheduleId } });
    if (inboundCount >= inbound.quantity) warning = "入庫予定台数を超過しています。";
  }
  const unit = await prismaClient.inventoryUnit.create({ data: { ownerUserId, inventoryItemId, itemType: item.itemType, rawQr, displayCode, parsedQr: parsedInput.parsedQr ? (parsedInput.parsedQr as Prisma.InputJsonValue) : Prisma.JsonNull, codeType: INVENTORY_UNIT_CODE_TYPE_MAP[String(formData.get("codeType") ?? "")] ?? "UNKNOWN", memo: String(formData.get("memo") ?? "").trim() || null, inboundScheduleId, status: inboundScheduleId ? "RESERVED" : (!provisional && displayCode ? "IN_STOCK" : "PROVISIONAL"), storageLocationId: item.storageLocationId, confirmedAt: !provisional && displayCode ? new Date() : null } });
  revalidatePath("/inventory/units/scan");
  return { ok: true, message: "個体を登録しました。", warning, nextAction: "次の台を読み取ってください", unitId: unit.id, linkedSchedule: inboundScheduleId ? `入庫予定に紐づけ: ${inboundScheduleId}` : null, clearedForNext: true };
}

export async function linkInventoryUnitToInbound(formData: FormData) {
  const ownerUserId = await resolveCurrentUserId();
  const unitId = String(formData.get("unitId") ?? "").trim();
  const inboundScheduleId = String(formData.get("inboundScheduleId") ?? "").trim();
  if (!unitId || !inboundScheduleId) throw new Error("個体IDと入庫予定IDは必須です。");
  const [unit, inbound] = await Promise.all([
    prismaClient.inventoryUnit.findFirst({ where: { id: unitId, ownerUserId } }),
    prismaClient.inboundSchedule.findFirst({ where: { id: inboundScheduleId, ownerUserId } }),
  ]);
  if (!unit || !inbound) throw new Error("紐づけ対象が見つかりません。");
  if (["CANCELED", "SHIPPED"].includes(unit.status)) throw new Error("取消済み/発送済み個体は紐づけ不可です。");
  if (unit.inventoryItemId !== inbound.inventoryItemId) throw new Error("別InventoryItemの入庫予定へは紐づけできません。");
  await prismaClient.inventoryUnit.update({ where: { id: unit.id }, data: { inboundScheduleId, status: unit.status === "PROVISIONAL" ? "RESERVED" : unit.status } });
}

export async function linkInventoryUnitToOutbound(formData: FormData) {
  const ownerUserId = await resolveCurrentUserId();
  const outboundScheduleId = String(formData.get("outboundScheduleId") ?? "").trim();
  if (!outboundScheduleId) throw new Error("発送予定IDは必須です。");
  const rawQr = String(formData.get("rawQr") ?? "").trim() || null;
  const displayCode = String(formData.get("displayCode") ?? "").trim() || null;
  const unit = await findInventoryUnitByScan(rawQr, displayCode);
  if (!unit) return { ok: false, message: "未登録個体です。", warning: "個体を先に登録してください。", nextAction: "仮登録", clearedForNext: false };
  const validated = await validateUnitScheduleLink({ ownerUserId, unitId: unit.id, outboundScheduleId });
  await prismaClient.inventoryUnit.update({ where: { id: unit.id }, data: { outboundScheduleId } });
  revalidatePath('/inventory/units/scan');
  return { ok: true, message: "発送予定に紐づけました。", warning: validated.overCapacity ? "発送予定台数を超過しています。" : null, nextAction: "次の台を読み取ってください", linkedSchedule: `発送予定: ${outboundScheduleId}`, unitId: unit.id, clearedForNext: true };
}
export async function updateInventoryUnit(formData: FormData) {
  const ownerUserId = await resolveCurrentUserId();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("個体IDは必須です。");

  const target = await prismaClient.inventoryUnit.findFirst({ where: { id, ownerUserId } });
  if (!target) throw new Error("対象の個体が見つかりません。");

  const displayCodeInput = String(formData.get("displayCode") ?? "");
  const rawQrInput = String(formData.get("rawQr") ?? "").trim();
  const rawQr = rawQrInput || null;
  const parsed = rawQr ? parseMachineQr(rawQr, target.itemType) : null;
  const displayCode = normalizeDisplayCode(displayCodeInput) || null;
  const duplicate = displayCode
    ? await prismaClient.inventoryUnit.findFirst({ where: { ownerUserId, displayCode, NOT: { id } } })
    : null;

  const statusRaw = String(formData.get("status") ?? "").trim();
  const status = (INVENTORY_UNIT_STATUS_MAP as Record<string, typeof target.status>)[statusRaw] ?? (displayCode ? target.status : "PROVISIONAL");

  const updated = await prismaClient.inventoryUnit.update({
    where: { id },
    data: {
      displayCode,
      rawQr,
      parsedQr: parsed?.parsedQr ? (parsed.parsedQr as Prisma.InputJsonValue) : Prisma.JsonNull,
      codeType: INVENTORY_UNIT_CODE_TYPE_MAP[String(formData.get("codeType") ?? "")] ?? "UNKNOWN",
      bodySerialNumber: String(formData.get("bodySerialNumber") ?? "").trim() || null,
      frameSerialNumber: String(formData.get("frameSerialNumber") ?? "").trim() || null,
      mainBoardSerialNumber: String(formData.get("mainBoardSerialNumber") ?? "").trim() || null,
      operationCheckStatus: (String(formData.get("operationCheckStatus") ?? "").trim() || "NOT_CHECKED") as never,
      glassStatus: (String(formData.get("glassStatus") ?? "").trim() || "UNKNOWN") as never,
      nailSheetStatus: (String(formData.get("nailSheetStatus") ?? "").trim() || "UNKNOWN") as never,
      inspectionStatus: (String(formData.get("inspectionStatus") ?? "").trim() || "NOT_INSPECTED") as never,
      storageLocationId: String(formData.get("storageLocationId") ?? "").trim() || null,
      inboundScheduleId: String(formData.get("inboundScheduleId") ?? "").trim() || null,
      outboundScheduleId: String(formData.get("outboundScheduleId") ?? "").trim() || null,
      memo: String(formData.get("memo") ?? "").trim() || null,
      status,
      confirmedAt: displayCode ? target.confirmedAt : null,
    },
  });
  revalidatePath(`/inventory/items/${updated.inventoryItemId}`);
  return { unit: updated, duplicateWarning: Boolean(duplicate) };
}

export async function confirmInventoryUnit(id: string) {
  const ownerUserId = await resolveCurrentUserId();
  const target = await prismaClient.inventoryUnit.findFirst({ where: { id, ownerUserId } });
  if (!target) throw new Error("対象の個体が見つかりません。");
  if (!target.displayCode) throw new Error("displayCode未設定のため確定できません。");
  const updated = await prismaClient.inventoryUnit.update({ where: { id }, data: { status: "IN_STOCK", confirmedAt: new Date() } });
  revalidatePath(`/inventory/items/${updated.inventoryItemId}`);
  return updated;
}

export async function cancelInventoryUnit(id: string) {
  const ownerUserId = await resolveCurrentUserId();
  const target = await prismaClient.inventoryUnit.findFirst({ where: { id, ownerUserId } });
  if (!target) throw new Error("対象の個体が見つかりません。");
  if (target.status === "SHIPPED") throw new Error("発送済み個体は取消できません。");
  const updated = await prismaClient.inventoryUnit.update({ where: { id }, data: { status: "CANCELED" } });
  revalidatePath(`/inventory/items/${updated.inventoryItemId}`);
  return updated;
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
    include: { inventoryItem: true, destinationLocation: true, inventoryUnits: true },
    orderBy: { expectedDate: "asc" },
  });
}

export async function getOutboundSchedules() {
  const ownerUserId = await resolveCurrentUserId();
  return prismaClient.outboundSchedule.findMany({
    where: { ownerUserId },
    include: { inventoryItem: true, originLocation: true, inventoryUnits: true },
    orderBy: { expectedDate: "asc" },
  });
}

export async function getInboundScheduleById(id: string) {
  const ownerUserId = await resolveCurrentUserId();
  return prismaClient.inboundSchedule.findFirst({ where: { id, ownerUserId } });
}

export async function getOutboundScheduleById(id: string) {
  const ownerUserId = await resolveCurrentUserId();
  return prismaClient.outboundSchedule.findFirst({ where: { id, ownerUserId }, include: { inventoryItem: true, originLocation: true, inventoryUnits: true } });
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

  const [inventoryItems, inboundSchedules, outboundSchedules, recentMovements, recentInboundSchedules, recentOutboundSchedules, purchaseRecords, salesRecords, activityInventoryUnits] = await Promise.all([
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
    prismaClient.inventoryUnit.findMany({ where: { ownerUserId }, orderBy: { updatedAt: "desc" }, take: 200 }),
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
    inventoryUnits: activityInventoryUnits,
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
  const [movements, inboundSchedules, outboundSchedules, purchaseRecords, salesRecords, inventoryUnits] = await Promise.all([
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
    prismaClient.inventoryUnit.findMany({ where: { ownerUserId }, orderBy: { updatedAt: "desc" }, take: 200 }),
  ]);

  const allActivities = getInventoryActivityFeed({ movements, inboundSchedules, outboundSchedules, purchaseRecords, salesRecords, inventoryUnits, take: 1000 });
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

    await tx.inventoryUnit.updateMany({ where: { ownerUserId, inboundScheduleId: schedule.id }, data: { status: "IN_STOCK", storageLocationId: schedule.destinationLocationId, inventoryItemId: inventoryItemId!, confirmedAt: new Date() } });

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
      await tx.inventoryUnit.updateMany({ where: { ownerUserId, outboundScheduleId: schedule.id }, data: { status: "SHIPPED", confirmedAt: new Date() } });

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

    await tx.inventoryUnit.updateMany({ where: { ownerUserId, outboundScheduleId: schedule.id }, data: { status: "SHIPPED", confirmedAt: new Date() } });

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
  const user = await prismaClient.user.findUnique({ where: { id: ownerUserId }, select: { defaultStorageLocationId: true } });
  const defaultStorage = user?.defaultStorageLocationId
    ? await prismaClient.storageLocation.findFirst({ where: { id: user.defaultStorageLocationId, ownerUserId, isActive: true } })
    : await prismaClient.storageLocation.findFirst({ where: { ownerUserId, isActive: true }, orderBy: { createdAt: "asc" } });
  const fileHash = computeCsvFileHash(csvText);
  const duplicateImportedCount = await prismaClient.inventoryImportBatch.count({ where: { ownerUserId, fileHash, status: "IMPORTED" } });
  await prismaClient.$transaction(async (tx) => {
    const batch = await tx.inventoryImportBatch.create({
      data: { ownerUserId, fileName: `manual-${new Date().toISOString()}.csv`, fileHash, totalRows: parsed.rows.length, status: "PREVIEWED", memo: duplicateImportedCount > 0 ? "同じCSVがすでに取り込まれている可能性があります" : null },
    });
    const result = await importInventoryCsv(tx, { ownerUserId, rows: parsed.rows, importBatchId: batch.id, defaultStorageLocationId: defaultStorage?.id ?? null });
    await tx.inventoryImportBatch.update({ where: { id: batch.id }, data: { successRows: result.successRows, errorRows: result.errorRows, status: result.errorRows > 0 ? "FAILED" : "IMPORTED", completedAt: new Date() } });
  });
  revalidatePath("/inventory");
  revalidatePath("/inventory/activity");
}

export async function getInventoryImportHistory() {
  const ownerUserId = await resolveCurrentUserId();
  return prismaClient.inventoryImportBatch.findMany({ where: { ownerUserId }, orderBy: { createdAt: "desc" }, take: 50 });
}

export async function getInventoryImportBatchDetail(id: string) {
  const ownerUserId = await resolveCurrentUserId();
  return prismaClient.inventoryImportBatch.findFirst({ where: { id, ownerUserId }, include: { rows: { orderBy: { rowNumber: "asc" } } } });
}

export async function getInventoryCsvDuplicateWarning(csvText: string) {
  const ownerUserId = await resolveCurrentUserId();
  const fileHash = computeCsvFileHash(csvText);
  const count = await prismaClient.inventoryImportBatch.count({ where: { ownerUserId, fileHash, status: "IMPORTED" } });
  return count > 0 ? "同じCSVがすでに取り込まれている可能性があります" : null;
}

export type StocktakeScanInput = {
  ownerUserId: string;
  sessionId: string;
  scannedDisplayCode?: string | null;
  scannedRawQr?: string | null;
  targetWarehouseId?: string | null;
  targetStorageLocationId?: string | null;
  memo?: string | null;
};

export async function getStocktakeSessions() {
  const ownerUserId = await resolveCurrentUserId();
  return prismaClient.inventoryStocktakeSession.findMany({
    where: { ownerUserId },
    include: { scans: true, targetWarehouse: true, targetStorageLocation: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createStocktakeSession(formData: FormData) {
  const ownerUserId = await resolveCurrentUserId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("棚卸名は必須です。");
  const targetWarehouseId = String(formData.get("targetWarehouseId") ?? "").trim() || null;
  const targetStorageLocationId = String(formData.get("targetStorageLocationId") ?? "").trim() || null;
  const memo = String(formData.get("memo") ?? "").trim() || null;
  const row = await prismaClient.inventoryStocktakeSession.create({
    data: { ownerUserId, name, targetWarehouseId, targetStorageLocationId, memo, status: "DRAFT" },
  });
  revalidatePath("/inventory/stocktakes");
  return row;
}

export async function getStocktakeSessionById(id: string) {
  const ownerUserId = await resolveCurrentUserId();
  return prismaClient.inventoryStocktakeSession.findFirst({
    where: { id, ownerUserId },
    include: {
      targetWarehouse: true,
      targetStorageLocation: true,
      scans: { include: { inventoryUnit: { include: { inventoryItem: true, } }, storageLocation: true }, orderBy: { scannedAt: "desc" } },
    },
  });
}

export async function createStocktakeScan(input: StocktakeScanInput) {
  const session = await prismaClient.inventoryStocktakeSession.findFirst({ where: { id: input.sessionId, ownerUserId: input.ownerUserId } });
  if (!session) throw new Error("棚卸セッションが見つかりません。");
  const normalizedDisplayCode = normalizeDisplayCode(input.scannedDisplayCode ?? "") || null;
  const rawQr = String(input.scannedRawQr ?? "").trim() || null;

  const candidates = await prismaClient.inventoryUnit.findMany({
    where: {
      ownerUserId: input.ownerUserId,
      OR: [
        normalizedDisplayCode ? { displayCode: normalizedDisplayCode } : undefined,
        normalizedDisplayCode ? { bodySerialNumber: normalizedDisplayCode } : undefined,
        normalizedDisplayCode ? { frameSerialNumber: normalizedDisplayCode } : undefined,
        normalizedDisplayCode ? { mainBoardSerialNumber: normalizedDisplayCode } : undefined,
        rawQr ? { rawQr } : undefined,
      ].filter(Boolean) as any,
    },
    include: { inventoryItem: true },
    take: 10,
  });

  let matched: (typeof candidates)[number] | null = candidates[0] ?? null;
  let matchStatus: any = "NOT_FOUND";
  let matchedBy: any = null;

  if (candidates.length > 1) {
    matchStatus = "MANUAL_REVIEW";
    matched = null;
  } else if (matched) {
    const dup = await prismaClient.inventoryStocktakeScan.findFirst({ where: { sessionId: input.sessionId, inventoryUnitId: matched.id } });
    if (dup) {
      matchStatus = "DUPLICATE_SCAN";
    } else if (input.targetStorageLocationId && matched.storageLocationId && matched.storageLocationId !== input.targetStorageLocationId) {
      matchStatus = "WRONG_LOCATION";
    } else if (normalizedDisplayCode && [matched.displayCode, matched.bodySerialNumber, matched.frameSerialNumber, matched.mainBoardSerialNumber].includes(normalizedDisplayCode)) {
      matchStatus = "MATCHED";
      matchedBy = "DISPLAY_CODE";
    } else if (rawQr && matched.rawQr === rawQr) {
      matchStatus = "QR_MATCHED";
      matchedBy = "RAW_QR";
    } else {
      matchStatus = "MANUAL_REVIEW";
      matchedBy = "MANUAL";
    }
  }

  const scan = await prismaClient.inventoryStocktakeScan.create({
    data: {
      ownerUserId: input.ownerUserId,
      sessionId: input.sessionId,
      inventoryUnitId: matched?.id ?? null,
      scannedRawQr: rawQr,
      scannedDisplayCode: input.scannedDisplayCode?.trim() || null,
      normalizedDisplayCode,
      matchStatus,
      matchedBy,
      warehouseId: input.targetWarehouseId ?? session.targetWarehouseId,
      storageLocationId: input.targetStorageLocationId ?? session.targetStorageLocationId,
      memo: input.memo ?? null,
    },
  });
  return scan;
}
