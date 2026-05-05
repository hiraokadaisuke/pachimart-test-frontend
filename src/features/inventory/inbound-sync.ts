import type { PrismaClient } from "@prisma/client";
import { DealingStatus, InventoryItemType, InboundStatus, Prisma } from "@prisma/client";

import { buildInboundFromDealingDedupeKey } from "@/features/inventory/inbound-auto";
import { prisma } from "@/lib/server/prisma";

const prismaClient = prisma as PrismaClient;

const ELIGIBLE_DEALING_STATUSES: DealingStatus[] = [
  DealingStatus.PAYMENT_REQUIRED,
  DealingStatus.CONFIRM_REQUIRED,
  DealingStatus.COMPLETED,
];

const asRecord = (value: Prisma.JsonValue | null | undefined): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const extractExpectedDate = (payload: Prisma.JsonValue | null | undefined): Date | null => {
  const root = asRecord(payload);
  const conditions = asRecord(root?.conditions as Prisma.JsonValue | undefined);
  const candidate = root?.desiredShipDate ?? root?.arrivalDate ?? conditions?.desiredShipDate;
  if (typeof candidate !== "string" || !candidate.trim()) return null;
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const mapExhibitTypeToInventoryType = (value: string | null | undefined): InventoryItemType =>
  value === "SLOT" ? InventoryItemType.SLOT : InventoryItemType.PACHINKO;

export async function createInboundScheduleFromDealing(dealingId: number | string) {
  try {
    const id = Number(dealingId);
    if (!Number.isInteger(id) || id <= 0) return;

    const dealing = await prismaClient.dealing.findUnique({
      where: { id },
      include: { navi: true, buyerUser: true, sellerUser: true },
    });
    if (!dealing) return;
    if (!ELIGIBLE_DEALING_STATUSES.includes(dealing.status)) return;
    if (!dealing.buyerUserId) return;

    const listingId = dealing.navi?.listingId;
    if (!listingId) return;

    const exhibit = await prismaClient.exhibit.findUnique({ where: { id: listingId } });
    if (!exhibit) return;

    const dedupeKey = buildInboundFromDealingDedupeKey(dealing.id);
    const existing = await prismaClient.inboundSchedule.findUnique({
      where: { dedupeKey },
      select: { id: true },
    });
    if (existing) return;

    const payload = (dealing.navi?.payload ?? dealing.payload) as Prisma.JsonValue | null;
    const parsedExpectedDate = extractExpectedDate(payload);
    const expectedDate = parsedExpectedDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const noteParts = [
      "パチマート購入から自動作成",
      `inbound-from-dealing:${dealing.id}`,
      `dealingId: ${dealing.id}`,
      `exhibitId: ${exhibit.id}`,
      "入庫先未設定",
    ];
    if (!parsedExpectedDate) noteParts.push("入庫予定日未確定(暫定+7日)");

    await prismaClient.inboundSchedule.create({
      data: {
        ownerUserId: dealing.buyerUserId,
        inventoryItemId: null,
        expectedDate,
        supplierName: dealing.sellerUser.companyName || dealing.sellerUser.contactName || "未設定",
        itemType: mapExhibitTypeToInventoryType(exhibit.type),
        makerNameSnapshot: exhibit.maker,
        modelNameSnapshot: exhibit.machineName || "商品",
        frameColor: null,
        quantity: exhibit.quantity,
        destinationLocationId: null,
        status: InboundStatus.PLANNED,
        sourceType: "DEALING",
        sourceId: String(dealing.id),
        dedupeKey,
        note: noteParts.join("\n"),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
    console.error("[inbound-sync] failed to create inbound schedule from dealing", { dealingId, error });
  }
}
