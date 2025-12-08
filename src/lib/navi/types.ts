export type NaviStatus = "sent_to_buyer" | "buyer_approved" | "buyer_rejected";

export type AdditionalFee = {
  label: string;
  amount: number;
};

export type TradeConditions = {
  unitPrice: number;
  quantity: number;
  shippingFee: number;
  handlingFee: number;
  taxRate: number;
  removalDate?: string | null;
  machineShipmentDate?: string | null;
  machineShipmentType?: string | null;
  documentShipmentDate?: string | null;
  documentShipmentType?: string | null;
  paymentDue?: string | null;
  otherFee1?: AdditionalFee | null;
  otherFee2?: AdditionalFee | null;
  notes?: string | null;
  terms?: string | null;
  productName?: string | null;
  makerName?: string | null;
  location?: string | null;
};

export type TradeNaviDraft = {
  id: string;
  status: NaviStatus | null;
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
