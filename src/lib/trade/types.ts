import { TodoItem } from "@/lib/todo/types";

export type TradeStatus =
  | "APPROVAL_REQUIRED"
  | "PAYMENT_REQUIRED"
  | "CONFIRM_REQUIRED"
  | "COMPLETED"
  | "CANCELED";

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
  naviId?: number;
  status: TradeStatus;
  sellerUserId: string;
  buyerUserId: string;
  sellerName: string;
  buyerName: string;
  createdAt?: string;
  updatedAt?: string;
  contractDate?: string;
  paymentDate?: string;
  paymentMethod?: string;
  paymentAmount?: number;
  completedAt?: string;
  canceledAt?: string;
  canceledBy?: "buyer" | "seller";
  paymentTerms?: string;
  makerName?: string;
  itemName?: string;
  category?: "pachinko" | "slot" | "others";
  quantity?: number;
  totalAmount?: number;
  shipmentDate?: string;
  receiveMethod?: string;
  shippingMethod?: string;
  documentSentDate?: string;
  documentReceivedDate?: string;
  handlerName?: string;
  buyerContactName?: string;
  buyerShippingAddress?: ShippingInfo;
  seller: CompanyProfile;
  buyer: CompanyProfile;
  todos: TodoItem[];
  items: StatementItem[];
  taxRate?: number;
  remarks?: string;
  termsText?: string;
  shipping: ShippingInfo;
  buyerContacts?: BuyerContact[];
};
