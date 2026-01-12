"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function ProfitManagementPage() {
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab") ?? "payables";

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
    startDate: "",
    endDate: "",
    displayCount: "50",
  });

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
    const map = new Map<string, { amount: number; invoiceId: string }>();
    purchaseInvoices.forEach((invoice) => {
      if (!isPaidInvoice(invoice)) return;
      invoice.items?.forEach((item) => {
        if (!item.inventoryId) return;
        const amount = item.amount ?? (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
        map.set(item.inventoryId, { amount: Number.isNaN(amount) ? 0 : amount, invoiceId: invoice.invoiceId });
      });
    });
    return map;
  }, [purchaseInvoices]);

  const profitRows = useMemo(() => {
    const rows = salesInvoices
      .filter((invoice) => isReceivedInvoice(invoice))
      .map((invoice) => {
        const inventoryIds = resolveInvoiceInventoryIds(invoice);
        if (inventoryIds.length === 0) return null;
        let purchaseTotal = 0;
        for (const id of inventoryIds) {
          const item = purchaseItemMap.get(id);
          if (!item) return null;
          purchaseTotal += item.amount;
        }
        const salesTotal = resolveSalesTotal(invoice);
        const maker = invoice.items?.[0]?.maker ?? "";
        const modelSummary = buildModelSummary(invoice.items ?? []);
        return {
          invoice,
          inventoryIds,
          salesTotal,
          purchaseTotal,
          profit: salesTotal - purchaseTotal,
          maker,
          modelSummary,
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

  const profitSummary = useMemo(() => {
    const salesTotal = profitRows.reduce((sum, row) => sum + row.salesTotal, 0);
    const purchaseTotal = profitRows.reduce((sum, row) => sum + row.purchaseTotal, 0);
    const profitTotal = profitRows.reduce((sum, row) => sum + row.profit, 0);
    return { salesTotal, purchaseTotal, profitTotal };
  }, [profitRows]);

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
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>開始日</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="date"
                        value={profitFilters.startDate}
                        onChange={(e) => setProfitFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                        onClick={handleDateInputClick}
                        className={inputCellStyles}
                      />
                    </td>
                    <th className={`${labelCellClass} ${borderCell} px-3 py-2`}>終了日</th>
                    <td className={`${borderCell} px-3 py-2`}>
                      <input
                        type="date"
                        value={profitFilters.endDate}
                        onChange={(e) => setProfitFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                        onClick={handleDateInputClick}
                        className={inputCellStyles}
                      />
                    </td>
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
                    <td className={`${borderCell} px-3 py-2 text-right font-semibold text-slate-700`}>
                      {profitRows.length} 件
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 border border-gray-300 bg-white p-4 text-sm text-neutral-800 md:grid-cols-3">
            <div>
              <div className="text-xs text-neutral-500">入金済み売上合計</div>
              <div className="text-lg font-semibold text-slate-900">{formatCurrency(profitSummary.salesTotal)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">支払済み仕入合計</div>
              <div className="text-lg font-semibold text-slate-900">{formatCurrency(profitSummary.purchaseTotal)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">粗利益合計</div>
              <div className="text-lg font-semibold text-slate-900">{formatCurrency(profitSummary.profitTotal)}</div>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-300 bg-white">
            <table className="min-w-full table-fixed border-collapse text-sm">
              <thead className="bg-slate-600 text-left text-xs font-bold text-white">
                <tr>
                  <th className="w-[160px] border border-gray-300 px-3 py-3">販売伝票ID</th>
                  <th className="w-[140px] border border-gray-300 px-3 py-3">発行日</th>
                  <th className="w-[200px] border border-gray-300 px-3 py-3">販売先</th>
                  <th className="w-[160px] border border-gray-300 px-3 py-3">メーカー</th>
                  <th className="w-[200px] border border-gray-300 px-3 py-3">機種名</th>
                  <th className="w-[140px] border border-gray-300 px-3 py-3 text-right">売上高</th>
                  <th className="w-[140px] border border-gray-300 px-3 py-3 text-right">仕入合計</th>
                  <th className="w-[140px] border border-gray-300 px-3 py-3 text-right">粗利益</th>
                  <th className="w-[140px] border border-gray-300 px-3 py-3">担当</th>
                </tr>
              </thead>
              <tbody>
                {profitRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="border border-gray-300 px-3 py-6 text-center text-sm text-neutral-600">
                      入金済み・支払済みが揃った伝票がありません。
                    </td>
                  </tr>
                ) : (
                  profitRows.map((row) => (
                    <tr key={row.invoice.invoiceId} className="hover:bg-slate-50">
                      <td className="border border-gray-300 px-3 py-3 font-mono text-sm text-neutral-900">
                        {row.invoice.invoiceId}
                      </td>
                      <td className="border border-gray-300 px-3 py-3 text-neutral-800">
                        {formatDate(row.invoice.issuedDate || row.invoice.createdAt)}
                      </td>
                      <td className="border border-gray-300 px-3 py-3 text-neutral-800">
                        {row.invoice.vendorName || row.invoice.buyerName || "-"}
                      </td>
                      <td className="border border-gray-300 px-3 py-3 text-neutral-800">{row.maker || "-"}</td>
                      <td className="border border-gray-300 px-3 py-3 text-neutral-800">{row.modelSummary}</td>
                      <td className="border border-gray-300 px-3 py-3 text-right text-neutral-800">
                        {formatCurrency(row.salesTotal)}
                      </td>
                      <td className="border border-gray-300 px-3 py-3 text-right text-neutral-800">
                        {formatCurrency(row.purchaseTotal)}
                      </td>
                      <td className="border border-gray-300 px-3 py-3 text-right text-neutral-800">
                        {formatCurrency(row.profit)}
                      </td>
                      <td className="border border-gray-300 px-3 py-3 text-neutral-800">
                        {row.invoice.staff ?? "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
