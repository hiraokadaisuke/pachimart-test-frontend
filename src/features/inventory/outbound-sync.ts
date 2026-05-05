import type { PrismaClient } from "@prisma/client";
import {
  Prisma,
  DealingStatus,
  InventoryExternalLinkType,
  InventoryExternalRelationRole,
  InventoryExternalSyncStatus,
  InventoryShippingMethod,
  OutboundStatus,
} from "@prisma/client";

import { buildAutoFromDealingNoteToken } from "@/features/inventory/outbound-auto";
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
  const candidate = root?.desiredShipDate ?? conditions?.desiredShipDate;
  if (typeof candidate !== "string" || !candidate.trim()) return null;
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const mapShippingMethod = (payload: Prisma.JsonValue | null | undefined): InventoryShippingMethod => {
  const root = asRecord(payload);
  const conditions = asRecord(root?.conditions as Prisma.JsonValue | undefined);
  const raw = (root?.shippingMethod ?? conditions?.shippingMethod) as unknown;
  if (typeof raw !== "string") return InventoryShippingMethod.OTHER;
  const normalized = raw.toUpperCase();
  if (normalized in InventoryShippingMethod) {
    return InventoryShippingMethod[normalized as keyof typeof InventoryShippingMethod];
  }
  return InventoryShippingMethod.OTHER;
};

export async function createOutboundScheduleFromDealing(dealingId: number | string) {
  try {
    const id = Number(dealingId);
    if (!Number.isInteger(id) || id <= 0) return;

    const dealing = await prismaClient.dealing.findUnique({
      where: { id },
      include: { navi: true, buyerUser: true, sellerUser: true },
    });
    if (!dealing) return;
    if (!ELIGIBLE_DEALING_STATUSES.includes(dealing.status)) return;

    const listingId = dealing.navi?.listingId;
    if (!listingId) return;

    const exhibit = await prismaClient.exhibit.findUnique({ where: { id: listingId } });
    if (!exhibit) return;

    const link = await prismaClient.inventoryExternalLink.findFirst({
      where: {
        linkType: InventoryExternalLinkType.EXHIBIT,
        externalId: exhibit.id,
        syncStatus: InventoryExternalSyncStatus.ACTIVE,
        ownerUserId: dealing.sellerUserId,
      },
      orderBy: { createdAt: "desc" },
    });
    if (!link) return;

    const dealingDedupeKey = `outbound-from-dealing:${dealing.id}`;
    const existing = await prismaClient.outboundSchedule.findUnique({
      where: { dedupeKey: dealingDedupeKey },
      select: { id: true },
    });
    if (existing) return;

    const inventoryItem = await prismaClient.inventoryItem.findFirst({
      where: { id: link.inventoryItemId, ownerUserId: dealing.sellerUserId },
    });
    if (!inventoryItem) return;

    const payload = (dealing.navi?.payload ?? dealing.payload) as Prisma.JsonValue | null;
    const expectedDate = extractExpectedDate(payload) ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const desiredDateMissing = !extractExpectedDate(payload);

    // NOTE: 成約数量をそのまま出荷予定へ反映し、在庫の増減は発送完了時のみ既存処理で実施する。
    const quantity = exhibit.quantity;
    const noteParts = [
      "パチマート成約から自動作成",
      buildAutoFromDealingNoteToken(dealing.id),
      `dealingId: ${dealing.id}`,
      `exhibitId: ${exhibit.id}`,
    ];
    if (desiredDateMissing) noteParts.push("発送予定日未確定(暫定+7日)");
    if (quantity > inventoryItem.quantityOnHand) noteParts.push("注意: 出品数量が在庫数を超えています");

    await prismaClient.outboundSchedule.create({
      data: {
        ownerUserId: dealing.sellerUserId,
        inventoryItemId: inventoryItem.id,
        expectedDate,
        buyerName: dealing.buyerUser.companyName || dealing.buyerUser.contactName || "未設定",
        itemType: inventoryItem.itemType,
        makerNameSnapshot: inventoryItem.makerNameSnapshot ?? exhibit.maker,
        modelNameSnapshot: inventoryItem.modelNameSnapshot ?? exhibit.machineName ?? "商品",
        frameColor: inventoryItem.frameColor,
        quantity,
        originLocationId: inventoryItem.storageLocationId ?? exhibit.storageLocationId,
        shippingMethod: mapShippingMethod(payload),
        status: OutboundStatus.PLANNED,
        sourceType: "DEALING",
        sourceId: String(dealing.id),
        dedupeKey: dealingDedupeKey,
        note: noteParts.join("\n"),
      },
    });

    await prismaClient.inventoryExternalLink.upsert({
      where: {
        ownerUserId_linkType_externalId_relationRole: {
          ownerUserId: dealing.sellerUserId,
          linkType: InventoryExternalLinkType.DEALING,
          externalId: String(dealing.id),
          relationRole: InventoryExternalRelationRole.RELATED,
        },
      },
      create: {
        ownerUserId: dealing.sellerUserId,
        inventoryItemId: inventoryItem.id,
        linkType: InventoryExternalLinkType.DEALING,
        externalId: String(dealing.id),
        relationRole: InventoryExternalRelationRole.RELATED,
        syncStatus: InventoryExternalSyncStatus.ACTIVE,
        syncedAt: new Date(),
      },
      update: { syncStatus: InventoryExternalSyncStatus.ACTIVE, syncedAt: new Date(), inventoryItemId: inventoryItem.id },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
    console.error("[outbound-sync] failed to create outbound schedule from dealing", {
      dealingId,
      error,
    });
  }
}
