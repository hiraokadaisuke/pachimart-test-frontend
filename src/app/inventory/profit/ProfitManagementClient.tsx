"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { formatCurrency, formatDate, loadInventoryRecords } from "@/lib/demo-data/demoInventory";
import { loadPurchaseInvoices, savePurchaseInvoices } from "@/lib/demo-data/purchaseInvoices";
import { loadAllSalesInvoices, upsertSalesInvoices } from "@/lib/demo-data/salesInvoices";
import type { InventoryRecord } from "@/lib/demo-data/demoInventory";
import type { PurchaseInvoice } from "@/types/purchaseInvoices";
import type { SalesInvoice } from "@/types/salesInvoices";
import SubTabs from "@/components/ui/SubTabs";

const labelCellClass = "bg-slate-100 text-center font-semibold text-slate-800";
const borderCell = "border border-gray-300";
const inputCellStyles =
  "w-full rounded-none border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400";

const resolvePurchaseTotal = (invoice: PurchaseInvoice): number => {
  if (invoice.totalAmount != null) return invoice.totalAmount;
  const itemTotal = (invoice.items ?? []).reduce((sum, item) => {
    const amount = item.amount ?? (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    return sum + (Number.isNaN(amount) ? 0 : amount);
  }, 0);
  const extraTotal = (invoice.extraCosts ?? []).reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0);
  return itemTotal + extraTotal;
};

