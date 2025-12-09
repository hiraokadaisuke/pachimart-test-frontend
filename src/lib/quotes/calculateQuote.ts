import { type AdditionalFee } from "@/lib/navi/types";

export interface QuoteInput {
  unitPrice: number; // 税抜の1台あたり価格
  quantity: number;
  shippingFee: number;
  handlingFee: number;
  taxRate: number; // 例: 0.1
  cardboardFee?: AdditionalFee | number | null;
  nailSheetFee?: AdditionalFee | number | null;
  insuranceFee?: AdditionalFee | number | null;
}

export interface QuoteResult {
  productSubtotal: number;
  shippingFee: number;
  handlingFee: number;
  cardboardFee: number;
  nailSheetFee: number;
  insuranceFee: number;
  additionalFeesTotal: number;
  subtotal: number;
  tax: number;
  total: number;
}

export function calculateQuote(input: QuoteInput): QuoteResult {
  const getFeeAmount = (fee?: AdditionalFee | number | null) => {
    if (typeof fee === "number") return fee;
    if (!fee) return 0;
    return fee.amount;
  };

  const cardboardFee = getFeeAmount(input.cardboardFee);
  const nailSheetFee = getFeeAmount(input.nailSheetFee);
  const insuranceFee = getFeeAmount(input.insuranceFee);
  const additionalFeesTotal = cardboardFee + nailSheetFee + insuranceFee;
  const productSubtotal = input.unitPrice * input.quantity;
  const subtotal = productSubtotal + input.shippingFee + input.handlingFee + additionalFeesTotal;
  const tax = Math.floor(subtotal * input.taxRate);
  const total = subtotal + tax;

  return {
    productSubtotal,
    shippingFee: input.shippingFee,
    handlingFee: input.handlingFee,
    cardboardFee,
    nailSheetFee,
    insuranceFee,
    additionalFeesTotal,
    subtotal,
    tax,
    total,
  };
}
