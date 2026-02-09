"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { loadInventoryRecords, type InventoryRecord } from "@/lib/demo-data/demoInventory";
import { loadMasterData } from "@/lib/demo-data/demoMasterData";
import { loadSalesInvoices } from "@/lib/demo-data/salesInvoices";
import type { SalesInvoice, SalesInvoiceItem } from "@/types/salesInvoices";

const PLACEHOLDER_INVENTORY: InventoryRecord = {
  id: "INV-PRINT-DEMO",
  createdAt: new Date().toISOString(),
  status: "倉庫",
  supplier: "◯◯倉庫",
  supplierCorporate: "◯◯商事",
  supplierBranch: "第一倉庫",
  supplierPhone: "03-0000-0000",
  supplierFax: "03-0000-0001",
  stockInDate: new Date().toISOString(),
};

const PLACEHOLDER_INVOICE: SalesInvoice = {
  invoiceId: "S-V-PRINT",
  invoiceType: "vendor",
  createdAt: new Date().toISOString(),
  vendorName: "◯◯商事",
  staff: "デモ担当",
  items: [
    {
      inventoryId: PLACEHOLDER_INVENTORY.id,
      maker: "メーカー名",
      productName: "商品名",
      type: "タイプ",
      quantity: 1,
      unitPrice: 500000,
      amount: 500000,
      note: "―",
    },
  ],
  subtotal: 500000,
  tax: 50000,
  totalAmount: 550000,
  paymentDueDate: new Date().toISOString(),
  invoiceOriginalRequired: true,
};

const formatFullDate = (value?: string, fallbackToday = false): string => {
  if (!value) {
    if (!fallbackToday) return "";
    const today = new Date();
    return `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  return `${year}年${month}月${day}日`;
};

const formatMonthDay = (value?: string): string => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  return `${month}月${day}日`;
};

const formatNumber = (value?: number): string => {
  if (value == null || Number.isNaN(value)) return "";
  return value.toLocaleString("ja-JP");
};

export const useSalesInvoicePrintData = (invoiceId: string) => {
  const [invoice, setInvoice] = useState<SalesInvoice>(PLACEHOLDER_INVOICE);
  const [inventories, setInventories] = useState<InventoryRecord[]>([PLACEHOLDER_INVENTORY]);
  const masterData = useMemo(() => loadMasterData(), []);

  useEffect(() => {
    const invoices = loadSalesInvoices();
    const target = invoices.find((entry) => entry.invoiceId === invoiceId);
    if (target) {
      setInvoice(target);
    } else {
      setInvoice((prev) => ({ ...prev, invoiceId }));
    }
  }, [invoiceId]);

  useEffect(() => {
    const records = loadInventoryRecords();
    if (records.length > 0) {
      setInventories(records);
    }
  }, []);

  const items = useMemo<SalesInvoiceItem[]>(() => (invoice.items?.length ? invoice.items : PLACEHOLDER_INVOICE.items), [invoice.items]);

  const primaryInventory = useMemo<InventoryRecord | null>(() => {
    if (!invoice) return inventories[0] ?? null;
    const fromInvoice = invoice.inventoryIds
      ?.map((id) => inventories.find((entry) => entry.id === id))
      .find((entry) => Boolean(entry));
    return fromInvoice ?? inventories[0] ?? null;
  }, [invoice, inventories]);

  const recipientName = useMemo(() => {
    const fromInvoice = invoice.vendorName || invoice.buyerName;
    const fromInventory =
      primaryInventory?.supplierCorporate || primaryInventory?.supplierBranch || primaryInventory?.supplier;
    return (fromInvoice || fromInventory || "〇〇商事").trim();
  }, [invoice.vendorName, invoice.buyerName, primaryInventory]);

  const sellerInvoiceNumber = masterData.companyProfile.invoiceNumber || "―";
  const buyerInvoiceNumber = useMemo(() => {
    const supplier = masterData.suppliers.find((entry) => entry.corporateName === recipientName);
    return supplier?.invoiceNumber || "―";
  }, [masterData.suppliers, recipientName]);

  const staffName = invoice?.staff || primaryInventory?.staff || "担当者";
  const manager = invoice?.manager || "経理担当";

  const issuedDateLabel = formatFullDate(invoice?.issuedDate || invoice?.createdAt, true);
  const paymentDueDateLabel = formatMonthDay(invoice?.paymentDueDate || invoice?.issuedDate || invoice?.createdAt);
  const invoiceOriginalRequiredLabel = invoice?.invoiceOriginalRequired === false ? "不要" : "要";

  const subtotal = useMemo(
    () =>
      invoice?.subtotal ??
      items.reduce((sum, item) => {
        const amount = item.amount ?? (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
        return sum + (Number.isNaN(amount) ? 0 : amount);
      }, 0),
    [invoice?.subtotal, items],
  );

  const tax = invoice?.tax ?? Math.floor(subtotal * 0.1);
  const grandTotal = invoice?.totalAmount ?? subtotal + tax + Number(invoice?.insurance || 0);
  const shippingInsurance = Number(invoice?.insurance || 0);

  const detailRows = useMemo(() => {
    const rows = [...(items.length > 0 ? items : PLACEHOLDER_INVOICE.items)];
    while (rows.length < 5) {
      rows.push({
        inventoryId: "placeholder",
        maker: "",
        productName: "",
        type: "",
        quantity: 0,
        unitPrice: 0,
        amount: 0,
        note: "",
      });
    }
    return rows;
  }, [items]);

  const formatItemRow = useCallback(
    (item: SalesInvoiceItem) => ({
      maker: item.maker || "",
      productName: item.productName || "",
      type: item.type || "",
      quantity: formatNumber(item.quantity),
      unitPrice: formatNumber(item.unitPrice),
      amount: formatNumber(item.amount ?? (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)),
      note: item.note || "",
    }),
    [],
  );

  const formattedRows = useMemo(() => detailRows.map((row) => formatItemRow(row)), [detailRows, formatItemRow]);

  return {
    invoice,
    recipientName,
    staffName,
    manager,
    issuedDateLabel,
    paymentDueDateLabel,
    invoiceOriginalRequiredLabel,
    sellerInvoiceNumber,
    buyerInvoiceNumber,
    subtotal,
    tax,
    shippingInsurance,
    grandTotal,
    items: formattedRows,
    rawItems: items,
  };
};
