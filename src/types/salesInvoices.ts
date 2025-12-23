export type SalesInvoiceItem = {
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
};

export type SalesInvoice = {
  invoiceId: string;
  invoiceType: "vendor" | "hall";
  createdAt: string;
  issuedDate?: string;
  paymentDueDate?: string;
  invoiceOriginalRequired?: boolean;
  vendorName?: string;
  buyerName?: string;
  staff?: string;
  manager?: string;
  inventoryIds?: string[];
  items: SalesInvoiceItem[];
  subtotal?: number;
  tax?: number;
  insurance?: number;
  totalAmount?: number;
  remarks?: string;
};
