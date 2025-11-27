export interface QuoteInput {
  unitPrice: number; // 税抜の1台あたり価格
  quantity: number;
  shippingFee: number;
  handlingFee: number;
  taxRate: number; // 例: 0.1
}

export interface QuoteResult {
  productSubtotal: number;
  shippingFee: number;
  handlingFee: number;
  subtotal: number;
  tax: number;
  total: number;
}

export function calculateQuote(input: QuoteInput): QuoteResult {
  const productSubtotal = input.unitPrice * input.quantity;
  const subtotal = productSubtotal + input.shippingFee + input.handlingFee;
  const tax = Math.floor(subtotal * input.taxRate);
  const total = subtotal + tax;

  return {
    productSubtotal,
    shippingFee: input.shippingFee,
    handlingFee: input.handlingFee,
    subtotal,
    tax,
    total,
  };
}
