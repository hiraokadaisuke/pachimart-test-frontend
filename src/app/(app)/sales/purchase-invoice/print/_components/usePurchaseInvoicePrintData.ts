"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  loadInventoryRecords,
  type InventoryRecord,
} from "@/lib/demo-data/demoInventory";
import { loadMasterData } from "@/lib/demo-data/demoMasterData";
import { loadPurchaseInvoices } from "@/lib/demo-data/purchaseInvoices";
import type { PurchaseInvoice, PurchaseInvoiceItem } from "@/types/purchaseInvoices";

const PLACEHOLDER_INVENTORY: InventoryRecord = {
  id: "INV-PLACEHOLDER",
  createdAt: new Date().toISOString(),
  status: "倉庫",
  supplier: "◯◯◯◯",
  supplierCorporate: "◯◯◯◯株式会社",
  supplierBranch: "◯◯店",
  supplierPhone: "03-0000-0000",
  supplierFax: "03-0000-0001",
  stockInDate: new Date().toISOString(),
};

const PLACEHOLDER_INVOICE: PurchaseInvoice = {
  invoiceId: "INV-PRINT-DEMO",
  invoiceType: "vendor",
  createdAt: new Date().toISOString(),
  partnerName: "◯◯◯◯株式会社",
  staff: "デモ担当",
  inventoryIds: [PLACEHOLDER_INVENTORY.id],
  items: [
    {
      inventoryId: PLACEHOLDER_INVENTORY.id,
      maker: "メーカー名",
      machineName: "商品名",
      type: "タイプ",
      quantity: 1,
      unitPrice: 500000,
      amount: 500000,
      storeName: "店舗名",
      supplierName: "◯◯◯◯株式会社",
      extra: { removalDate: new Date().toISOString() },
      remainingDebt: 0,
    },
  ],
  totalAmount: 500000,
  formInput: {
    paymentDate: new Date().toISOString(),
    warehousingDate: new Date().toISOString(),
  },
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

const formatNumber = (value?: number): string => {
  if (value == null || Number.isNaN(value)) return "";
  return value.toLocaleString("ja-JP");
};

export const usePurchaseInvoicePrintData = (invoiceId: string) => {
  const [invoice, setInvoice] = useState<PurchaseInvoice>(PLACEHOLDER_INVOICE);
  const [inventories, setInventories] = useState<InventoryRecord[]>([PLACEHOLDER_INVENTORY]);
  const masterData = useMemo(() => loadMasterData(), []);

  useEffect(() => {
    const invoices = loadPurchaseInvoices();
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

  const items = useMemo<PurchaseInvoiceItem[]>(() => invoice.items?.length ? invoice.items : PLACEHOLDER_INVOICE.items, [invoice.items]);

  const primaryInventory = useMemo<InventoryRecord | null>(() => {
    if (!invoice) return inventories[0] ?? null;
    const fromInvoice = invoice.inventoryIds
      .map((id) => inventories.find((entry) => entry.id === id))
      .find((entry) => Boolean(entry));
    return fromInvoice ?? inventories[0] ?? null;
  }, [invoice, inventories]);

  const supplierName = useMemo(() => {
    const fromItem = items[0]?.supplierName || items[0]?.storeName;
    const fromInvoice = invoice?.partnerName;
    const fromInventory =
      primaryInventory?.supplierCorporate || primaryInventory?.supplierBranch || primaryInventory?.supplier;
    return (fromItem || fromInvoice || fromInventory || "◯◯◯◯").trim();
  }, [invoice?.partnerName, items, primaryInventory]);

  const branchName = useMemo(() => {
    const fromItem = items[0]?.storeName;
    const fromInventory = primaryInventory?.supplierBranch;
    return (fromItem || fromInventory || "").trim();
  }, [items, primaryInventory]);

  const staffName = invoice?.staff || primaryInventory?.buyerStaff || "担当者";

  const recipientLine = branchName ? `${supplierName} ${branchName} 御中` : `${supplierName} 御中`;
  const headerContractPartner = branchName ? `${supplierName} ${branchName}` : supplierName;

  const sellerInvoiceNumber = useMemo(() => {
    const supplier = masterData.suppliers.find((entry) => entry.corporateName === supplierName);
    return supplier?.invoiceNumber || "―";
  }, [masterData.suppliers, supplierName]);

  const buyerInvoiceNumber = masterData.companyProfile.invoiceNumber || "―";

  const paymentDateLabel = formatFullDate(invoice?.formInput?.paymentDate);
  const warehousingDateLabel = formatFullDate(invoice?.formInput?.warehousingDate);
  const issuedDateLabel = formatFullDate(invoice?.issuedDate || invoice?.createdAt, true);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const amount = item.amount ?? (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
        return sum + (Number.isNaN(amount) ? 0 : amount);
      }, 0),
    [items],
  );
  const tax = Math.floor(subtotal * 0.1);
  const shippingInsurance = Number(invoice?.formInput?.shippingInsurance || 0);
  const extraCostTotal = (invoice?.extraCosts ?? []).reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0,
  );
  const computedGrandTotal = subtotal + tax + shippingInsurance + extraCostTotal;
  const grandTotal =
    invoice?.totalAmount && invoice.totalAmount >= computedGrandTotal
      ? invoice.totalAmount
      : computedGrandTotal;

  const findInventoryForItem = useCallback(
    (item: PurchaseInvoiceItem): InventoryRecord | null => {
      return inventories.find((entry) => entry.id === item.inventoryId) ?? primaryInventory ?? null;
    },
    [inventories, primaryInventory],
  );

  const buildDetailRow = useCallback(
    (item?: PurchaseInvoiceItem) => {
      const targetItem = item ?? items[0];
      const inventory = targetItem ? findInventoryForItem(targetItem) : primaryInventory;
      const removalDate = formatFullDate(
        (targetItem?.extra as { removalDate?: string } | undefined)?.removalDate ||
          inventory?.removalDate ||
          inventory?.removeDate,
      );
      return {
        removalDate,
        storeName: targetItem?.storeName || inventory?.supplierBranch || inventory?.warehouse || "",
        maker: targetItem?.maker || inventory?.maker || "",
        machineName: targetItem?.machineName || inventory?.machineName || inventory?.model || "",
        type: targetItem?.type || inventory?.type || "",
        quantity: formatNumber(targetItem?.quantity ?? inventory?.quantity),
        unitPrice: formatNumber(targetItem?.unitPrice ?? inventory?.unitPrice),
        amount: formatNumber(
          targetItem?.amount ?? (Number(targetItem?.quantity) || 0) * (Number(targetItem?.unitPrice) || 0),
        ),
        remainingDebt: formatNumber(targetItem?.remainingDebt ?? inventory?.remainingDebt),
        note: targetItem?.note || inventory?.note || "",
      };
    },
    [findInventoryForItem, items, primaryInventory],
  );

  const detailRows = useMemo(() => {
    if (items.length === 0) {
      return [
        {
          removalDate: "",
          storeName: "",
          maker: "",
          machineName: "",
          type: "",
          quantity: "",
          unitPrice: "",
          amount: "",
          remainingDebt: "",
          note: "",
        },
      ];
    }
    return items.map((item) => buildDetailRow(item));
  }, [buildDetailRow, items]);

  return {
    invoice,
    items,
    primaryInventory,
    supplierName,
    branchName,
    sellerInvoiceNumber,
    buyerInvoiceNumber,
    staffName,
    recipientLine,
    headerContractPartner,
    paymentDateLabel,
    warehousingDateLabel,
    issuedDateLabel,
    subtotal,
    tax,
    grandTotal,
    detailRows,
  };
};
