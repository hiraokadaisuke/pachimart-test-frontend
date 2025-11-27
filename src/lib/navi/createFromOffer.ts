import { QuoteResult } from "@/lib/quotes/calculateQuote";

import { TradeConditions, TradeNaviDraft } from "./types";

export interface OfferInputForNavi {
  productId: string;
  quantity: number;
  unitPrice: number;
  selfPickup: boolean;
  deliveryWarehouseId: string;
  quote: QuoteResult;
}

const getRandomDraftId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `draft-${Date.now()}`);

export function createNaviDraftFromOffer(input: OfferInputForNavi): TradeNaviDraft {
  const id = getRandomDraftId();

  const conditions: TradeConditions = {
    unitPrice: input.unitPrice,
    quantity: input.quantity,
    shippingFee: input.quote.shippingFee,
    handlingFee: input.quote.handlingFee,
    taxRate: 0.1,
    productName: null,
    makerName: null,
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
    // 他の項目は後でNavi画面で編集する想定なので空でOK
  };

  const now = new Date().toISOString();

  return {
    id,
    productId: input.productId,
    status: "draft",
    buyerPending: true,
    conditions,
    createdAt: now,
    updatedAt: now,
  };
}
