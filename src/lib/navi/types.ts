export type NaviStatus = "sent_to_buyer" | "buyer_approved" | "buyer_rejected";

export type AdditionalFee = {
  label: string;
  amount: number;
};

export type ManualNaviItem = {
  id: string;
  gameType: "pachinko" | "slot";
  bodyType: "本体" | "枠のみ" | "セルのみ";
  maker: string;
  modelName: string;
  frameColor?: string | null;
  quantity: number;
  unitPrice?: number | null;
  receiveMethod?: "発送" | "引取" | "その他";
  removalDate?: string | null;
  removalCompleted?: boolean;
  note?: string | null;
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
  cardboardFee?: AdditionalFee | null;
  nailSheetFee?: AdditionalFee | null;
  insuranceFee?: AdditionalFee | null;
  notes?: string | null;
  terms?: string | null;
  memo?: string | null;
  handler?: string | null;
  productName?: string | null;
  makerName?: string | null;
  location?: string | null;
};

export type NaviDraft = {
  id: string;
  ownerUserId: string;
  status: NaviStatus | null;
  productId?: string | null;
  buyerId?: string | null;
  buyerCompanyName?: string | null;
  buyerContactName?: string | null;
  buyerAddress?: string | null;
  buyerTel?: string | null;
  buyerEmail?: string | null;
  buyerNote?: string | null;
  buyerPending?: boolean;
  items?: ManualNaviItem[];
  conditions: TradeConditions;
  createdAt: string;
  updatedAt: string;
};