const resolveSalesSubtotal = (invoice: SalesInvoice): number => {
  if (invoice.subtotal != null) return invoice.subtotal;
  return (invoice.items ?? []).reduce((sum, item) => {
    const amount = item.amount ?? (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    return sum + (Number.isNaN(amount) ? 0 : amount);
  }, 0);
};

const resolveSalesTax = (invoice: SalesInvoice): number => {
  if (invoice.tax != null) return invoice.tax;
  const subtotal = resolveSalesSubtotal(invoice);
  const rate = invoice.invoiceType === "hall" ? 0.05 : 0.1;
  return Math.floor(subtotal * rate);
};

const resolveSalesTotal = (invoice: SalesInvoice): number => {
  if (invoice.totalAmount != null) return invoice.totalAmount;
  const subtotal = resolveSalesSubtotal(invoice);
  const tax = resolveSalesTax(invoice);
  const insurance = Number(invoice.insurance || 0);
  return subtotal + tax + insurance;
};

const resolveInvoiceInventoryIds = (invoice: SalesInvoice) =>
  Array.from(
    new Set(
      [
        ...(invoice.inventoryIds ?? []),
        ...(invoice.items ?? [])
          .map((item) => item.inventoryId)
          .filter((id): id is string => Boolean(id)),
      ],
    ),
  );

const buildModelSummary = (items: Array<{ productName?: string; machineName?: string }>) => {
  const names = items
    .map((item) => (item.productName ?? item.machineName ?? "").trim())
    .filter((name) => name !== "");
  if (names.length === 0) return "-";
  const unique = Array.from(new Set(names));
  return unique.length > 1 ? `${unique[0]} + 他` : unique[0];
};

const isPaidInvoice = (invoice: PurchaseInvoice) => Boolean(invoice.isPaid || invoice.paidAt);
const isReceivedInvoice = (invoice: SalesInvoice) => Boolean(invoice.isReceived || invoice.receivedAt);

const getDateKey = (value?: string) => {
  if (!value) return "";
  const normalized = value.includes("T") ? value.slice(0, 10) : value;
  return normalized.replaceAll("/", "-");
};

const resolvePurchaseInventoryIds = (invoice: PurchaseInvoice) =>
  Array.from(new Set([...(invoice.inventoryIds ?? []), ...(invoice.items ?? []).map((item) => item.inventoryId)]));

const handleDateInputClick = (event: React.MouseEvent<HTMLInputElement>) => {
  const target = event.currentTarget as HTMLInputElement & { showPicker?: () => void };
  target.showPicker?.();
};

const padDateUnit = (value: number) => value.toString().padStart(2, "0");

const getCurrentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${padDateUnit(now.getMonth() + 1)}`;
};

const getMonthRange = (monthValue: string) => {
  if (!monthValue) return { startDate: "", endDate: "" };
  const [yearText, monthText] = monthValue.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!year || !month) return { startDate: "", endDate: "" };
  const lastDay = new Date(year, month, 0).getDate();
  return {
    startDate: `${year}-${padDateUnit(month)}-01`,
    endDate: `${year}-${padDateUnit(month)}-${padDateUnit(lastDay)}`,
  };
};

const shiftMonth = (monthValue: string, offset: number) => {
  if (!monthValue) return "";
  const [yearText, monthText] = monthValue.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!year || !month) return "";
  const adjusted = new Date(year, month - 1 + offset, 1);
  return `${adjusted.getFullYear()}-${padDateUnit(adjusted.getMonth() + 1)}`;
};

export default function ProfitManagementPage() {
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab") ?? "payables";

  const initialProfitMonth = getCurrentMonthValue();
  const initialProfitRange = getMonthRange(initialProfitMonth);

  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [inventories, setInventories] = useState<InventoryRecord[]>([]);

  const [payableFilters, setPayableFilters] = useState({
    id: "",
    issueDate: "",
    paymentCompletedFrom: "",
    paymentCompletedTo: "",
    maker: "",
    model: "",
    displayCount: "50",
    staff: "",
    supplier: "",
    showProcessed: false,
  });
  const [receivableFilters, setReceivableFilters] = useState({
    id: "",
    issueDate: "",
    receiptConfirmedFrom: "",
    receiptConfirmedTo: "",
    maker: "",
    model: "",
    displayCount: "50",
    staff: "",
    customer: "",
    showProcessed: false,
  });
  const [profitFilters, setProfitFilters] = useState({
    maker: "",
    model: "",
    customer: "",
    staff: "",
    startDate: initialProfitRange.startDate,
    endDate: initialProfitRange.endDate,
    displayCount: "50",
  });
  const [profitSearchMode, setProfitSearchMode] = useState<"month" | "range">("month");
  const [profitMonth, setProfitMonth] = useState(initialProfitMonth);
  const [profitView, setProfitView] = useState<"all" | "summary" | "processed">("all");

  const [selectedPayableIds, setSelectedPayableIds] = useState<Set<string>>(new Set());
  const [selectedReceivableIds, setSelectedReceivableIds] = useState<Set<string>>(new Set());
  const [paymentDate, setPaymentDate] = useState("");
  const [receiptDate, setReceiptDate] = useState("");
  const [receiptBank, setReceiptBank] = useState("");
  const [processingPayments, setProcessingPayments] = useState(false);
  const [processingReceipts, setProcessingReceipts] = useState(false);

  useEffect(() => {
    setPurchaseInvoices(loadPurchaseInvoices());
    setSalesInvoices(loadAllSalesInvoices());
    setInventories(loadInventoryRecords());
  }, []);

  useEffect(() => {
    setSelectedPayableIds((prev) => {
      const next = new Set<string>();
      purchaseInvoices.forEach((invoice) => {
        if (prev.has(invoice.invoiceId) && !isPaidInvoice(invoice)) {
          next.add(invoice.invoiceId);
        }
      });
      return next;
    });
  }, [purchaseInvoices]);

  useEffect(() => {
    setSelectedReceivableIds((prev) => {
      const next = new Set<string>();
      salesInvoices.forEach((invoice) => {
        if (prev.has(invoice.invoiceId) && !isReceivedInvoice(invoice)) {
          next.add(invoice.invoiceId);
        }
      });
      return next;
    });
  }, [salesInvoices]);

  const uncreatedPurchaseTotal = useMemo(() => {
    return inventories
      .filter((item) => !item.purchaseInvoiceId)
      .reduce((sum, item) => {
        const amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
        return sum + (Number.isNaN(amount) ? 0 : amount);
      }, 0);
  }, [inventories]);

  const salesInvoicedInventoryIds = useMemo(() => {
    const ids = new Set<string>();
    salesInvoices.forEach((invoice) => {
      resolveInvoiceInventoryIds(invoice).forEach((id) => ids.add(id));
    });
    return ids;
  }, [salesInvoices]);

  const uncreatedSalesTotal = useMemo(() => {
    return inventories
      .filter((record) => (record.status ?? record.stockStatus) === "売却済")
      .filter((record) => !salesInvoicedInventoryIds.has(record.id))
      .reduce((sum, record) => {
        const unitPrice = Number(record.saleUnitPrice ?? record.unitPrice) || 0;
        const amount = unitPrice * (Number(record.quantity) || 0);
        return sum + (Number.isNaN(amount) ? 0 : amount);
      }, 0);
  }, [inventories, salesInvoicedInventoryIds]);

  const payables = useMemo(
    () => purchaseInvoices.filter((invoice) => !isPaidInvoice(invoice)),
    [purchaseInvoices],
  );

  const receivables = useMemo(
    () => salesInvoices.filter((invoice) => !isReceivedInvoice(invoice)),
    [salesInvoices],
  );

  const inventoryMap = useMemo(() => {
    const map = new Map<string, InventoryRecord>();
    inventories.forEach((record) => map.set(record.id, record));
    return map;
  }, [inventories]);

  const filteredPayables = useMemo(() => {
    const source = payableFilters.showProcessed ? purchaseInvoices : payables;
    const filtered = source.filter((invoice) => {
      const matchesId = invoice.invoiceId.toLowerCase().includes(payableFilters.id.toLowerCase());
      const matchesMaker = invoice.items.some((item) =>
        (item.maker ?? "").toLowerCase().includes(payableFilters.maker.toLowerCase()),
      );
      const matchesModel = invoice.items.some((item) =>
        (item.machineName ?? "").toLowerCase().includes(payableFilters.model.toLowerCase()),
      );
      const matchesSupplier = (invoice.partnerName ?? "")
        .toLowerCase()
        .includes(payableFilters.supplier.toLowerCase());
      const issueDateKey = getDateKey(invoice.issuedDate || invoice.createdAt);
      const matchesIssueDate = payableFilters.issueDate ? issueDateKey === payableFilters.issueDate : true;
      const matchesStaff = payableFilters.staff
        ? (invoice.staff ?? "").toLowerCase().includes(payableFilters.staff.toLowerCase())
        : true;
      const completedDateKey = getDateKey(invoice.paidAt);
      const hasCompletedDate = completedDateKey !== "";
      const matchesCompletedFrom = payableFilters.paymentCompletedFrom
        ? completedDateKey >= payableFilters.paymentCompletedFrom
        : true;
      const matchesCompletedTo = payableFilters.paymentCompletedTo
        ? completedDateKey <= payableFilters.paymentCompletedTo
        : true;
      const matchesCompletedDate =
        payableFilters.paymentCompletedFrom || payableFilters.paymentCompletedTo
          ? hasCompletedDate && matchesCompletedFrom && matchesCompletedTo
          : true;
      return (
        matchesId &&
        matchesMaker &&
        matchesModel &&
        matchesSupplier &&
        matchesIssueDate &&
        matchesStaff &&
        matchesCompletedDate
      );
    });
    const limit = Number(payableFilters.displayCount) || filtered.length;
    return filtered.slice(0, limit);
  }, [payableFilters, payables, purchaseInvoices]);

  const filteredReceivables = useMemo(() => {
    const source = receivableFilters.showProcessed ? salesInvoices : receivables;
    const filtered = source.filter((invoice) => {
      const matchesId = invoice.invoiceId.toLowerCase().includes(receivableFilters.id.toLowerCase());
      const matchesMaker = (invoice.items ?? []).some((item) =>
        (item.maker ?? "").toLowerCase().includes(receivableFilters.maker.toLowerCase()),
      );
      const matchesModel = (invoice.items ?? []).some((item) =>
        (item.productName ?? "").toLowerCase().includes(receivableFilters.model.toLowerCase()),
      );
      const matchesCustomer = (invoice.vendorName || invoice.buyerName || "")
        .toLowerCase()
        .includes(receivableFilters.customer.toLowerCase());
      const issueDateKey = getDateKey(invoice.issuedDate || invoice.createdAt);
      const matchesIssueDate = receivableFilters.issueDate ? issueDateKey === receivableFilters.issueDate : true;
      const matchesStaff = receivableFilters.staff
        ? (invoice.staff ?? "").toLowerCase().includes(receivableFilters.staff.toLowerCase())
        : true;
      const completedDateKey = getDateKey(invoice.receivedAt);
      const hasCompletedDate = completedDateKey !== "";
      const matchesCompletedFrom = receivableFilters.receiptConfirmedFrom
        ? completedDateKey >= receivableFilters.receiptConfirmedFrom
        : true;
      const matchesCompletedTo = receivableFilters.receiptConfirmedTo
        ? completedDateKey <= receivableFilters.receiptConfirmedTo
        : true;
      const matchesCompletedDate =
        receivableFilters.receiptConfirmedFrom || receivableFilters.receiptConfirmedTo
          ? hasCompletedDate && matchesCompletedFrom && matchesCompletedTo
          : true;
      return (
        matchesId &&
        matchesMaker &&
        matchesModel &&
        matchesCustomer &&
        matchesIssueDate &&
        matchesStaff &&
        matchesCompletedDate
      );
    });
    const limit = Number(receivableFilters.displayCount) || filtered.length;
    return filtered.slice(0, limit);
  }, [receivableFilters, receivables, salesInvoices]);

  const payableSummary = useMemo(() => {
    const total = purchaseInvoices.reduce((sum, invoice) => sum + resolvePurchaseTotal(invoice), 0);
    const paid = purchaseInvoices
      .filter((invoice) => isPaidInvoice(invoice))
      .reduce((sum, invoice) => sum + resolvePurchaseTotal(invoice), 0);
    const unpaid = payables.reduce((sum, invoice) => sum + resolvePurchaseTotal(invoice), 0);
    return { total, paid, unpaid };
  }, [payables, purchaseInvoices]);

  const receivableSummary = useMemo(() => {
    const total = salesInvoices.reduce((sum, invoice) => sum + resolveSalesTotal(invoice), 0);
    const received = salesInvoices
      .filter((invoice) => isReceivedInvoice(invoice))
      .reduce((sum, invoice) => sum + resolveSalesTotal(invoice), 0);
    const unreceived = receivables.reduce((sum, invoice) => sum + resolveSalesTotal(invoice), 0);
    return { total, received, unreceived };
  }, [receivables, salesInvoices]);

  const selectedPayableTotal = useMemo(() => {
    return purchaseInvoices
      .filter((invoice) => selectedPayableIds.has(invoice.invoiceId))
      .reduce((sum, invoice) => sum + resolvePurchaseTotal(invoice), 0);
  }, [purchaseInvoices, selectedPayableIds]);

  const selectedReceivableTotal = useMemo(() => {
    return salesInvoices
      .filter((invoice) => selectedReceivableIds.has(invoice.invoiceId))
      .reduce((sum, invoice) => sum + resolveSalesTotal(invoice), 0);
  }, [salesInvoices, selectedReceivableIds]);

  const purchaseItemMap = useMemo(() => {
    const map = new Map<string, { amount: number; quantity: number; invoiceId: string }>();
    purchaseInvoices.forEach((invoice) => {
      if (!isPaidInvoice(invoice)) return;
      invoice.items?.forEach((item) => {
        if (!item.inventoryId) return;
        const amount = item.amount ?? (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
        map.set(item.inventoryId, {
          amount: Number.isNaN(amount) ? 0 : amount,
          quantity: Number(item.quantity) || 0,
          invoiceId: invoice.invoiceId,
        });
      });
    });
    return map;
  }, [purchaseInvoices]);

  const matchesText = useCallback((value: string, query: string) => value.toLowerCase().includes(query.toLowerCase()), []);

  useEffect(() => {
    if (profitSearchMode !== "month") return;
    const range = getMonthRange(profitMonth);
    setProfitFilters((prev) => ({
      ...prev,
      startDate: range.startDate,
      endDate: range.endDate,
    }));
  }, [profitMonth, profitSearchMode]);

  const isDateWithinRange = useCallback((dateKey: string, startDate: string, endDate: string) => {
    if (!dateKey) return false;
    const matchesStart = startDate ? dateKey >= startDate : true;
    const matchesEnd = endDate ? dateKey <= endDate : true;
    return matchesStart && matchesEnd;
  }, []);

  const resolveSalesPurchaseTotal = useCallback((invoice: SalesInvoice) => {
    const inventoryIds = resolveInvoiceInventoryIds(invoice);
    if (inventoryIds.length === 0) return null;
    let total = 0;
    for (const id of inventoryIds) {
      const item = purchaseItemMap.get(id);
      if (!item) return null;
      total += item.amount;
    }
    return total;
  }, [purchaseItemMap]);

  const profitRows = useMemo(() => {
    const rows = salesInvoices
      .filter((invoice) => isReceivedInvoice(invoice))
      .map((invoice) => {
        const inventoryIds = resolveInvoiceInventoryIds(invoice);
        if (inventoryIds.length === 0) return null;
        let purchaseTotal = 0;
        let purchaseQty = 0;
        for (const id of inventoryIds) {
          const item = purchaseItemMap.get(id);
          if (!item) return null;
          purchaseTotal += item.amount;
          purchaseQty += item.quantity;
        }
        const salesTotal = resolveSalesTotal(invoice);
        const salesQty = (invoice.items ?? []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        const maker = invoice.items?.[0]?.maker ?? "";
        const modelSummary = buildModelSummary(invoice.items ?? []);
        const customerName = invoice.vendorName || invoice.buyerName || "";
        const branchName = invoice.introductionStore ?? "";
        return {
          invoice,
          inventoryIds,
          salesTotal,
          purchaseTotal,
          salesQty,
          purchaseQty,
          profit: salesTotal - purchaseTotal,
          maker,
          modelSummary,
          customerName,
          branchName,
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));

    const filtered = rows.filter((row) => {
      const matchesMaker = row.maker.toLowerCase().includes(profitFilters.maker.toLowerCase());
      const matchesModel = row.modelSummary.toLowerCase().includes(profitFilters.model.toLowerCase());
      const customer = (row.invoice.vendorName || row.invoice.buyerName || "").toLowerCase();
      const matchesCustomer = customer.includes(profitFilters.customer.toLowerCase());
      const matchesStaff = (row.invoice.staff ?? "").toLowerCase().includes(profitFilters.staff.toLowerCase());
      const issueDate = getDateKey(row.invoice.issuedDate || row.invoice.createdAt);
      const matchesStart = profitFilters.startDate ? issueDate >= profitFilters.startDate : true;
      const matchesEnd = profitFilters.endDate ? issueDate <= profitFilters.endDate : true;
      return matchesMaker && matchesModel && matchesCustomer && matchesStaff && matchesStart && matchesEnd;
    });

    const limit = Number(profitFilters.displayCount) || filtered.length;
    return filtered.slice(0, limit);
  }, [profitFilters, purchaseItemMap, salesInvoices]);

  const buildProcessedPurchases = useCallback(
    (startDate: string, endDate: string) =>
      purchaseInvoices
        .filter((invoice) => isPaidInvoice(invoice))
        .filter((invoice) => {
          const processedDateKey = getDateKey(invoice.paidAt);
          if (!isDateWithinRange(processedDateKey, startDate, endDate)) return false;
          const maker = invoice.items?.[0]?.maker ?? "";
          const modelSummary = buildModelSummary(invoice.items ?? []);
          const supplier = invoice.partnerName ?? "";
          const staff = invoice.staff ?? "";
          return (
            matchesText(maker, profitFilters.maker) &&
            matchesText(modelSummary, profitFilters.model) &&
            matchesText(supplier, profitFilters.customer) &&
            matchesText(staff, profitFilters.staff)
          );
        })
        .map((invoice) => {
          const processedDateKey = getDateKey(invoice.paidAt);
          return {
            kind: "purchase",
            invoice,
            processedDateKey,
            processedDate: invoice.paidAt,
            amount: resolvePurchaseTotal(invoice),
          };
        }),
    [isDateWithinRange, matchesText, profitFilters, purchaseInvoices],
  );

  const buildProcessedSales = useCallback(
    (startDate: string, endDate: string) =>
      salesInvoices
        .filter((invoice) => isReceivedInvoice(invoice))
        .filter((invoice) => {
          const processedDateKey = getDateKey(invoice.receivedAt);
          if (!isDateWithinRange(processedDateKey, startDate, endDate)) return false;
          const maker = invoice.items?.[0]?.maker ?? "";
          const modelSummary = buildModelSummary(invoice.items ?? []);
          const customer = invoice.vendorName || invoice.buyerName || "";
          const staff = invoice.staff ?? "";
          return (
            matchesText(maker, profitFilters.maker) &&
            matchesText(modelSummary, profitFilters.model) &&
            matchesText(customer, profitFilters.customer) &&
            matchesText(staff, profitFilters.staff)
          );
        })
        .map((invoice) => {
          const processedDateKey = getDateKey(invoice.receivedAt);
          const purchaseTotal = resolveSalesPurchaseTotal(invoice);
          const salesTotal = resolveSalesTotal(invoice);
          return {
            kind: "sales",
            invoice,
            processedDateKey,
            processedDate: invoice.receivedAt,
            amount: salesTotal,
            profit: purchaseTotal == null ? null : salesTotal - purchaseTotal,
          };
        }),
    [isDateWithinRange, matchesText, profitFilters, resolveSalesPurchaseTotal, salesInvoices],
  );

  const processedPurchases = useMemo(
    () => buildProcessedPurchases(profitFilters.startDate, profitFilters.endDate),
    [buildProcessedPurchases, profitFilters.endDate, profitFilters.startDate],
  );

  const processedSales = useMemo(
    () => buildProcessedSales(profitFilters.startDate, profitFilters.endDate),
    [buildProcessedSales, profitFilters.endDate, profitFilters.startDate],
  );

  const processedRows = useMemo(() => {
    const combined = [
      ...processedPurchases.map((row) => ({
        kind: row.kind,
        invoice: row.invoice,
        processedDateKey: row.processedDateKey,
        processedDate: row.processedDate,
        amount: row.amount,
        profit: null as number | null,
      })),
      ...processedSales.map((row) => ({
        kind: row.kind,
        invoice: row.invoice,
        processedDateKey: row.processedDateKey,
        processedDate: row.processedDate,
        amount: row.amount,
        profit: row.profit ?? null,
      })),
    ];

    combined.sort((a, b) => b.processedDateKey.localeCompare(a.processedDateKey));
    const limit = Number(profitFilters.displayCount) || combined.length;
    return combined.slice(0, limit);
  }, [processedPurchases, processedSales, profitFilters.displayCount]);

  const processingSummary = useMemo(() => {
    const salesTotal = processedSales.reduce((sum, row) => sum + row.amount, 0);
    const purchaseTotal = processedPurchases.reduce((sum, row) => sum + row.amount, 0);
    const profitTotal = processedSales.reduce((sum, row) => sum + (row.profit ?? 0), 0);
    return { salesTotal, purchaseTotal, profitTotal };
  }, [processedPurchases, processedSales]);

  const buildStaffSummaryRows = useCallback(
    (purchaseRows: typeof processedPurchases, salesRows: typeof processedSales) => {
      const map = new Map<
        string,
        {
          staff: string;
          purchaseTotal: number;
          purchaseQty: number;
          salesTotal: number;
          salesQty: number;
          profitTotal: number;
          suppliers: Set<string>;
          customers: Set<string>;
        }
      >();

      const ensure = (staff: string) => {
        const key = staff || "未設定";
        if (!map.has(key)) {
          map.set(key, {
            staff: key,
            purchaseTotal: 0,
            purchaseQty: 0,
            salesTotal: 0,
            salesQty: 0,
            profitTotal: 0,
            suppliers: new Set(),
            customers: new Set(),
          });
        }
        return map.get(key)!;
      };

      purchaseRows.forEach((row) => {
        const invoice = row.invoice;
        const staff = invoice.staff ?? "";
        const entry = ensure(staff);
        const quantity = (invoice.items ?? []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        entry.purchaseTotal += row.amount;
        entry.purchaseQty += quantity;
        if (invoice.partnerName) entry.suppliers.add(invoice.partnerName);
      });

      salesRows.forEach((row) => {
        const invoice = row.invoice;
        const staff = invoice.staff ?? "";
        const entry = ensure(staff);
        const quantity = (invoice.items ?? []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        entry.salesTotal += row.amount;
        entry.salesQty += quantity;
        entry.profitTotal += row.profit ?? 0;
        const customer = invoice.vendorName || invoice.buyerName;
        if (customer) entry.customers.add(customer);
      });

      return Array.from(map.values()).sort((a, b) => {
        if (b.profitTotal !== a.profitTotal) return b.profitTotal - a.profitTotal;
        return a.staff.localeCompare(b.staff);
      });
    },
    [],
  );

  const staffSummaryRows = useMemo(
    () => buildStaffSummaryRows(processedPurchases, processedSales),
    [buildStaffSummaryRows, processedPurchases, processedSales],
  );

  const comparisonBaseMonth = useMemo(() => {
    if (profitSearchMode === "month") return profitMonth;
    if (profitFilters.startDate) return profitFilters.startDate.slice(0, 7);
    return getCurrentMonthValue();
  }, [profitFilters.startDate, profitMonth, profitSearchMode]);

  const previousMonth = useMemo(() => shiftMonth(comparisonBaseMonth, -1), [comparisonBaseMonth]);
  const previousMonthRange = useMemo(() => getMonthRange(previousMonth), [previousMonth]);

  const previousProcessedPurchases = useMemo(
    () => buildProcessedPurchases(previousMonthRange.startDate, previousMonthRange.endDate),
    [buildProcessedPurchases, previousMonthRange.endDate, previousMonthRange.startDate],
  );

  const previousProcessedSales = useMemo(
    () => buildProcessedSales(previousMonthRange.startDate, previousMonthRange.endDate),
    [buildProcessedSales, previousMonthRange.endDate, previousMonthRange.startDate],
  );

  const previousStaffSummaryRows = useMemo(
    () => buildStaffSummaryRows(previousProcessedPurchases, previousProcessedSales),
    [buildStaffSummaryRows, previousProcessedPurchases, previousProcessedSales],
  );

  const previousStaffSummaryMap = useMemo(
    () => new Map(previousStaffSummaryRows.map((row) => [row.staff, row] as const)),
    [previousStaffSummaryRows],
  );

  const profitSummary = useMemo(() => {
    const salesTotal = profitRows.reduce((sum, row) => sum + row.salesTotal, 0);
    const purchaseTotal = profitRows.reduce((sum, row) => sum + row.purchaseTotal, 0);
    const profitTotal = profitRows.reduce((sum, row) => sum + row.profit, 0);
    return { salesTotal, purchaseTotal, profitTotal };
  }, [profitRows]);

  const aggregatedProfitRows = useMemo(() => {
    const map = new Map<
      string,
      {
        customerName: string;
        branchName: string;
        purchaseTotal: number;
        purchaseQty: number;
        salesTotal: number;
        salesQty: number;
      }
    >();

    profitRows.forEach((row) => {
      const customerName = row.customerName || "-";
      const branchName = row.branchName || "-";
      const key = `${customerName}__${branchName}`;
      if (!map.has(key)) {
        map.set(key, {
          customerName,
          branchName,
          purchaseTotal: 0,
          purchaseQty: 0,
          salesTotal: 0,
          salesQty: 0,
        });
      }
      const entry = map.get(key)!;
      entry.purchaseTotal += row.purchaseTotal;
      entry.purchaseQty += row.purchaseQty;
      entry.salesTotal += row.salesTotal;
      entry.salesQty += row.salesQty;
    });

    return Array.from(map.values());
  }, [profitRows]);

  const [profitColumns, setProfitColumns] = useState(() => [
    { key: "customer", label: "取引先", align: "left", width: "w-[200px]" },
    { key: "branch", label: "支店", align: "left", width: "w-[160px]" },
    { key: "purchaseTotal", label: "仕入合計金額", align: "right", width: "w-[170px]" },
    { key: "purchaseQty", label: "仕入合計台数", align: "right", width: "w-[140px]" },
    { key: "purchaseAverage", label: "1台あたり仕入平均", align: "right", width: "w-[180px]" },
    { key: "salesTotal", label: "販売合計金額", align: "right", width: "w-[170px]" },
    { key: "salesQty", label: "販売合計台数", align: "right", width: "w-[140px]" },
    { key: "salesAverage", label: "1台あたり販売平均", align: "right", width: "w-[180px]" },
  ]);
  const [draggingProfitColumn, setDraggingProfitColumn] = useState<string | null>(null);
  const [profitDragOver, setProfitDragOver] = useState<{ key: string; position: "left" | "right" } | null>(null);

  const handleProfitDragStart = (key: string) => setDraggingProfitColumn(key);

  const handleProfitDragOver = (event: React.DragEvent<HTMLTableCellElement>, key: string) => {
    event.preventDefault();
    if (!draggingProfitColumn || draggingProfitColumn === key) return;
    const target = event.currentTarget;
    const { offsetX } = event.nativeEvent as DragEvent;
    if (!target) return;
    const position = offsetX < target.clientWidth / 2 ? "left" : "right";
    setProfitDragOver({ key, position });
  };

  const handleProfitDrop = (key: string) => {
    if (!draggingProfitColumn || draggingProfitColumn === key || !profitDragOver) {
      setProfitDragOver(null);
      setDraggingProfitColumn(null);
      return;
    }
    setProfitColumns((prev) => {
      const currentIndex = prev.findIndex((col) => col.key === draggingProfitColumn);
      const targetIndex = prev.findIndex((col) => col.key === key);
      if (currentIndex === -1 || targetIndex === -1) return prev;
      const next = [...prev];
      const [removed] = next.splice(currentIndex, 1);
      const insertIndex = profitDragOver.position === "left" ? targetIndex : targetIndex + 1;
      next.splice(insertIndex > currentIndex ? insertIndex - 1 : insertIndex, 0, removed);
      return next;
    });
    setProfitDragOver(null);
    setDraggingProfitColumn(null);
  };

  const formatComparison = (current: number, previous?: number) => {
    if (previous == null || previous === 0) return "-";
    const diff = ((current - previous) / previous) * 100;
    if (!Number.isFinite(diff)) return "-";
    const arrow = diff >= 0 ? "↑" : "↓";
    const sign = diff >= 0 ? "+" : "-";
    return `${arrow} ${sign}${Math.abs(diff).toFixed(1)}%`;
  };

  const renderProfitAggregateCell = (
    columnKey: string,
    row: {
      customerName: string;
      branchName: string;
      purchaseTotal: number;
      purchaseQty: number;
      salesTotal: number;
      salesQty: number;
    },
  ) => {
    switch (columnKey) {
      case "customer":
        return row.customerName || "-";
      case "branch":
        return row.branchName || "-";
      case "purchaseTotal":
        return formatCurrency(row.purchaseTotal);
      case "purchaseQty":
        return row.purchaseQty.toLocaleString("ja-JP");
      case "purchaseAverage":
        return row.purchaseQty ? formatCurrency(row.purchaseTotal / row.purchaseQty) : "-";
      case "salesTotal":
        return formatCurrency(row.salesTotal);
      case "salesQty":
        return row.salesQty.toLocaleString("ja-JP");
      case "salesAverage":
        return row.salesQty ? formatCurrency(row.salesTotal / row.salesQty) : "-";
      default:
        return "-";
    }
  };

  const profitTargetCount =
    profitView === "all"
      ? aggregatedProfitRows.length
      : profitView === "summary"
        ? staffSummaryRows.length
        : processedRows.length;
  const summaryTotals = profitView === "all" ? profitSummary : processingSummary;

  const handlePaymentProcess = () => {
    if (selectedPayableIds.size === 0) {
      alert("支払処理する伝票を選択してください。");
      return;
    }
    if (!paymentDate) {
      alert("支払日を入力してください。");
      return;
    }
    if (processingPayments) return;
    setProcessingPayments(true);
    const updated = purchaseInvoices.map((invoice) =>
      selectedPayableIds.has(invoice.invoiceId)
        ? { ...invoice, isPaid: true, paidAt: paymentDate }
        : invoice,
    );
    savePurchaseInvoices(updated);
    setPurchaseInvoices(updated);
    setSelectedPayableIds(new Set());
    setPaymentDate("");
    setProcessingPayments(false);
  };

  const handleReceiptProcess = () => {
    if (selectedReceivableIds.size === 0) {
      alert("入金確認する伝票を選択してください。");
      return;
    }
    if (!receiptDate) {
      alert("入金日を入力してください。");
      return;
    }
    if (processingReceipts) return;
    setProcessingReceipts(true);
    const updated = salesInvoices.map((invoice) =>
      selectedReceivableIds.has(invoice.invoiceId)
        ? { ...invoice, isReceived: true, receivedAt: receiptDate, receivedBank: receiptBank || invoice.receivedBank }
        : invoice,
    );
    const updatedTargets = updated.filter((invoice) => selectedReceivableIds.has(invoice.invoiceId));
    upsertSalesInvoices(updatedTargets);
    setSalesInvoices(updated);
    setSelectedReceivableIds(new Set());
    setReceiptDate("");
    setReceiptBank("");
    setProcessingReceipts(false);
  };

  const tabs = [
    { label: "買掛一覧", href: "/inventory/profit?tab=payables" },
    { label: "売掛一覧", href: "/inventory/profit?tab=receivables" },
    { label: "利益一覧", href: "/inventory/profit?tab=profit" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3 bg-slate-600 px-3 py-2 text-white">
          <span className="h-3.5 w-3.5 rounded-full bg-white" aria-hidden />
          <h1 className="text-xl font-bold text-white">利益管理</h1>
        </div>
        <div className="border-b border-dashed border-gray-300" />
      </div>

      <SubTabs tabs={tabs} />

      {currentTab === "payables" && (
        <div className="space-y-6">
          <div className="overflow-hidden border border-gray-300 bg-white">
            <div className="bg-slate-600 px-4 py-2 text-sm font-bold text-white">検索条件</div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed border-collapse text-sm text-neutral-800">
                <tbody>
                  <tr className="divide-x divide-gray-300">
                    <th className={`${labelCellClass} ${borderCell} w-28 px-3 py-2`}>ID</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="text"
                        value={payableFilters.id}
                        onChange={(e) => setPayableFilters((prev) => ({ ...prev, id: e.target.value }))}
                        className={inputCellStyles}
                        placeholder="購入伝票ID"
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} w-32 px-3 py-2`}>伝票発行日</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="date"
                        value={payableFilters.issueDate}
                        onChange={(e) => setPayableFilters((prev) => ({ ...prev, issueDate: e.target.value }))}
                        onClick={handleDateInputClick}
                        className={inputCellStyles}
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} w-28 px-3 py-2`}>メーカー</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="text"
                        value={payableFilters.maker}
                        onChange={(e) => setPayableFilters((prev) => ({ ...prev, maker: e.target.value }))}
                        className={inputCellStyles}
                        placeholder="メーカー名"
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} w-28 px-3 py-2`}>機種名</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="text"
                        value={payableFilters.model}
                        onChange={(e) => setPayableFilters((prev) => ({ ...prev, model: e.target.value }))}
                        className={inputCellStyles}
                        placeholder="機種名"
                      />
                    </td>
                  </tr>
                  <tr className="divide-x divide-gray-300">
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>表示数</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <select
                        value={payableFilters.displayCount}
                        onChange={(e) => setPayableFilters((prev) => ({ ...prev, displayCount: e.target.value }))}
                        className={inputCellStyles}
                      >
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </td>
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>担当</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="text"
                        value={payableFilters.staff}
                        onChange={(e) => setPayableFilters((prev) => ({ ...prev, staff: e.target.value }))}
                        className={inputCellStyles}
                        placeholder="担当者"
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>仕入先</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="text"
                        value={payableFilters.supplier}
                        onChange={(e) => setPayableFilters((prev) => ({ ...prev, supplier: e.target.value }))}
                        className={inputCellStyles}
                        placeholder="仕入先"
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>伝票未作成</th>
                    <td className={`${borderCell} px-3 py-2 text-right font-semibold text-slate-700`}>
                      {formatCurrency(uncreatedPurchaseTotal)}
                    </td>
                  </tr>
                  <tr className="divide-x divide-gray-300">
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>支払完了日（開始）</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="date"
                        value={payableFilters.paymentCompletedFrom}
                        onChange={(e) =>
                          setPayableFilters((prev) => ({ ...prev, paymentCompletedFrom: e.target.value }))
                        }
                        onClick={handleDateInputClick}
                        className={inputCellStyles}
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>支払完了日（終了）</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="date"
                        value={payableFilters.paymentCompletedTo}
                        onChange={(e) =>
                          setPayableFilters((prev) => ({ ...prev, paymentCompletedTo: e.target.value }))
                        }
                        onClick={handleDateInputClick}
                        className={inputCellStyles}
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>処理済みも表示</th>
                    <td className={`${borderCell} px-3 py-2`} colSpan={3}>
                      <label className="flex items-center gap-2 text-sm text-neutral-700">
                        <input
                          type="checkbox"
                          checked={payableFilters.showProcessed}
                          onChange={(e) =>
                            setPayableFilters((prev) => ({ ...prev, showProcessed: e.target.checked }))
                          }
                          className="h-4 w-4 rounded-none border-gray-300 text-slate-600 focus:ring-slate-600"
                        />
                        処理済み伝票も表示
                      </label>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 border border-gray-300 bg-white p-4 text-sm text-neutral-800 md:grid-cols-3">
            <div>
              <div className="text-xs text-neutral-500">支払予定合計金額</div>
              <div className="text-lg font-semibold text-slate-900">{formatCurrency(payableSummary.total)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">支払合計金額（処理済み）</div>
              <div className="text-lg font-semibold text-slate-900">{formatCurrency(payableSummary.paid)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">未支払合計金額</div>
              <div className="text-lg font-semibold text-slate-900">{formatCurrency(payableSummary.unpaid)}</div>
            </div>
          </div>

          <div className="border border-gray-300 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="text-sm text-neutral-700">
                支払日
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  onClick={handleDateInputClick}
                  className="ml-2 rounded-none border border-gray-300 bg-white px-2 py-1 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={handlePaymentProcess}
                disabled={processingPayments}
                className="rounded-none border border-gray-300 bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-none hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                支払処理
              </button>
              <div className="flex items-center gap-3">
                <div className="font-semibold text-slate-700">選択合計支払額</div>
                <div className="text-lg font-semibold text-slate-900">{formatCurrency(selectedPayableTotal)}</div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-300 bg-white">
            <table className="min-w-full table-fixed border-collapse text-sm">
              <thead className="bg-slate-600 text-left text-xs font-bold text-white">
                <tr>
                  <th className="w-[72px] border border-gray-300 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredPayables.filter((invoice) => !isPaidInvoice(invoice)).length > 0 &&
                        filteredPayables
                          .filter((invoice) => !isPaidInvoice(invoice))
                          .every((invoice) => selectedPayableIds.has(invoice.invoiceId))
                      }
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectedPayableIds((prev) => {
                          const next = new Set(prev);
                          filteredPayables
                            .filter((invoice) => !isPaidInvoice(invoice))
                            .forEach((invoice) => {
                            if (checked) {
                              next.add(invoice.invoiceId);
                            } else {
                              next.delete(invoice.invoiceId);
                            }
                          });
                          return next;
                        });
                      }}
                      className="h-4 w-4 rounded-none border-gray-300 text-slate-600 focus:ring-slate-600"
                    />
                  </th>
                  <th className="w-[160px] border border-gray-300 px-3 py-3">購入伝票ID</th>
                  <th className="w-[200px] border border-gray-300 px-3 py-3">仕入先</th>
                  <th className="w-[160px] border border-gray-300 px-3 py-3">メーカー</th>
                  <th className="w-[200px] border border-gray-300 px-3 py-3">機種名</th>
                  <th className="w-[140px] border border-gray-300 px-3 py-3">伝票発行日</th>
                  <th className="w-[140px] border border-gray-300 px-3 py-3">支払予定日</th>
                  <th className="w-[160px] border border-gray-300 px-3 py-3">保管倉庫</th>
                  <th className="w-[140px] border border-gray-300 px-3 py-3">入庫日</th>
                  <th className="w-[140px] border border-gray-300 px-3 py-3">支払完了日</th>
                  <th className="w-[140px] border border-gray-300 px-3 py-3 text-right">伝票金額</th>
                  <th className="w-[140px] border border-gray-300 px-3 py-3">担当</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayables.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="border border-gray-300 px-3 py-6 text-center text-sm text-neutral-600"
                    >
                      支払対象の伝票がありません。
                    </td>
                  </tr>
                ) : (
                  filteredPayables.map((invoice) => {
                    const modelSummary = buildModelSummary(invoice.items ?? []);
                    const maker = invoice.items?.[0]?.maker ?? "";
                    const inventoryRecords = resolvePurchaseInventoryIds(invoice)
                      .map((id) => inventoryMap.get(id))
                      .filter((record): record is InventoryRecord => Boolean(record));
                    const primaryInventory = inventoryRecords[0];
                    const warehouse = primaryInventory?.warehouse ?? primaryInventory?.storageLocation;
                    const stockInDate = primaryInventory?.stockInDate ?? primaryInventory?.arrivalDate;
                    const isPaid = isPaidInvoice(invoice);
                    const rowText = isPaid ? "text-slate-400" : "text-neutral-800";
                    const expectedPaymentDate = invoice.formInput?.paymentDate ?? invoice.paymentDueDate;
                    return (
                      <tr key={invoice.invoiceId} className={isPaid ? "bg-slate-50" : "hover:bg-slate-50"}>
                        <td className="border border-gray-300 px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedPayableIds.has(invoice.invoiceId)}
                            disabled={isPaid}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectedPayableIds((prev) => {
                                const next = new Set(prev);
                                if (checked) {
                                  next.add(invoice.invoiceId);
                                } else {
                                  next.delete(invoice.invoiceId);
                                }
                                return next;
                              });
                            }}
                            className="h-4 w-4 rounded-none border-gray-300 text-slate-600 focus:ring-slate-600"
                          />
                        </td>
                        <td className={`border border-gray-300 px-3 py-3 font-mono text-sm ${rowText}`}>
                          {invoice.invoiceId}
                        </td>
                        <td className={`border border-gray-300 px-3 py-3 ${rowText}`}>
                          {invoice.partnerName ?? "-"}
                        </td>
                        <td className={`border border-gray-300 px-3 py-3 ${rowText}`}>{maker || "-"}</td>
                        <td className={`border border-gray-300 px-3 py-3 ${rowText}`}>{modelSummary}</td>
                        <td className={`border border-gray-300 px-3 py-3 ${rowText}`}>
                          {formatDate(invoice.issuedDate || invoice.createdAt)}
                        </td>
                        <td className={`border border-gray-300 px-3 py-3 ${rowText}`}>
                          {formatDate(expectedPaymentDate)}
                        </td>
                        <td className={`border border-gray-300 px-3 py-3 ${rowText}`}>{warehouse || "-"}</td>
                        <td className={`border border-gray-300 px-3 py-3 ${rowText}`}>
                          {formatDate(stockInDate)}
                        </td>
                        <td className={`border border-gray-300 px-3 py-3 ${rowText}`}>
                          {formatDate(invoice.paidAt)}
                        </td>
                        <td className={`border border-gray-300 px-3 py-3 text-right ${rowText}`}>
                          {formatCurrency(resolvePurchaseTotal(invoice))}
                        </td>
                        <td className={`border border-gray-300 px-3 py-3 ${rowText}`}>{invoice.staff ?? "-"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentTab === "receivables" && (
        <div className="space-y-6">
          <div className="overflow-hidden border border-gray-300 bg-white">
            <div className="bg-slate-600 px-4 py-2 text-sm font-bold text-white">検索条件</div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed border-collapse text-sm text-neutral-800">
                <tbody>
                  <tr className="divide-x divide-gray-300">
                    <th className={`${labelCellClass} ${borderCell} w-28 px-3 py-2`}>ID</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="text"
                        value={receivableFilters.id}
                        onChange={(e) => setReceivableFilters((prev) => ({ ...prev, id: e.target.value }))}
                        className={inputCellStyles}
                        placeholder="販売伝票ID"
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} w-32 px-3 py-2`}>伝票発行日</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="date"
                        value={receivableFilters.issueDate}
                        onChange={(e) => setReceivableFilters((prev) => ({ ...prev, issueDate: e.target.value }))}
                        onClick={handleDateInputClick}
                        className={inputCellStyles}
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} w-28 px-3 py-2`}>メーカー</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="text"
                        value={receivableFilters.maker}
                        onChange={(e) => setReceivableFilters((prev) => ({ ...prev, maker: e.target.value }))}
                        className={inputCellStyles}
                        placeholder="メーカー名"
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} w-28 px-3 py-2`}>機種名</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="text"
                        value={receivableFilters.model}
                        onChange={(e) => setReceivableFilters((prev) => ({ ...prev, model: e.target.value }))}
                        className={inputCellStyles}
                        placeholder="機種名"
                      />
                    </td>
                  </tr>
                  <tr className="divide-x divide-gray-300">
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>表示数</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <select
                        value={receivableFilters.displayCount}
                        onChange={(e) => setReceivableFilters((prev) => ({ ...prev, displayCount: e.target.value }))}
                        className={inputCellStyles}
                      >
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </td>
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>担当</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="text"
                        value={receivableFilters.staff}
                        onChange={(e) => setReceivableFilters((prev) => ({ ...prev, staff: e.target.value }))}
                        className={inputCellStyles}
                        placeholder="担当者"
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>販売先</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="text"
                        value={receivableFilters.customer}
                        onChange={(e) => setReceivableFilters((prev) => ({ ...prev, customer: e.target.value }))}
                        className={inputCellStyles}
                        placeholder="販売先"
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>伝票未作成</th>
                    <td className={`${borderCell} px-3 py-2 text-right font-semibold text-slate-700`}>
                      {formatCurrency(uncreatedSalesTotal)}
                    </td>
                  </tr>
                  <tr className="divide-x divide-gray-300">
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>入金確認日（開始）</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="date"
                        value={receivableFilters.receiptConfirmedFrom}
                        onChange={(e) =>
                          setReceivableFilters((prev) => ({ ...prev, receiptConfirmedFrom: e.target.value }))
                        }
                        onClick={handleDateInputClick}
                        className={inputCellStyles}
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>入金確認日（終了）</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="date"
                        value={receivableFilters.receiptConfirmedTo}
                        onChange={(e) =>
                          setReceivableFilters((prev) => ({ ...prev, receiptConfirmedTo: e.target.value }))
                        }
                        onClick={handleDateInputClick}
                        className={inputCellStyles}
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>処理済みも表示</th>
                    <td className={`${borderCell} px-3 py-2`} colSpan={3}>
                      <label className="flex items-center gap-2 text-sm text-neutral-700">
                        <input
                          type="checkbox"
                          checked={receivableFilters.showProcessed}
                          onChange={(e) =>
                            setReceivableFilters((prev) => ({ ...prev, showProcessed: e.target.checked }))
                          }
                          className="h-4 w-4 rounded-none border-gray-300 text-slate-600 focus:ring-slate-600"
                        />
                        処理済み伝票も表示
                      </label>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 border border-gray-300 bg-white p-4 text-sm text-neutral-800 md:grid-cols-3">
            <div>
              <div className="text-xs text-neutral-500">入金予定合計金額</div>
              <div className="text-lg font-semibold text-slate-900">{formatCurrency(receivableSummary.total)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">入金合計金額（確認済み）</div>
              <div className="text-lg font-semibold text-slate-900">{formatCurrency(receivableSummary.received)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">未入金合計金額</div>
              <div className="text-lg font-semibold text-slate-900">{formatCurrency(receivableSummary.unreceived)}</div>
            </div>
          </div>

          <div className="border border-gray-300 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="text-sm text-neutral-700">
                入金日
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  onClick={handleDateInputClick}
                  className="ml-2 rounded-none border border-gray-300 bg-white px-2 py-1 text-sm"
                />
              </label>
              <label className="text-sm text-neutral-700">
                銀行
                <input
                  type="text"
                  value={receiptBank}
                  onChange={(e) => setReceiptBank(e.target.value)}
                  className="ml-2 w-40 rounded-none border border-gray-300 bg-white px-2 py-1 text-sm"
                  placeholder="任意"
                />
              </label>
              <button
                type="button"
                onClick={handleReceiptProcess}
                disabled={processingReceipts}
                className="rounded-none border border-gray-300 bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-none hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                入金確認処理
              </button>
              <div className="flex items-center gap-3">
                <div className="font-semibold text-slate-700">選択合計入金額</div>
                <div className="text-lg font-semibold text-slate-900">{formatCurrency(selectedReceivableTotal)}</div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-300 bg-white">
            <table className="min-w-full table-fixed border-collapse text-sm">
              <thead className="bg-slate-600 text-left text-xs font-bold text-white">
                <tr>
                  <th className="w-[72px] border border-gray-300 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredReceivables.filter((invoice) => !isReceivedInvoice(invoice)).length > 0 &&
                        filteredReceivables
                          .filter((invoice) => !isReceivedInvoice(invoice))
                          .every((invoice) => selectedReceivableIds.has(invoice.invoiceId))
                      }
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectedReceivableIds((prev) => {
                          const next = new Set(prev);
                          filteredReceivables
                            .filter((invoice) => !isReceivedInvoice(invoice))
                            .forEach((invoice) => {
                            if (checked) {
                              next.add(invoice.invoiceId);
                            } else {
                              next.delete(invoice.invoiceId);
                            }
                          });
                          return next;
                        });
                      }}
                      className="h-4 w-4 rounded-none border-gray-300 text-slate-600 focus:ring-slate-600"
                    />
                  </th>
                  <th className="w-[160px] border border-gray-300 px-3 py-3">販売伝票ID</th>
                  <th className="w-[200px] border border-gray-300 px-3 py-3">販売先</th>
                  <th className="w-[160px] border border-gray-300 px-3 py-3">メーカー</th>
                  <th className="w-[200px] border border-gray-300 px-3 py-3">機種名</th>
                  <th className="w-[140px] border border-gray-300 px-3 py-3">伝票発行日</th>
                  <th className="w-[140px] border border-gray-300 px-3 py-3">入金予定日</th>
                  <th className="w-[160px] border border-gray-300 px-3 py-3">保管倉庫</th>
                  <th className="w-[140px] border border-gray-300 px-3 py-3">入庫日</th>
                  <th className="w-[140px] border border-gray-300 px-3 py-3">入金確認日</th>
                  <th className="w-[140px] border border-gray-300 px-3 py-3 text-right">伝票金額</th>
                  <th className="w-[140px] border border-gray-300 px-3 py-3">担当</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceivables.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="border border-gray-300 px-3 py-6 text-center text-sm text-neutral-600"
                    >
                      入金確認対象の伝票がありません。
                    </td>
                  </tr>
                ) : (
                  filteredReceivables.map((invoice) => {
                    const maker = invoice.items?.[0]?.maker ?? "";
                    const modelSummary = buildModelSummary(invoice.items ?? []);
                    const inventoryRecords = resolveInvoiceInventoryIds(invoice)
                      .map((id) => inventoryMap.get(id))
                      .filter((record): record is InventoryRecord => Boolean(record));
                    const primaryInventory = inventoryRecords[0];
                    const warehouse = primaryInventory?.warehouse ?? primaryInventory?.storageLocation;
                    const stockInDate = primaryInventory?.stockInDate ?? primaryInventory?.arrivalDate;
                    const expectedReceiptDate = invoice.paymentDueDate;
                    const isReceived = isReceivedInvoice(invoice);
                    const rowText = isReceived ? "text-slate-400" : "text-neutral-800";
                    return (
                      <tr key={invoice.invoiceId} className={isReceived ? "bg-slate-50" : "hover:bg-slate-50"}>
                        <td className="border border-gray-300 px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedReceivableIds.has(invoice.invoiceId)}
                            disabled={isReceived}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectedReceivableIds((prev) => {
                                const next = new Set(prev);
                                if (checked) {
                                  next.add(invoice.invoiceId);
                                } else {
                                  next.delete(invoice.invoiceId);
                                }
                                return next;
                              });
                            }}
                            className="h-4 w-4 rounded-none border-gray-300 text-slate-600 focus:ring-slate-600"
                          />
                        </td>
                        <td className={`border border-gray-300 px-3 py-3 font-mono text-sm ${rowText}`}>
                          {invoice.invoiceId}
                        </td>
                        <td className={`border border-gray-300 px-3 py-3 ${rowText}`}>
                          {invoice.vendorName || invoice.buyerName || "-"}
                        </td>
                        <td className={`border border-gray-300 px-3 py-3 ${rowText}`}>{maker || "-"}</td>
                        <td className={`border border-gray-300 px-3 py-3 ${rowText}`}>{modelSummary}</td>
                        <td className={`border border-gray-300 px-3 py-3 ${rowText}`}>
                          {formatDate(invoice.issuedDate || invoice.createdAt)}
                        </td>
                        <td className={`border border-gray-300 px-3 py-3 ${rowText}`}>
                          {formatDate(expectedReceiptDate)}
                        </td>
                        <td className={`border border-gray-300 px-3 py-3 ${rowText}`}>{warehouse || "-"}</td>
                        <td className={`border border-gray-300 px-3 py-3 ${rowText}`}>
                          {formatDate(stockInDate)}
                        </td>
                        <td className={`border border-gray-300 px-3 py-3 ${rowText}`}>
                          {formatDate(invoice.receivedAt)}
                        </td>
                        <td className={`border border-gray-300 px-3 py-3 text-right ${rowText}`}>
                          {formatCurrency(resolveSalesTotal(invoice))}
                        </td>
                        <td className={`border border-gray-300 px-3 py-3 ${rowText}`}>{invoice.staff ?? "-"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentTab === "profit" && (
        <div className="space-y-6">
          <div className="overflow-hidden border border-gray-300 bg-white">
            <div className="bg-slate-600 px-4 py-2 text-sm font-bold text-white">検索条件</div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed border-collapse text-sm text-neutral-800">
                <tbody>
                  <tr className="divide-x divide-gray-300">
                    <th className={`${labelCellClass} ${borderCell} w-28 px-3 py-2`}>メーカー</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="text"
                        value={profitFilters.maker}
                        onChange={(e) => setProfitFilters((prev) => ({ ...prev, maker: e.target.value }))}
                        className={inputCellStyles}
                        placeholder="メーカー名"
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} w-28 px-3 py-2`}>機種名</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="text"
                        value={profitFilters.model}
                        onChange={(e) => setProfitFilters((prev) => ({ ...prev, model: e.target.value }))}
                        className={inputCellStyles}
                        placeholder="機種名"
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} w-28 px-3 py-2`}>販売先</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="text"
                        value={profitFilters.customer}
                        onChange={(e) => setProfitFilters((prev) => ({ ...prev, customer: e.target.value }))}
                        className={inputCellStyles}
                        placeholder="販売先"
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} w-28 px-3 py-2`}>担当</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="text"
                        value={profitFilters.staff}
                        onChange={(e) => setProfitFilters((prev) => ({ ...prev, staff: e.target.value }))}
                        className={inputCellStyles}
                        placeholder="担当者"
                      />
                    </td>
                  </tr>
                  <tr className="divide-x divide-gray-300">
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>検索モード</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <select
                        value={profitSearchMode}
                        onChange={(e) => setProfitSearchMode(e.target.value as "month" | "range")}
                        className={inputCellStyles}
                      >
                        <option value="month">月</option>
                        <option value="range">期間</option>
                      </select>
                    </td>
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>月検索</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="month"
                        value={profitMonth}
                        onChange={(e) => setProfitMonth(e.target.value)}
                        onClick={handleDateInputClick}
                        disabled={profitSearchMode !== "month"}
                        className={`${inputCellStyles} ${profitSearchMode !== "month" ? "bg-slate-100" : ""}`}
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>開始日</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="date"
                        value={profitFilters.startDate}
                        onChange={(e) => setProfitFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                        onClick={handleDateInputClick}
                        disabled={profitSearchMode !== "range"}
                        className={`${inputCellStyles} ${profitSearchMode !== "range" ? "bg-slate-100" : ""}`}
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>終了日</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="date"
                        value={profitFilters.endDate}
                        onChange={(e) => setProfitFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                        onClick={handleDateInputClick}
                        disabled={profitSearchMode !== "range"}
                        className={`${inputCellStyles} ${profitSearchMode !== "range" ? "bg-slate-100" : ""}`}
                      />
                    </td>
                  </tr>
                  <tr className="divide-x divide-gray-300">
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>表示数</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <select
                        value={profitFilters.displayCount}
                        onChange={(e) => setProfitFilters((prev) => ({ ...prev, displayCount: e.target.value }))}
                        className={inputCellStyles}
                      >
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </td>
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>対象件数</th>
                    <td className={`${borderCell} px-3 py-2 text-right font-semibold text-slate-700`} colSpan={5}>
                      {profitTargetCount} 件
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border border-gray-300 bg-white px-4 py-3 text-sm text-neutral-800">
            <div className="font-semibold text-slate-700">表示切替</div>
            <div className="flex overflow-hidden border border-gray-300">
              {[
                { key: "all", label: "全体" },
                { key: "summary", label: "担当者別サマリー" },
                { key: "processed", label: "処理済み一覧" },
              ].map((tab) => {
                const isActive = profitView === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setProfitView(tab.key as "all" | "summary" | "processed")}
                    className={`px-4 py-2 text-sm font-semibold ${
                      isActive ? "bg-slate-600 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 border border-gray-300 bg-white p-4 text-sm text-neutral-800 md:grid-cols-3">
            <div>
              <div className="text-xs text-neutral-500">入金済み売上合計</div>
              <div className="text-lg font-semibold text-slate-900">{formatCurrency(summaryTotals.salesTotal)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">支払済み仕入合計</div>
              <div className="text-lg font-semibold text-slate-900">{formatCurrency(summaryTotals.purchaseTotal)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">粗利益合計</div>
              <div className="text-lg font-semibold text-slate-900">{formatCurrency(summaryTotals.profitTotal)}</div>
            </div>
          </div>

          {profitView === "all" && (
            <div className="overflow-x-auto border border-gray-300 bg-white">
              <div className="border-b border-gray-300 bg-slate-50 px-3 py-2 text-xs text-neutral-600">
                列ヘッダーをドラッグして並び替えできます。
              </div>
              <table className="min-w-full table-fixed border-collapse text-sm">
                <thead className="bg-slate-600 text-left text-xs font-bold text-white">
                  <tr>
                    {profitColumns.map((column) => (
                      <th
                        key={column.key}
                        draggable
                        onDragStart={() => handleProfitDragStart(column.key)}
                        onDragOver={(event) => handleProfitDragOver(event, column.key)}
                        onDrop={() => handleProfitDrop(column.key)}
                        onDragEnd={() => {
                          setProfitDragOver(null);
                          setDraggingProfitColumn(null);
                        }}
                        className={`relative border border-gray-300 px-3 py-3 ${
                          column.align === "right" ? "text-right" : "text-left"
                        } ${column.width}`}
                      >
                        <span className={`${profitDragOver?.key === column.key ? "bg-white/20" : ""}`}>
                          {column.label}
                        </span>
                        {profitDragOver && profitDragOver.key === column.key && (
                          <div
                            className={`absolute inset-y-1 ${
                              profitDragOver.position === "left" ? "left-1" : "right-1"
                            } w-0.5 bg-white`}
                          />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {aggregatedProfitRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={profitColumns.length}
                        className="border border-gray-300 px-3 py-6 text-center text-sm text-neutral-600"
                      >
                        入金済み・支払済みが揃った伝票がありません。
                      </td>
                    </tr>
                  ) : (
                    aggregatedProfitRows.map((row) => (
                      <tr key={`${row.customerName}-${row.branchName}`} className="hover:bg-slate-50">
                        {profitColumns.map((column) => (
                          <td
                            key={column.key}
                            className={`border border-gray-300 px-3 py-3 ${
                              column.align === "right" ? "text-right" : "text-left"
                            } text-neutral-800`}
                          >
                            {renderProfitAggregateCell(column.key, row)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {profitView === "summary" && (
            <div className="overflow-x-auto border border-gray-300 bg-white">
              <table className="min-w-full table-fixed border-collapse text-sm">
                <thead className="bg-slate-600 text-left text-xs font-bold text-white">
                  <tr>
                    <th className="w-[160px] border border-gray-300 px-3 py-3">担当者名</th>
                    <th className="w-[180px] border border-gray-300 px-3 py-3 text-right">1台あたり仕入平均</th>
                    <th className="w-[180px] border border-gray-300 px-3 py-3 text-right">1台あたり販売平均</th>
                    <th className="w-[140px] border border-gray-300 px-3 py-3 text-right">総台数</th>
                    <th className="w-[140px] border border-gray-300 px-3 py-3 text-right">仕入先数</th>
                    <th className="w-[140px] border border-gray-300 px-3 py-3 text-right">販売先数</th>
                    <th className="w-[160px] border border-gray-300 px-3 py-3 text-right">仕入金額合計</th>
                    <th className="w-[160px] border border-gray-300 px-3 py-3 text-right">販売金額合計</th>
                    <th className="w-[160px] border border-gray-300 px-3 py-3 text-right">粗利金額合計</th>
                  </tr>
                </thead>
                <tbody>
                  {staffSummaryRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="border border-gray-300 px-3 py-6 text-center text-sm text-neutral-600"
                      >
                        期間内の担当者データがありません。
                      </td>
                    </tr>
                  ) : (
                    staffSummaryRows.map((row) => {
                      const purchaseAverage = row.purchaseQty ? row.purchaseTotal / row.purchaseQty : 0;
                      const salesAverage = row.salesQty ? row.salesTotal / row.salesQty : 0;
                      const previous = previousStaffSummaryMap.get(row.staff);
                      const previousPurchaseAverage =
                        previous && previous.purchaseQty ? previous.purchaseTotal / previous.purchaseQty : undefined;
                      const previousSalesAverage =
                        previous && previous.salesQty ? previous.salesTotal / previous.salesQty : undefined;
                      return (
                        <tr key={row.staff} className="hover:bg-slate-50">
                          <td className="border border-gray-300 px-3 py-3 text-neutral-800">{row.staff}</td>
                          <td className="border border-gray-300 px-3 py-3 text-right text-neutral-800">
                            <div className="flex items-center justify-end gap-2">
                              <span>{formatCurrency(purchaseAverage)}</span>
                              <span className="text-xs text-slate-500">
                                {formatComparison(purchaseAverage, previousPurchaseAverage)}
                              </span>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-3 text-right text-neutral-800">
                            <div className="flex items-center justify-end gap-2">
                              <span>{formatCurrency(salesAverage)}</span>
                              <span className="text-xs text-slate-500">
                                {formatComparison(salesAverage, previousSalesAverage)}
                              </span>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-3 text-right text-neutral-800">
                            <div className="flex items-center justify-end gap-2">
                              <span>{row.salesQty.toLocaleString("ja-JP")}</span>
                              <span className="text-xs text-slate-500">
                                {formatComparison(row.salesQty, previous?.salesQty)}
                              </span>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-3 text-right text-neutral-800">
                            <div className="flex items-center justify-end gap-2">
                              <span>{row.suppliers.size}</span>
                              <span className="text-xs text-slate-500">
                                {formatComparison(row.suppliers.size, previous?.suppliers.size)}
                              </span>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-3 text-right text-neutral-800">
                            <div className="flex items-center justify-end gap-2">
                              <span>{row.customers.size}</span>
                              <span className="text-xs text-slate-500">
                                {formatComparison(row.customers.size, previous?.customers.size)}
                              </span>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-3 text-right text-neutral-800">
                            <div className="flex items-center justify-end gap-2">
                              <span>{formatCurrency(row.purchaseTotal)}</span>
                              <span className="text-xs text-slate-500">
                                {formatComparison(row.purchaseTotal, previous?.purchaseTotal)}
                              </span>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-3 text-right text-neutral-800">
                            <div className="flex items-center justify-end gap-2">
                              <span>{formatCurrency(row.salesTotal)}</span>
                              <span className="text-xs text-slate-500">
                                {formatComparison(row.salesTotal, previous?.salesTotal)}
                              </span>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-3 text-right text-neutral-800">
                            <div className="flex items-center justify-end gap-2">
                              <span>{formatCurrency(row.profitTotal)}</span>
                              <span className="text-xs text-slate-500">
                                {formatComparison(row.profitTotal, previous?.profitTotal)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {profitView === "processed" && (
            <div className="overflow-x-auto border border-gray-300 bg-white">
              <table className="min-w-full table-fixed border-collapse text-sm">
                <thead className="bg-slate-600 text-left text-xs font-bold text-white">
                  <tr>
                    <th className="w-[120px] border border-gray-300 px-3 py-3">種別</th>
                    <th className="w-[160px] border border-gray-300 px-3 py-3">伝票ID</th>
                    <th className="w-[140px] border border-gray-300 px-3 py-3">伝票発行日</th>
                    <th className="w-[140px] border border-gray-300 px-3 py-3">処理日</th>
                    <th className="w-[220px] border border-gray-300 px-3 py-3">仕入先 / 販売先</th>
                    <th className="w-[140px] border border-gray-300 px-3 py-3">担当</th>
                    <th className="w-[160px] border border-gray-300 px-3 py-3 text-right">金額</th>
                    <th className="w-[160px] border border-gray-300 px-3 py-3 text-right">粗利</th>
                  </tr>
                </thead>
                <tbody>
                  {processedRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="border border-gray-300 px-3 py-6 text-center text-sm text-neutral-600"
                      >
                        処理済み伝票がありません。
                      </td>
                    </tr>
                  ) : (
                    processedRows.map((row) => {
                      const invoice = row.invoice;
                      const partner =
                        row.kind === "purchase"
                          ? (invoice as PurchaseInvoice).partnerName
                          : (invoice as SalesInvoice).vendorName || (invoice as SalesInvoice).buyerName;
                      const issuedDate =
                        row.kind === "purchase"
                          ? (invoice as PurchaseInvoice).issuedDate || (invoice as PurchaseInvoice).createdAt
                          : (invoice as SalesInvoice).issuedDate || (invoice as SalesInvoice).createdAt;
                      const staff = (invoice as PurchaseInvoice).staff ?? (invoice as SalesInvoice).staff ?? "-";
                      return (
                        <tr key={`${row.kind}-${invoice.invoiceId}`} className="hover:bg-slate-50">
                          <td className="border border-gray-300 px-3 py-3 text-neutral-800">
                            {row.kind === "purchase" ? "購入" : "販売"}
                          </td>
                          <td className="border border-gray-300 px-3 py-3 font-mono text-sm text-neutral-900">
                            {invoice.invoiceId}
                          </td>
                          <td className="border border-gray-300 px-3 py-3 text-neutral-800">
                            {formatDate(issuedDate)}
                          </td>
                          <td className="border border-gray-300 px-3 py-3 text-neutral-800">
                            {formatDate(row.processedDate)}
                          </td>
                          <td className="border border-gray-300 px-3 py-3 text-neutral-800">{partner || "-"}</td>
                          <td className="border border-gray-300 px-3 py-3 text-neutral-800">{staff}</td>
                          <td className="border border-gray-300 px-3 py-3 text-right text-neutral-800">
                            {formatCurrency(row.amount)}
                          </td>
                          <td className="border border-gray-300 px-3 py-3 text-right text-neutral-800">
                            {row.profit == null ? "-" : formatCurrency(row.profit)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
