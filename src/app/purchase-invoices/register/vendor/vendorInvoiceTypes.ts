export type DraftRow = {
  productName: string;
  quantity: number;
  unitPrice: number;
  remainingDebt: string;
  applicationRoute: string;
  applicationDate: string;
  note: string;
};

export type InvoiceRow = DraftRow & {
  id: string;
  inventoryId: string;
  maker?: string;
  machineName?: string;
  type?: string;
};

export type FormState = {
  issuedDate: string;
  staff: string;
  supplierName: string;
  supplierAddress: string;
  tel: string;
  fax: string;
  invoiceNumber: string;
  paymentDate: string;
  arrivalDate: string;
  memo: string;
  salesDestination: string;
  invoiceOriginal: string;
  shippingInsurance: string;
};
