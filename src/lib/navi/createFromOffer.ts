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

const SHIPPING_FEE_LABEL = "出庫手数料";

const getRandomDraftId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `draft-${Date.now()}`);

export function createNaviDraftFromOffer(input: OfferInputForNavi): TradeNaviDraft {
  const id = getRandomDraftId();

  const conditions: TradeConditions = {
    price: input.unitPrice,
    quantity: input.quantity,
    freightCost: input.quote.shippingFee,
    extraFee1Label: SHIPPING_FEE_LABEL,
    extraFee1Amount: input.quote.handlingFee,
    // 他の項目は後でNavi画面で編集する想定なので空でOK
  };

  const now = new Date().toISOString();

  return {
    id,
    productId: input.productId,
    status: "draft",
    conditions,
    createdAt: now,
    updatedAt: now,
  };
}
