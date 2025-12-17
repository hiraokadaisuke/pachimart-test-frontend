export type TradeStatus =
  | "DRAFT"
  | "SENT"
  | "APPROVAL_REQUIRED"
  | "APPROVED"
  | "PAYMENT_REQUIRED"
  | "CONFIRM_REQUIRED";

export type CompanyProfile = {
  userId?: string;
  companyName: string;
  address?: string;
  tel?: string;
  fax?: string;
  contactName?: string;
};

export type StatementItem = {
  lineId: string;
  maker?: string;
  itemName: string;
  category?: string;
  qty?: number;
  unitPrice?: number;
  amount?: number;
  note?: string;
  isTaxable?: boolean;
};

export type ShippingInfo = {
  companyName?: string;
  zip?: string;
  address?: string;
  tel?: string;
  personName?: string;
};

export type BuyerContact = {
  contactId: string;
  name: string;
};

export type TradeRecord = {
  id: string;
  status: TradeStatus;
  createdAt?: string;
  updatedAt?: string;
  contractDate?: string;
  seller: CompanyProfile;
  buyer: CompanyProfile;
  items: StatementItem[];
  taxRate?: number;
  remarks?: string;
  termsText?: string;
  shipping: ShippingInfo;
  buyerContacts?: BuyerContact[];
};
