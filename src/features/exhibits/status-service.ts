import type { ExhibitStatus } from "@prisma/client";

import { syncInventoryListingStatusFromExhibit } from "@/features/inventory/listing-sync";
import { prisma } from "@/lib/server/prisma";

type UpdateExhibitStatusWithInventorySyncParams = {
  exhibitId: string;
  status: ExhibitStatus;
  actorUserId?: string;
  reason?: string;
  allowMissingInventoryLink?: boolean;
  data?: Record<string, unknown>;
};

export async function updateExhibitStatusWithInventorySync({
  exhibitId,
  status,
  actorUserId,
  reason,
  allowMissingInventoryLink = true,
  data,
}: UpdateExhibitStatusWithInventorySyncParams) {
  const updated = await prisma.exhibit.update({
    where: { id: exhibitId },
    data: { ...(data ?? {}), status },
  });

  try {
    await syncInventoryListingStatusFromExhibit(updated.id);
  } catch (error) {
    console.error("[exhibit-status-service] inventory listing sync failed", {
      exhibitId: updated.id,
      status,
      actorUserId,
      reason,
      allowMissingInventoryLink,
      error,
    });
  }

  return updated;
}
