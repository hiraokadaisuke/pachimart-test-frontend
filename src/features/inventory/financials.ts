import type { PaymentRecordStatus, PaymentSourceType, Prisma, RecordPaymentStatus } from "@prisma/client";
import { calculateRealGrossProfit } from "./real-profit";

export const DEFAULT_PAGE_SIZE = 50;

export const escapeCsvValue = (value: string | number | null | undefined) => {
  if (value == null) return "";
  const text = String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
};

export const formatFinancialCsvRows = (headers: string[], rows: Array<Array<string | number | null | undefined>>) => {
  const body = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
  return `\uFEFF${body}`;
};

export const summarizePurchaseRecords = (rows: Array<{ totalCost: number; paymentStatus: RecordPaymentStatus }>) =>
  rows.filter((r) => r.paymentStatus !== "CANCELED").reduce((sum, r) => sum + r.totalCost, 0);

export const summarizeSalesRecords = (rows: Array<{ totalSales: number; paymentStatus: RecordPaymentStatus }>) =>
  rows.filter((r) => r.paymentStatus !== "CANCELED").reduce((sum, r) => sum + r.totalSales, 0);

export const summarizePaymentRecords = (rows: Array<{ amount: number; status: PaymentRecordStatus; sourceType: PaymentSourceType }>) => {
  const valid = rows.filter((row) => row.status !== "CANCELED");
  const unpaidAmount = valid.filter((row) => row.sourceType === "PURCHASE_RECORD" && row.status === "PLANNED").reduce((sum, row) => sum + row.amount, 0);
  const unreceivedAmount = valid.filter((row) => row.sourceType === "SALES_RECORD" && row.status === "PLANNED").reduce((sum, row) => sum + row.amount, 0);
  return { unpaidAmount, unreceivedAmount };
};

type ProfitRowInput = {
  id: string; makerName: string | null; modelName: string; quantityOnHand: number; inventoryStatus: string;
  purchaseRecords: Array<{ totalCost: number; paymentStatus: RecordPaymentStatus; shippingCost: number; otherCost: number }>;
  salesRecords: Array<{ totalSales: number; paymentStatus: RecordPaymentStatus; shippingFee: number; platformFee: number; otherFee: number }>;
  paymentRecords: Array<{ sourceType: PaymentSourceType; status: PaymentRecordStatus }>;
};

export const calculateInventoryProfitRows = (items: ProfitRowInput[]) => items.map((item) => {
  const purchaseActive = item.purchaseRecords.filter((r) => r.paymentStatus !== "CANCELED");
  const salesActive = item.salesRecords.filter((r) => r.paymentStatus !== "CANCELED");
  const totalCost = purchaseActive.reduce((s, r) => s + r.totalCost, 0);
  const totalSales = salesActive.reduce((s, r) => s + r.totalSales, 0);
  const purchaseSideCosts = purchaseActive.reduce((s, r) => s + r.shippingCost + r.otherCost, 0);
  const salesSideFees = salesActive.reduce((s, r) => s + r.shippingFee + r.platformFee + r.otherFee, 0);
  const profit = calculateRealGrossProfit({ totalSales, totalCost, purchaseSideCosts, salesSideFees });
  return {
    ...item,
    totalCost,
    totalSales,
    totalFees: purchaseSideCosts + salesSideFees,
    realGrossProfit: profit.realGrossProfit,
    profitRate: profit.profitRate,
    paymentState: item.paymentRecords.some((p) => p.sourceType === "PURCHASE_RECORD" && p.status === "PLANNED") ? "未払いあり" : "支払済/なし",
    receiptState: item.paymentRecords.some((p) => p.sourceType === "SALES_RECORD" && p.status === "PLANNED") ? "未入金あり" : "入金済/なし",
  };
});

export const summarizeInventoryFinancials = (input: {
  purchases: Array<{ totalCost: number; paymentStatus: RecordPaymentStatus }>;
  sales: Array<{ totalSales: number; paymentStatus: RecordPaymentStatus }>;
  payments: Array<{ amount: number; status: PaymentRecordStatus; sourceType: PaymentSourceType }>;
}) => {
  const purchaseTotal = summarizePurchaseRecords(input.purchases);
  const salesTotal = summarizeSalesRecords(input.sales);
  const canceledCount = input.purchases.filter((r) => r.paymentStatus === "CANCELED").length + input.sales.filter((r) => r.paymentStatus === "CANCELED").length;
  const payment = summarizePaymentRecords(input.payments);
  const realGrossProfit = salesTotal - purchaseTotal;
  return { purchaseTotal, salesTotal, realGrossProfit, grossMarginRate: salesTotal > 0 ? Math.round((realGrossProfit / salesTotal) * 1000) / 10 : null, canceledCount, ...payment };
};

export const parsePagination = (searchParams: Record<string, string | string[] | undefined>) => {
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const pageSize = Math.max(1, Math.min(200, Number(searchParams.pageSize ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
};
