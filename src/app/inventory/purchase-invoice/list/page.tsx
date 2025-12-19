"use client";

import { useEffect, useMemo, useState } from "react";

import { loadPurchaseInvoices } from "@/lib/demo-data/purchaseInvoices";
import { formatCurrency, formatDate } from "@/lib/demo-data/demoInventory";
import type { PurchaseInvoice } from "@/types/purchaseInvoices";

const greenHeaderClass = "bg-emerald-700 text-white";
const greenLabelCell = "bg-emerald-100 text-emerald-900";
const borderCell = "border border-emerald-200";

export default function PurchaseInvoiceListPage() {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
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

  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);

  useEffect(() => {
    setInvoices(loadPurchaseInvoices());
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesId = invoice.invoiceId.toLowerCase().includes(filters.id.toLowerCase());
      const matchesMaker = invoice.items.some((item) =>
        item.maker.toLowerCase().includes(filters.maker.toLowerCase()),
      );
      const matchesModel = invoice.items.some((item) =>
        item.machineName.toLowerCase().includes(filters.model.toLowerCase()),
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

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg border border-emerald-800 shadow">
        <div className={`${greenHeaderClass} px-4 py-3`}>
          <h1 className="text-lg font-semibold">購入伝票検索</h1>
        </div>

        <div className="bg-emerald-50">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed border-collapse text-sm text-neutral-800">
              <tbody>
                <tr className="divide-x divide-emerald-200">
                  <th className={`${greenLabelCell} ${borderCell} w-32 px-4 py-3 text-left font-semibold`}>
                    ID
                  </th>
                  <td className={`${borderCell} px-4 py-3`}>
                    <input
                      type="text"
                      value={filters.id}
                      onChange={(e) => handleInputChange("id", e.target.value)}
                      className="w-full rounded border border-emerald-200 px-3 py-2 text-sm"
                      placeholder="購入伝票ID"
                    />
                  </td>
                  <th className={`${greenLabelCell} ${borderCell} w-36 px-4 py-3 text-left font-semibold`}>
                    伝票発行日
                  </th>
                  <td className={`${borderCell} px-4 py-3`}>
                    <input
                      type="date"
                      value={filters.issueDate}
                      onChange={(e) => handleInputChange("issueDate", e.target.value)}
                      className="w-full rounded border border-emerald-200 px-3 py-2 text-sm"
                    />
                  </td>
                  <th className={`${greenLabelCell} ${borderCell} w-32 px-4 py-3 text-left font-semibold`}>
                    メーカー
                  </th>
                  <td className={`${borderCell} px-4 py-3`}>
                    <select
                      value={filters.maker}
                      onChange={(e) => handleInputChange("maker", e.target.value)}
                      className="w-full rounded border border-emerald-200 px-3 py-2 text-sm"
                    >
                      <option value="">すべて</option>
                      <option value="サミー">サミー</option>
                      <option value="三洋">三洋</option>
                      <option value="その他">その他</option>
                    </select>
                  </td>
                  <th className={`${greenLabelCell} ${borderCell} w-32 px-4 py-3 text-left font-semibold`}>
                    機種名
                  </th>
                  <td className={`${borderCell} px-4 py-3`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={filters.model}
                        onChange={(e) => handleInputChange("model", e.target.value)}
                        className="w-full rounded border border-emerald-200 px-3 py-2 text-sm"
                        placeholder="機種名"
                      />
                      <span className="rounded border border-emerald-200 bg-white px-2 py-2 text-xs text-emerald-700 shadow-inner">
                        🔍
                      </span>
                    </div>
                  </td>
                </tr>

                <tr className="divide-x divide-emerald-200">
                  <th className={`${greenLabelCell} ${borderCell} px-4 py-3 text-left font-semibold`}>表示数</th>
                  <td className={`${borderCell} px-4 py-3`}>
                    <select
                      value={filters.displayCount}
                      onChange={(e) => handleInputChange("displayCount", e.target.value)}
                      className="w-full rounded border border-emerald-200 px-3 py-2 text-sm"
                    >
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </td>
                  <th className={`${greenLabelCell} ${borderCell} px-4 py-3 text-left font-semibold`}>入庫日</th>
                  <td className={`${borderCell} px-4 py-3`}>
                    <input
                      type="date"
                      value={filters.receiveDate}
                      onChange={(e) => handleInputChange("receiveDate", e.target.value)}
                      className="w-full rounded border border-emerald-200 px-3 py-2 text-sm"
                    />
                  </td>
                  <th className={`${greenLabelCell} ${borderCell} px-4 py-3 text-left font-semibold`}>担当</th>
                  <td className={`${borderCell} px-4 py-3`}>
                    <select
                      value={filters.staff}
                      onChange={(e) => handleInputChange("staff", e.target.value)}
                      className="w-full rounded border border-emerald-200 px-3 py-2 text-sm"
                    >
                      <option value="">すべて</option>
                      <option value="田中">田中</option>
                      <option value="佐藤">佐藤</option>
                    </select>
                  </td>
                  <th className={`${greenLabelCell} ${borderCell} px-4 py-3 text-left font-semibold`}>仕入先</th>
                  <td className={`${borderCell} px-4 py-3`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={filters.supplier}
                        onChange={(e) => handleInputChange("supplier", e.target.value)}
                        className="w-full rounded border border-emerald-200 px-3 py-2 text-sm"
                        placeholder="仕入先"
                      />
                      <button
                        type="button"
                        className="whitespace-nowrap rounded border border-amber-400 bg-amber-300 px-3 py-2 text-xs font-semibold text-amber-900 shadow"
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
                        className="rounded border border-amber-500 bg-amber-400 px-8 py-2 text-sm font-semibold text-amber-900 shadow hover:bg-amber-300"
                      >
                        検索する
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="rounded border border-emerald-300 bg-white px-6 py-2 text-sm font-semibold text-emerald-800 shadow hover:bg-emerald-50"
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
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-2 rounded-full bg-emerald-700" aria-hidden />
          <h2 className="text-xl font-semibold text-emerald-800">購入伝票リスト</h2>
        </div>

        <div className="overflow-x-auto rounded-lg border border-emerald-800 bg-white shadow">
          <table className="min-w-full table-fixed border-collapse text-sm text-neutral-800">
            <thead>
              <tr className={`${greenHeaderClass} border border-emerald-800 text-left text-xs font-semibold uppercase tracking-wide`}>
                {["購入伝票ID", "伝票発行日", "メーカー名", "機種名", "仕入先", "入庫日", "担当", "合計金額", "選択", "詳細"].map((label) => (
                  <th key={label} className="border border-emerald-800 px-3 py-3 whitespace-nowrap">
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
                  <td colSpan={10} className="border border-emerald-200 px-4 py-6 text-center text-sm text-neutral-600">
                    作成済みの購入伝票はありません。
                  </td>
                </tr>
              ) : (
                limitedInvoices.map((invoice, index) => (
                  <tr
                    key={invoice.invoiceId}
                    className={`${index % 2 === 0 ? "bg-amber-50" : "bg-white"} border border-emerald-200 hover:bg-amber-100`}
                  >
                    <td className="whitespace-nowrap border border-emerald-200 px-3 py-2 font-mono">{invoice.invoiceId}</td>
                    <td className="whitespace-nowrap border border-emerald-200 px-3 py-2">{formatDate(invoice.createdAt)}</td>
                    <td className="whitespace-nowrap border border-emerald-200 px-3 py-2">
                      {invoice.items[0]?.maker ?? "-"}
                    </td>
                    <td className="whitespace-nowrap border border-emerald-200 px-3 py-2">
                      {invoice.displayTitle ?? invoice.items[0]?.machineName ?? "-"}
                    </td>
                    <td className="whitespace-nowrap border border-emerald-200 px-3 py-2">
                      {invoice.partnerName ?? "-"}
                    </td>
                    <td className="whitespace-nowrap border border-emerald-200 px-3 py-2">-</td>
                    <td className="whitespace-nowrap border border-emerald-200 px-3 py-2">-</td>
                    <td className="whitespace-nowrap border border-emerald-200 px-3 py-2 text-right font-semibold">
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                    <td className="whitespace-nowrap border border-emerald-200 px-3 py-2 text-center">
                      <input type="checkbox" className="h-4 w-4 accent-emerald-600" />
                    </td>
                    <td className="whitespace-nowrap border border-emerald-200 px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(invoice)}
                        className="h-8 w-8 rounded-full border border-amber-500 bg-amber-400 text-lg font-bold text-amber-900 shadow hover:bg-amber-300"
                        aria-label="詳細"
                      >
                        +
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-4xl rounded-lg border border-emerald-800 bg-white shadow-lg">
            <div className={`${greenHeaderClass} flex items-center justify-between px-5 py-3`}>
              <div>
                <div className="text-lg font-semibold">{selectedInvoice.invoiceId}</div>
                <div className="text-sm opacity-90">{selectedInvoice.partnerName ?? selectedInvoice.invoiceType.toUpperCase()}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded border border-white/50 bg-white/20 px-3 py-1 text-sm font-semibold text-white hover:bg-white/30"
              >
                閉じる
              </button>
            </div>

            <div className="overflow-x-auto bg-emerald-50 p-4">
              <table className="min-w-full table-fixed border-collapse text-sm text-neutral-800">
                <thead>
                  <tr className={`${greenHeaderClass} text-left text-xs font-semibold uppercase tracking-wide`}>
                    {[
                      "メーカー",
                      "機種",
                      "数量",
                      "単価",
                      "金額",
                    ].map((label) => (
                      <th key={label} className="border border-emerald-800 px-3 py-2 whitespace-nowrap">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item) => (
                    <tr key={`${selectedInvoice.invoiceId}-${item.inventoryId}`} className="bg-white">
                      <td className="whitespace-nowrap border border-emerald-200 px-3 py-2">{item.maker}</td>
                      <td className="whitespace-nowrap border border-emerald-200 px-3 py-2">{item.machineName}</td>
                      <td className="whitespace-nowrap border border-emerald-200 px-3 py-2 text-right">{item.quantity}</td>
                      <td className="whitespace-nowrap border border-emerald-200 px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="whitespace-nowrap border border-emerald-200 px-3 py-2 text-right">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
