import type { SalesInvoice } from "@/types/salesInvoices";

const STORAGE_KEY = "sales_invoices_v1";

const readStorage = (): SalesInvoice[] => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as SalesInvoice[];
  } catch (error) {
    console.error("Failed to parse sales invoices", error);
  }
  return [];
};

export const loadSalesInvoices = (): SalesInvoice[] => readStorage();

export const saveSalesInvoices = (invoices: SalesInvoice[]): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
};

export const addSalesInvoice = (invoice: SalesInvoice): void => {
  const current = loadSalesInvoices();
  saveSalesInvoices([invoice, ...current]);
};

export const deleteSalesInvoices = (invoiceIds: string[]): SalesInvoice[] => {
  const current = loadSalesInvoices();
  if (invoiceIds.length === 0) return current;
  const targets = new Set(invoiceIds);
  const remaining = current.filter((invoice) => !targets.has(invoice.invoiceId));
  saveSalesInvoices(remaining);
  return remaining;
};

export const generateSalesInvoiceId = (): string => {
  return `S-${Date.now()}`;
};
