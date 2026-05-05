import type { ExhibitStatus, InventoryListingStatus, PrismaClient } from "@prisma/client";
import { InventoryExternalLinkType, InventoryExternalSyncStatus } from "@prisma/client";

import { prisma } from "@/lib/server/prisma";

const prismaClient = prisma as PrismaClient;

export const mapExhibitStatusToInventoryListingStatus = (
  status: ExhibitStatus
): InventoryListingStatus => {
  switch (status) {
    case "DRAFT":
      return "NOT_LISTED";
    case "PUBLISHED":
      return "LISTED";
    case "SOLD":
      return "CONTRACTED";
    default:
      return "NOT_LISTED";
  }
};

export async function syncInventoryListingStatusFromExhibit(exhibitId: string) {
  try {
    const exhibit = await prismaClient.exhibit.findUnique({ where: { id: exhibitId } });
    if (!exhibit) return;

    const link = await prismaClient.inventoryExternalLink.findFirst({
      where: {
        linkType: InventoryExternalLinkType.EXHIBIT,
        externalId: exhibitId,
        syncStatus: InventoryExternalSyncStatus.ACTIVE,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!link) return;
    if (link.ownerUserId !== exhibit.sellerUserId) {
      console.error("[inventory-sync] owner mismatch", { exhibitId, linkId: link.id });
      return;
    }

    const item = await prismaClient.inventoryItem.findFirst({
      where: { id: link.inventoryItemId, ownerUserId: link.ownerUserId },
    });
    if (!item) return;

    const nextListingStatus = mapExhibitStatusToInventoryListingStatus(exhibit.status);
    const shouldPreventRelist =
      (item.inventoryStatus === "SOLD" || item.inventoryStatus === "ARCHIVED") &&
      nextListingStatus === "LISTED";

    if (!shouldPreventRelist && item.listingStatus !== nextListingStatus) {
      await prismaClient.inventoryItem.update({
        where: { id: item.id },
        data: { listingStatus: nextListingStatus },
      });
    }

    await prismaClient.inventoryExternalLink.update({
      where: { id: link.id },
      data: {
        syncedAt: new Date(),
        payloadSnapshot: {
          exhibitId: exhibit.id,
          exhibitStatus: exhibit.status,
          inventoryItemId: item.id,
          inventoryListingStatus: shouldPreventRelist ? item.listingStatus : nextListingStatus,
        },
      },
    });
  } catch (error) {
    console.error("[inventory-sync] failed to sync listing status", { exhibitId, error });
  }
}

export async function resyncInventoryExternalLink(linkId: string, ownerUserId: string) {
  const link = await prismaClient.inventoryExternalLink.findFirst({
    where: { id: linkId, ownerUserId, linkType: InventoryExternalLinkType.EXHIBIT },
  });

  if (!link) {
    throw new Error("出品紐付けが見つかりません。");
  }

  await syncInventoryListingStatusFromExhibit(link.externalId);
}

export async function getExhibitStatusesByIds(ids: string[]) {
  if (!ids.length) return new Map<string, ExhibitStatus>();
  const exhibits = await prismaClient.exhibit.findMany({ where: { id: { in: ids } }, select: { id: true, status: true } });
  return new Map(exhibits.map((exhibit) => [exhibit.id, exhibit.status]));
}
