export type InventoryStatusOption = "倉庫" | "出品中" | "売却済";

export type SimpleInventory = {
  id: string;
  createdAt: string;
  maker?: string;
  machineName?: string;
  type?: string;
  quantity?: number;
  unitPrice?: number;
  supplier?: string;
  status: InventoryStatusOption;
};

export type PurchaseInvoiceItem = {
  inventoryId: string;
  maker?: string;
  machineName?: string;
  type?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  storeName?: string;
  supplierName?: string;
  supplierPostalCode?: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierFax?: string;
  remainingDebt?: number;
  rowType?: "machine" | "fee";
  extra?: Record<string, string | number | undefined>;
  note?: string;
};

export type AdditionalCostItem = {
  id: string;
  label: "手数料" | "保険料" | "その他" | "書類代";
  amount: number;
};

export type PurchaseInvoice = {
  invoiceId: string;
  invoiceType: "vendor" | "hall";
  createdAt: string;
  issuedDate?: string;
  partnerName?: string;
  staff?: string;
  inventoryIds: string[];
  items: PurchaseInvoiceItem[];
  totalAmount?: number;
  extraCosts?: AdditionalCostItem[];
  formInput?: Record<string, string>;
  displayTitle?: string;
};
