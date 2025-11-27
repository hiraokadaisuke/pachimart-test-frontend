import { TradeNaviDraft } from "./types";

const STORAGE_KEY_PREFIX = "navi_draft_";

function clearDraftStorage() {
  if (typeof window === "undefined") return;

  const keysToRemove: string[] = [];

  for (let i = 0; i < window.sessionStorage.length; i += 1) {
    const key = window.sessionStorage.key(i);
    if (!key || !key.startsWith(STORAGE_KEY_PREFIX)) continue;

    keysToRemove.push(key);
  }

  keysToRemove.forEach((key) => window.sessionStorage.removeItem(key));
}

if (typeof window !== "undefined") {
  clearDraftStorage();
}

export function saveNaviDraft(_draft: TradeNaviDraft) {
  clearDraftStorage();
}

export const saveNavi = saveNaviDraft;

export function loadNaviDraft(id: string): TradeNaviDraft | null {
  clearDraftStorage();
  return null;
}

export const loadNavi = loadNaviDraft;

export function loadAllNavis(): TradeNaviDraft[] {
  clearDraftStorage();
  return [];
}

export function updateNaviStatus(id: string, status: TradeNaviDraft["status"]): TradeNaviDraft | null {
  if (typeof window === "undefined") return null;
  clearDraftStorage();
  return null;
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
