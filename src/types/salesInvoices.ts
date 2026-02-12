import type { SerialInputRow } from "@/lib/serialInputStorage";

export type SalesInvoiceItem = {
  itemId?: string;
  sortOrder?: number;
  inventoryId?: string;
  maker?: string;
  productName?: string;
  type?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  remainingDebt?: number;
  applicationPrefecture?: string;
  applicationDate?: string;
  note?: string;
  selectedSerialIndexes?: number[];
  selectedSerialRows?: SerialInputRow[];
};

export type SalesInvoice = {
  invoiceId: string;
  invoiceType: "vendor" | "hall";
  createdAt: string;
  issuedDate?: string;
  paymentDueDate?: string;
  paymentMethod?: string;
  paymentDate?: string;
  paymentAmount?: number;
  transferDate?: string;
  invoiceOriginalRequired?: boolean;
  vendorName?: string;
  buyerName?: string;
  salesToId?: string;
  staff?: string;
  manager?: string;
  mergedGroupId?: string;
  inventoryIds?: string[];
  items: SalesInvoiceItem[];
  subtotal?: number;
  tax?: number;
  insurance?: number;
  totalAmount?: number;
  introductionStore?: string;
  installationDate?: string;
  openingDate?: string;
  documentArrivalDate?: string;
  storageLocation?: string;
  remarks?: string;
  isReceived?: boolean;
  receivedAt?: string;
  receivedBank?: string;
};

export type SalesInvoiceGroup = {
  id: string;
  salesToId?: string;
  salesToName: string;
  invoiceIds: string[];
  transferDate?: string;
  createdAt: string;
  updatedAt: string;
};
