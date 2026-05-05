const AUTO_FROM_DEALING_PREFIX = "auto-from-dealing:";

export type AutoCreatedOutboundInfo = {
  isAutoCreated: boolean;
  dealingId: number | null;
};

export function buildAutoFromDealingNoteToken(dealingId: number): string {
  return `${AUTO_FROM_DEALING_PREFIX}${dealingId}`;
}

export function getAutoCreatedOutboundInfo(note: string | null): AutoCreatedOutboundInfo {
  if (!note) return { isAutoCreated: false, dealingId: null };
  const match = note.match(/auto-from-dealing:(\d+)/);
  if (!match) return { isAutoCreated: false, dealingId: null };
  const dealingId = Number(match[1]);
  return {
    isAutoCreated: Number.isInteger(dealingId) && dealingId > 0,
    dealingId: Number.isInteger(dealingId) && dealingId > 0 ? dealingId : null,
  };
}

