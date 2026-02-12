import type { PurchaseInvoice, PurchaseInvoiceItem } from "@/types/purchaseInvoices";

const STORAGE_KEY = "purchase_invoices_v1";

const normalizePurchaseItem = (invoiceId: string, item: PurchaseInvoiceItem, index: number): PurchaseInvoiceItem => ({
  ...item,
  itemId: item.itemId ?? `${invoiceId}-item-${index + 1}`,
  sortOrder: item.sortOrder ?? index,
});

const sortPurchaseItems = (items: PurchaseInvoiceItem[]): PurchaseInvoiceItem[] =>
  [...items].sort((a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER));

const normalizePurchaseInvoice = (invoice: PurchaseInvoice): PurchaseInvoice => {
  const normalizedItems = sortPurchaseItems((invoice.items ?? []).map((item, index) => normalizePurchaseItem(invoice.invoiceId, item, index))).map(
    (item, index) => ({
      ...item,
      sortOrder: index,
    }),
  );

  return {
    ...invoice,
    items: normalizedItems,
  };
};

export const loadPurchaseInvoices = (): PurchaseInvoice[] => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return (parsed as PurchaseInvoice[]).map(normalizePurchaseInvoice);
    }
  } catch (error) {
    console.error("Failed to parse purchase invoices", error);
  }

  return [];
};

export const savePurchaseInvoices = (invoices: PurchaseInvoice[]): void => {
  if (typeof window === "undefined") return;
  const normalized = invoices.map(normalizePurchaseInvoice);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
};

export const addPurchaseInvoice = (invoice: PurchaseInvoice): void => {
  const current = loadPurchaseInvoices();
  savePurchaseInvoices([normalizePurchaseInvoice(invoice), ...current]);
};

export const upsertPurchaseInvoice = (invoice: PurchaseInvoice): void => {
  const current = loadPurchaseInvoices();
  const next = normalizePurchaseInvoice(invoice);
  const map = new Map(current.map((entry) => [entry.invoiceId, entry]));
  map.set(invoice.invoiceId, next);
  savePurchaseInvoices(Array.from(map.values()));
};

export const deletePurchaseInvoices = (invoiceIds: string[]): PurchaseInvoice[] => {
  const current = loadPurchaseInvoices();
  if (invoiceIds.length === 0) return current;
  const targets = new Set(invoiceIds);
  const remaining = current.filter((invoice) => !targets.has(invoice.invoiceId));
  savePurchaseInvoices(remaining);
  return remaining;
};

export const generateInvoiceId = (type: PurchaseInvoice["invoiceType"]): string => {
  const prefix = type === "vendor" ? "V" : "H";
  return `${prefix}-${Date.now()}`;
};
