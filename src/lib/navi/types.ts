export type NaviStatus = "draft" | "sent_to_buyer" | "buyer_approved" | "buyer_rejected";

export type TradeConditions = {
  unitPrice: number;
  quantity: number;
  shippingFee: number;
  handlingFee: number;
  taxRate: number;
  productName?: string | null;
  makerName?: string | null;
  location?: string | null;
};

export type TradeNaviDraft = {
  id: string;
  status: NaviStatus;
  productId?: string | null;
  buyerId?: string | null;
  buyerCompanyName?: string | null;
  buyerContactName?: string | null;
  buyerTel?: string | null;
  buyerEmail?: string | null;
  buyerNote?: string | null;
  buyerPending?: boolean;
  conditions: TradeConditions;
  createdAt: string;
  updatedAt: string;
};
