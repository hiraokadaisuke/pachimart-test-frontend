import { TradeNaviDraft } from "./types";

const STORAGE_KEY_PREFIX = "navi_draft_";

function getStorageKey(userId: string, draftId: string) {
  return `${STORAGE_KEY_PREFIX}${userId}_${draftId}`;
}

export function deleteNaviDraft(userId: string, draftId: string) {
  if (typeof window === "undefined") return;
  const key = getStorageKey(userId, draftId);
  window.sessionStorage.removeItem(key);
}

export function saveNaviDraft(userId: string, draft: TradeNaviDraft) {
  if (typeof window === "undefined") return;
  if (!draft.status) return;
  const key = getStorageKey(userId, draft.id);
  const now = new Date().toISOString();
  const payload: TradeNaviDraft = {
    ...draft,
    updatedAt: now,
    ownerUserId: userId,
  };
  window.sessionStorage.setItem(key, JSON.stringify(payload));
}

export const saveNavi = saveNaviDraft;

export function loadNaviDraft(userId: string, id: string): TradeNaviDraft | null {
  if (typeof window === "undefined") return null;
  const key = getStorageKey(userId, id);
  const raw = window.sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TradeNaviDraft;
  } catch {
    return null;
  }
}

export const loadNavi = loadNaviDraft;

export function loadAllNavis(userId: string): TradeNaviDraft[] {
  if (typeof window === "undefined") return [];

  const drafts: TradeNaviDraft[] = [];

  for (let i = 0; i < window.sessionStorage.length; i += 1) {
    const key = window.sessionStorage.key(i);
    if (!key || !key.startsWith(STORAGE_KEY_PREFIX)) continue;

    const raw = window.sessionStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as TradeNaviDraft;
      if (!parsed?.id) continue;
      if (!parsed.status) continue;
      if (parsed.ownerUserId !== userId) continue;
      drafts.push(parsed);
    } catch {
      // ignore malformed data
    }
  }

  return drafts;
}

export function updateNaviStatus(
  userId: string,
  id: string,
  status: TradeNaviDraft["status"]
): TradeNaviDraft | null {
  if (typeof window === "undefined") return null;
  const existing = loadNaviDraft(userId, id);
  if (!existing) return null;

  const nextDraft: TradeNaviDraft = {
    ...existing,
    status,
    updatedAt: new Date().toISOString(),
  };

  saveNaviDraft(userId, nextDraft);
  return nextDraft;
}

export function createEmptyNaviDraft(initial?: Partial<TradeNaviDraft>): TradeNaviDraft {
  const id =
    initial?.id ?? (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `draft-${Date.now()}`);
  const now = new Date().toISOString();

  return {
    id,
    ownerUserId: initial?.ownerUserId ?? "",
    status: initial?.status ?? null,
    productId: initial?.productId ?? null,
    buyerId: initial?.buyerId ?? null,
    buyerCompanyName: initial?.buyerCompanyName ?? null,
    buyerContactName: initial?.buyerContactName ?? null,
    buyerAddress: initial?.buyerAddress ?? null,
    buyerTel: initial?.buyerTel ?? null,
    buyerEmail: initial?.buyerEmail ?? null,
    buyerNote: initial?.buyerNote ?? null,
    buyerPending: initial?.buyerPending ?? true,
    conditions: {
      unitPrice: initial?.conditions?.unitPrice ?? 0,
      quantity: initial?.conditions?.quantity ?? 1,
      shippingFee: initial?.conditions?.shippingFee ?? 0,
      handlingFee: initial?.conditions?.handlingFee ?? 0,
      taxRate: initial?.conditions?.taxRate ?? 0.1,
      removalDate: initial?.conditions?.removalDate ?? null,
      machineShipmentDate: initial?.conditions?.machineShipmentDate ?? null,
      machineShipmentType: initial?.conditions?.machineShipmentType ?? null,
      documentShipmentDate: initial?.conditions?.documentShipmentDate ?? null,
      documentShipmentType: initial?.conditions?.documentShipmentType ?? null,
      paymentDue: initial?.conditions?.paymentDue ?? null,
      cardboardFee: initial?.conditions?.cardboardFee ?? null,
      nailSheetFee: initial?.conditions?.nailSheetFee ?? null,
      insuranceFee: initial?.conditions?.insuranceFee ?? null,
      notes: initial?.conditions?.notes ?? null,
      terms: initial?.conditions?.terms ?? null,
      memo: initial?.conditions?.memo ?? null,
      handler: initial?.conditions?.handler ?? null,
      productName: initial?.conditions?.productName ?? null,
      makerName: initial?.conditions?.makerName ?? null,
      location: initial?.conditions?.location ?? null,
    },
    createdAt: initial?.createdAt ?? now,
    updatedAt: initial?.updatedAt ?? now,
  };
}
