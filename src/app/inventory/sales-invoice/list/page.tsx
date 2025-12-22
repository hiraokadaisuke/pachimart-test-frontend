"use client";

import { useEffect, useMemo, useState } from "react";

import { loadSalesInvoices } from "@/lib/demo-data/salesInvoices";
import type { SalesInvoice } from "@/types/salesInvoices";

const formatCurrency = (value?: number) => {
  if (value == null) return "-";
  return value.toLocaleString("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  });
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("ja-JP");
};

export default function SalesInvoiceListPage() {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    setInvoices(loadSalesInvoices());
  }, []);

  const filtered = useMemo(() => {
    const lower = keyword.trim().toLowerCase();
    if (!lower) return invoices;
    return invoices.filter((invoice) => {
      const target = `${invoice.invoiceId} ${invoice.partnerName} ${invoice.staff ?? ""}`.toLowerCase();
      return target.includes(lower);
    });
  }, [invoices, keyword]);

  return (
    <div className="space-y-4 px-4 py-2">
      <div className="flex items-center gap-3">
        <span className="h-3.5 w-3.5 rounded-full bg-green-600" aria-hidden />
        <h1 className="text-xl font-bold text-slate-800">販売伝票一覧</h1>
      </div>
      <div className="border-b border-dashed border-slate-400" />

      <div className="flex flex-wrap items-center gap-3 rounded-sm border border-gray-300 bg-slate-50 px-4 py-3 text-sm text-slate-800">
        <span className="font-semibold">検索</span>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="伝票ID / 販売先 / 担当"
          className="w-64 rounded-none border border-gray-400 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
        <span className="text-xs text-slate-600">登録順に最新が上に表示されます</span>
      </div>

      <div className="overflow-x-auto border border-gray-400 bg-white">
        <table className="min-w-full border-collapse text-sm text-slate-900">
          <thead>
            <tr className="bg-slate-200 text-center font-semibold">
              <th className="border border-gray-400 px-3 py-2">伝票ID</th>
              <th className="border border-gray-400 px-3 py-2">発行日</th>
              <th className="border border-gray-400 px-3 py-2">販売先</th>
              <th className="border border-gray-400 px-3 py-2">担当</th>
              <th className="border border-gray-400 px-3 py-2">明細数</th>
              <th className="border border-gray-400 px-3 py-2">合計金額</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-gray-400 px-4 py-6 text-center text-sm text-slate-700">
                  作成済みの販売伝票はありません
                </td>
              </tr>
            ) : (
              filtered.map((invoice) => (
                <tr key={invoice.invoiceId} className="text-center">
                  <td className="border border-gray-400 px-3 py-2 font-mono text-sm">{invoice.invoiceId}</td>
                  <td className="border border-gray-400 px-3 py-2">{formatDate(invoice.issuedDate)}</td>
                  <td className="border border-gray-400 px-3 py-2 text-left">{invoice.partnerName}</td>
                  <td className="border border-gray-400 px-3 py-2">{invoice.staff ?? "-"}</td>
                  <td className="border border-gray-400 px-3 py-2">{invoice.items.length}</td>
                  <td className="border border-gray-400 px-3 py-2 text-right">{formatCurrency(invoice.totalAmount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
