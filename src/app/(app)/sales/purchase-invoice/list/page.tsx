"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { deletePurchaseInvoices, loadPurchaseInvoices } from "@/lib/demo-data/purchaseInvoices";
import { formatCurrency, formatDate, loadInventoryRecords } from "@/lib/demo-data/demoInventory";
import type { InventoryRecord } from "@/lib/demo-data/demoInventory";
import type { PurchaseInvoice } from "@/types/purchaseInvoices";
import { formatShortId } from "@/lib/sales/idDisplay";

const labelCellClass = "bg-slate-100 text-center font-semibold text-slate-800";
const borderCell = "border border-gray-300";
const inputCellStyles =
  "w-full rounded-none border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400";

const buildModelSummary = (invoice: PurchaseInvoice) => {
  const names = invoice.items
    .map((item) => (item.machineName ?? "").trim())
    .filter((name) => name !== "");
  if (names.length === 0) {
    return { display: "-", tooltip: undefined };
  }
  const uniqueNames = Array.from(new Set(names));
  const display = uniqueNames.length > 1 ? `${uniqueNames[0]} + 他` : uniqueNames[0];
  const tooltip = uniqueNames.join("\n");
  return { display, tooltip };
};

export default function PurchaseInvoiceListPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [inventories, setInventories] = useState<InventoryRecord[]>([]);
  const [filters, setFilters] = useState({
    id: "",
    issueDate: "",
    maker: "",
    model: "",
    displayCount: "50",
    receiveDate: "",
    staff: "",
    supplier: "",
  });
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setInvoices(loadPurchaseInvoices());
    setInventories(loadInventoryRecords());
  }, []);

  useEffect(() => {
    setSelectedInvoiceIds((prev) => {
      const next = new Set<string>();
      invoices.forEach((invoice) => {
        if (prev.has(invoice.invoiceId)) {
          next.add(invoice.invoiceId);
        }
      });
      return next;
    });
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesId = invoice.invoiceId.toLowerCase().includes(filters.id.toLowerCase());
      const matchesMaker = invoice.items.some((item) =>
        (item.maker ?? "").toLowerCase().includes(filters.maker.toLowerCase()),
      );
      const matchesModel = invoice.items.some((item) =>
        (item.machineName ?? "").toLowerCase().includes(filters.model.toLowerCase()),
      );
      const matchesSupplier = (invoice.partnerName ?? "").toLowerCase().includes(filters.supplier.toLowerCase());
      const matchesIssueDate = filters.issueDate
        ? new Date(invoice.createdAt).toISOString().slice(0, 10) === filters.issueDate
        : true;
      const matchesReceiveDate = filters.receiveDate ? false : true; // ダミー: デモ用
      const matchesStaff = filters.staff ? false : true; // ダミー: デモ用

      return (
        matchesId &&
        matchesMaker &&
        matchesModel &&
        matchesSupplier &&
        matchesIssueDate &&
        matchesReceiveDate &&
        matchesStaff
      );
    });
  }, [filters, invoices]);

  const limitedInvoices = useMemo(() => {
    const limit = Number(filters.displayCount) || filteredInvoices.length;
    return filteredInvoices.slice(0, limit);
  }, [filteredInvoices, filters.displayCount]);

  const handleInputChange = (
    key: keyof typeof filters,
    value: string,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({
      id: "",
      issueDate: "",
      maker: "",
      model: "",
      displayCount: "50",
      receiveDate: "",
      staff: "",
      supplier: "",
    });
  };

  const inventoryMap = useMemo(() => {
    return new Map(inventories.map((inventory) => [inventory.id, inventory]));
  }, [inventories]);

  const getPrimaryInventory = (invoice: PurchaseInvoice) => {
    const firstInventory = invoice.inventoryIds
      .map((id) => inventoryMap.get(id))
      .find((inventory) => Boolean(inventory));
    return firstInventory ?? null;
  };

  const handleToggleSelect = (invoiceId: string, checked: boolean) => {
    setSelectedInvoiceIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(invoiceId);
      } else {
        next.delete(invoiceId);
      }
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedInvoiceIds.size === 0) {
      alert("削除する伝票を選択してください。");
      return;
    }
    if (!window.confirm("選択した伝票を削除します。よろしいですか？")) return;
    const updated = deletePurchaseInvoices([...selectedInvoiceIds]);
    setInvoices(updated);
    setSelectedInvoiceIds(new Set());
  };

  return (
    <div className="space-y-6 mx-[1cm]">
      <div className="space-y-2">
        <div className="flex items-center gap-3 bg-slate-600 px-3 py-2 text-white">
          <span className="h-3.5 w-3.5 rounded-full bg-white" aria-hidden />
          <h1 className="text-xl font-bold text-white">購入伝票一覧</h1>
        </div>
        <div className="border-b border-dashed border-gray-300" />
      </div>

      <div className="overflow-hidden border border-gray-300 bg-white">
        <div className="bg-slate-600 px-4 py-2 text-sm font-bold text-white">検索条件</div>
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed border-collapse text-sm text-neutral-800">
            <tbody>
              <tr className="divide-x divide-gray-300">
                <th className={`${labelCellClass} ${borderCell} w-32 px-4 py-3`}>ID</th>
                <td className={`${borderCell} px-4 py-3`}>
                  <input
                    type="text"
                    value={filters.id}
                    onChange={(e) => handleInputChange("id", e.target.value)}
                    className={inputCellStyles}
                    placeholder="購入伝票ID"
                  />
                </td>
                <th className={`${labelCellClass} ${borderCell} w-36 px-4 py-3`}>伝票発行日</th>
                <td className={`${borderCell} px-4 py-3`}>
                  <input
                    type="date"
                    value={filters.issueDate}
                    onChange={(e) => handleInputChange("issueDate", e.target.value)}
                    className={inputCellStyles}
                  />
                </td>
                <th className={`${labelCellClass} ${borderCell} w-32 px-4 py-3`}>メーカー</th>
                <td className={`${borderCell} px-4 py-3`}>
                  <select
                    value={filters.maker}
                    onChange={(e) => handleInputChange("maker", e.target.value)}
                    className={inputCellStyles}
                  >
                    <option value="">すべて</option>
                    <option value="サミー">サミー</option>
                    <option value="三洋">三洋</option>
                    <option value="その他">その他</option>
                  </select>
                </td>
                <th className={`${labelCellClass} ${borderCell} w-32 px-4 py-3`}>機種名</th>
                <td className={`${borderCell} px-4 py-3`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={filters.model}
                      onChange={(e) => handleInputChange("model", e.target.value)}
                      className={inputCellStyles}
                      placeholder="機種名"
                    />
                    <span className="rounded-none border border-gray-300 bg-white px-2 py-2 text-xs text-slate-700">
                      🔍
                    </span>
                  </div>
                </td>
              </tr>

              <tr className="divide-x divide-gray-300">
                <th className={`${labelCellClass} ${borderCell} px-4 py-3`}>表示数</th>
                <td className={`${borderCell} px-4 py-3`}>
                  <select
                    value={filters.displayCount}
                    onChange={(e) => handleInputChange("displayCount", e.target.value)}
                    className={inputCellStyles}
                  >
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </td>
                <th className={`${labelCellClass} ${borderCell} px-4 py-3`}>入庫日</th>
                <td className={`${borderCell} px-4 py-3`}>
                  <input
                    type="date"
                    value={filters.receiveDate}
                    onChange={(e) => handleInputChange("receiveDate", e.target.value)}
                    className={inputCellStyles}
                  />
                </td>
                <th className={`${labelCellClass} ${borderCell} px-4 py-3`}>担当</th>
                <td className={`${borderCell} px-4 py-3`}>
                  <select
                    value={filters.staff}
                    onChange={(e) => handleInputChange("staff", e.target.value)}
                    className={inputCellStyles}
                  >
                    <option value="">すべて</option>
                    <option value="田中">田中</option>
                    <option value="佐藤">佐藤</option>
                  </select>
                </td>
                <th className={`${labelCellClass} ${borderCell} px-4 py-3`}>仕入先</th>
                <td className={`${borderCell} px-4 py-3`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={filters.supplier}
                      onChange={(e) => handleInputChange("supplier", e.target.value)}
                      className={inputCellStyles}
                      placeholder="仕入先"
                    />
                    <button
                      type="button"
                      className="whitespace-nowrap rounded-none border border-gray-300 bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 shadow-[inset_1px_1px_0px_0px_#ffffff] hover:bg-slate-100"
                    >
                      仕入先検索
                    </button>
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan={8} className={`${borderCell} bg-white px-4 py-4`}>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      className="rounded-none border border-gray-300 bg-slate-200 px-8 py-2 text-sm font-semibold text-slate-800 shadow-[inset_1px_1px_0px_0px_#ffffff] hover:bg-slate-100"
                    >
                      検索する
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="rounded-none border border-gray-300 bg-slate-200 px-6 py-2 text-sm font-semibold text-slate-800 shadow-[inset_1px_1px_0px_0px_#ffffff] hover:bg-slate-100"
                    >
                      リセット
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 bg-slate-600 px-3 py-2 text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-2 rounded-sm bg-white" aria-hidden />
            <h2 className="text-xl font-bold text-white">購入伝票リスト</h2>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selectedInvoiceIds.size === 0}
              className="rounded-none border border-gray-300 bg-slate-200 px-3 py-2 font-semibold text-slate-800 shadow-[inset_1px_1px_0px_0px_#ffffff] hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              選択を削除
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-300 bg-white">
          <table className="min-w-full table-fixed border-collapse text-sm text-neutral-800">
            <thead>
              <tr className="border border-gray-300 bg-slate-600 text-left text-xs font-bold uppercase tracking-wide text-white">
                {[
                  "購入伝票ID",
                  "伝票発行日",
                  "メーカー名",
                  "機種名",
                  "支払日",
                  "仕入先",
                  "入庫日",
                  "担当",
                  "合計金額",
                  "選択",
                  "詳細",
                ].map((label) => (
                  <th key={label} className="whitespace-nowrap border border-gray-300 px-3 py-3">
                    <span className="inline-flex items-center gap-1">
                      {label}
                      <span className="text-[10px]">▲▼</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {limitedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={11} className="border border-gray-300 px-4 py-6 text-center text-sm text-neutral-600">
                    作成済みの購入伝票はありません。
                  </td>
                </tr>
              ) : (
                limitedInvoices.map((invoice, index) => {
                  const primaryInventory = getPrimaryInventory(invoice);
                  const supplierName =
                    primaryInventory?.supplierCorporate ||
                    invoice.partnerName ||
                    primaryInventory?.supplier ||
                    "-";
                  const stockInRaw =
                    invoice.formInput?.warehousingDate ||
                    primaryInventory?.stockInDate ||
                    primaryInventory?.arrivalDate;
                  const stockIn = formatDate(stockInRaw);
                  const staffName = invoice.staff ?? primaryInventory?.staff ?? primaryInventory?.buyerStaff ?? "-";
                  const paymentDate = formatDate(invoice.formInput?.paymentDate);
                  const modelSummary = buildModelSummary(invoice);

                  return (
                    <tr
                      key={invoice.invoiceId}
                      className={`${index % 2 === 0 ? "bg-amber-50" : "bg-white"} border border-gray-300 hover:bg-amber-100`}
                    >
                      <td
                        className="whitespace-nowrap border border-gray-300 px-3 py-2 font-mono"
                        title={invoice.invoiceId}
                      >
                        {formatShortId(invoice.invoiceId)}
                      </td>
                      <td className="whitespace-nowrap border border-gray-300 px-3 py-2">{formatDate(invoice.createdAt)}</td>
                      <td className="whitespace-nowrap border border-gray-300 px-3 py-2">
                        {invoice.items[0]?.maker ?? "-"}
                      </td>
                      <td className="whitespace-nowrap border border-gray-300 px-3 py-2" title={modelSummary.tooltip}>
                        {modelSummary.display}
                      </td>
                      <td className="whitespace-nowrap border border-gray-300 px-3 py-2">{paymentDate}</td>
                      <td className="whitespace-nowrap border border-gray-300 px-3 py-2">{supplierName}</td>
                      <td className="whitespace-nowrap border border-gray-300 px-3 py-2">{stockIn}</td>
                      <td className="whitespace-nowrap border border-gray-300 px-3 py-2">{staffName}</td>
                      <td className="whitespace-nowrap border border-gray-300 px-3 py-2 text-right font-semibold">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="whitespace-nowrap border border-gray-300 px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedInvoiceIds.has(invoice.invoiceId)}
                          onChange={(event) => handleToggleSelect(invoice.invoiceId, event.target.checked)}
                          className="h-4 w-4 accent-slate-700"
                        />
                      </td>
                      <td className="whitespace-nowrap border border-gray-300 px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/sales/purchase-invoice/${
                                invoice.invoiceType === "vendor" ? "vendor" : "hall"
                              }/${invoice.invoiceId}`,
                            )
                          }
                        className="h-8 w-8 rounded-none border border-gray-300 bg-slate-200 text-lg font-bold text-slate-800 shadow-[inset_1px_1px_0px_0px_#ffffff] hover:bg-slate-100"
                          aria-label="詳細"
                        >
                          +
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
