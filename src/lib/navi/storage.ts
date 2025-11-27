import { TradeNaviDraft } from "./types";

const STORAGE_KEY_PREFIX = "navi_draft_";

export function saveNaviDraft(draft: TradeNaviDraft) {
  if (typeof window === "undefined") return;
  const key = STORAGE_KEY_PREFIX + draft.id;
  const now = new Date().toISOString();
  const payload: TradeNaviDraft = {
    ...draft,
    updatedAt: now,
  };
  window.sessionStorage.setItem(key, JSON.stringify(payload));
}

export function loadNaviDraft(id: string): TradeNaviDraft | null {
  if (typeof window === "undefined") return null;
  const key = STORAGE_KEY_PREFIX + id;
  const raw = window.sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TradeNaviDraft;
  } catch {
    return null;
  }
}

export function updateNaviStatus(id: string, status: TradeNaviDraft["status"]): TradeNaviDraft | null {
  if (typeof window === "undefined") return null;
  const existing = loadNaviDraft(id);
  if (!existing) return null;

  const nextDraft: TradeNaviDraft = {
    ...existing,
    status,
    updatedAt: new Date().toISOString(),
  };

  saveNaviDraft(nextDraft);
  return nextDraft;
}

export function createEmptyNaviDraft(): TradeNaviDraft {
  const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `draft-${Date.now()}`;
  const now = new Date().toISOString();

  return {
    id,
    status: "draft",
    productId: null,
    buyerId: null,
    buyerCompanyName: null,
    buyerContactName: null,
    buyerTel: null,
    buyerEmail: null,
    buyerNote: null,
    buyerPending: true,
    conditions: {
      unitPrice: 0,
      quantity: 1,
      shippingFee: 0,
      handlingFee: 0,
      taxRate: 0.1,
      removalDate: null,
      machineShipmentDate: null,
      machineShipmentType: null,
      documentShipmentDate: null,
      documentShipmentType: null,
      paymentDue: null,
      otherFee1: null,
      otherFee2: null,
      notes: null,
      terms: null,
      productName: null,
      makerName: null,
      location: null,
    },
    createdAt: now,
    updatedAt: now,
  };
}
