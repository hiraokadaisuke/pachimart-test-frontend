const AUTO_FROM_DEALING_PREFIX = "auto-from-dealing:";

export type OutboundAutoCreatedSourceType = "DEALING";

export type AutoCreatedOutboundInfo = {
  isAutoCreated: boolean;
  sourceType: OutboundAutoCreatedSourceType | null;
  sourceId: string | null;
  dealingId: number | null;
  isLegacyNoteBased: boolean;
};

export function buildAutoFromDealingNoteToken(dealingId: number): string {
  return `${AUTO_FROM_DEALING_PREFIX}${dealingId}`;
}

const parseDealingIdFromText = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const match = text.match(/auto-from-dealing:(\d+)/);
  if (!match) return null;
  const dealingId = Number(match[1]);
  return Number.isInteger(dealingId) && dealingId > 0 ? dealingId : null;
};

export function getAutoCreatedOutboundInfo(schedule: {
  sourceType?: string | null;
  sourceId?: string | null;
  note?: string | null;
}): AutoCreatedOutboundInfo {
  if (schedule.sourceType === "DEALING" && schedule.sourceId) {
    const sourceId = schedule.sourceId;
    const parsed = Number(sourceId);
    return {
      isAutoCreated: true,
      sourceType: "DEALING",
      sourceId,
      dealingId: Number.isInteger(parsed) && parsed > 0 ? parsed : parseDealingIdFromText(schedule.note),
      isLegacyNoteBased: false,
    };
  }

  const legacyDealingId = parseDealingIdFromText(schedule.note);
  if (legacyDealingId) {
    return {
      isAutoCreated: true,
      sourceType: null,
      sourceId: null,
      dealingId: legacyDealingId,
      isLegacyNoteBased: true,
    };
  }

  return {
    isAutoCreated: false,
    sourceType: null,
    sourceId: null,
    dealingId: null,
    isLegacyNoteBased: false,
  };
}
