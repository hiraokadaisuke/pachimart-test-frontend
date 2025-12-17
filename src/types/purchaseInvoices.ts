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
  extra?: Record<string, string | number | undefined>;
  note?: string;
};

export type PurchaseInvoice = {
  invoiceId: string;
  invoiceType: "vendor" | "hall";
  createdAt: string;
  issuedDate?: string;
  partnerName?: string;
  inventoryIds: string[];
  items: PurchaseInvoiceItem[];
  totalAmount?: number;
};
