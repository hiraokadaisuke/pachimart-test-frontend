export type NaviStatus = "draft" | "sent_to_buyer" | "buyer_approved" | "buyer_rejected";

export interface TradeConditions {
  price: number; // 1台あたり価格（税抜）
  quantity: number;
  removalDate?: string;
  shippingDate?: string;
  shippingType?: "prepaid" | "collect" | "pickup";
  documentsShippingDate?: string;
  documentsShippingType?: "prepaid" | "collect" | "included" | "none";
  paymentDueDate?: string;
  freightCost?: number;
  extraFee1Label?: string;
  extraFee1Amount?: number;
  extraFee2Label?: string;
  extraFee2Amount?: number;
  notes?: string;
  terms?: string;
}

export interface TradeNaviDraft {
  id: string; // 一時的なtransactionId
  productId: string;
  buyerId?: string; // 今は未使用でもOK（将来Supabaseとつなぐ前提）
  sellerId?: string;
  status: NaviStatus;
  conditions: TradeConditions;
  createdAt: string;
  updatedAt: string;
}
