const INBOUND_FROM_DEALING_PREFIX = "inbound-from-dealing:";
const AUTO_FROM_DEALING_PREFIX = "auto-from-dealing:";

export type InboundAutoCreatedSourceType = "DEALING";

export type AutoCreatedInboundInfo = {
  isAutoCreated: boolean;
  sourceType: InboundAutoCreatedSourceType | null;
  sourceId: string | null;
  dealingId: number | null;
  isLegacyNoteBased: boolean;
};

export function buildInboundFromDealingDedupeKey(dealingId: number): string {
  return `${INBOUND_FROM_DEALING_PREFIX}${dealingId}`;
}

export function buildInboundFromDealingNote(dealingId: number, exhibitId: string): string {
  return [
    "パチマート購入から自動作成",
    `${AUTO_FROM_DEALING_PREFIX}${dealingId}`,
    `dealingId: ${dealingId}`,
    `exhibitId: ${exhibitId}`,
    "入庫先未設定",
    "入庫予定日未確定(暫定+7日)",
  ].join("\n");
}

const parseDealingIdFromText = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const match = text.match(/(?:inbound-from-dealing|auto-from-dealing):(\d+)/);
  if (!match) return null;
  const dealingId = Number(match[1]);
  return Number.isInteger(dealingId) && dealingId > 0 ? dealingId : null;
};

export function getAutoCreatedInboundInfo(schedule: {
  sourceType?: string | null;
  sourceId?: string | null;
  note?: string | null;
}): AutoCreatedInboundInfo {
  if (schedule.sourceType === "DEALING" && schedule.sourceId) {
    const parsed = Number(schedule.sourceId);
    return {
      isAutoCreated: true,
      sourceType: "DEALING",
      sourceId: schedule.sourceId,
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
