import type { SalesInvoiceGroup } from "@/types/salesInvoices";

const STORAGE_KEY = "sales_invoice_groups_v1";

export const loadSalesInvoiceGroups = (): SalesInvoiceGroup[] => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as SalesInvoiceGroup[];
    }
  } catch (error) {
    console.error("Failed to parse sales invoice groups", error);
  }

  return [];
};

export const saveSalesInvoiceGroups = (groups: SalesInvoiceGroup[]): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
};

export const addSalesInvoiceGroup = (group: SalesInvoiceGroup): SalesInvoiceGroup[] => {
  const current = loadSalesInvoiceGroups();
  const next = [group, ...current];
  saveSalesInvoiceGroups(next);
  return next;
};

export const generateSalesInvoiceGroupId = (): string => `S-G-${Date.now()}`;
