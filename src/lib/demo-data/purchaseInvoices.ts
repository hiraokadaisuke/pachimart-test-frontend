import type { PurchaseInvoice } from "@/types/purchaseInvoices";

const STORAGE_KEY = "purchase_invoices_v1";

export const loadPurchaseInvoices = (): PurchaseInvoice[] => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as PurchaseInvoice[];
    }
  } catch (error) {
    console.error("Failed to parse purchase invoices", error);
  }

  return [];
};

export const savePurchaseInvoices = (invoices: PurchaseInvoice[]): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
};

export const addPurchaseInvoice = (invoice: PurchaseInvoice): void => {
  const current = loadPurchaseInvoices();
  savePurchaseInvoices([invoice, ...current]);
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
