"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { loadSalesInvoices } from "@/lib/demo-data/salesInvoices";

interface SalesInvoiceRow {
  id: string;
  type: "vendor" | "hall";
  issueDate: string;
  maker: string;
  model: string;
  customer: string;
  staff: string;
  totalAmount: number;
}

const initialInvoices: SalesInvoiceRow[] = [
  {
    id: "S-V-230001",
    type: "vendor",
    issueDate: "2023-03-12",
    maker: "サミー",
    model: "パチスロ炎舞",
    customer: "株式会社あさひ商事",
    staff: "木村",
    totalAmount: 328000,
  },
  {
    id: "S-H-230014",
    type: "hall",
    issueDate: "2023-04-02",
    maker: "京楽",
    model: "ぱちんこ銀河伝説",
    customer: "ダイナム渋谷店",
    staff: "佐々木",
    totalAmount: 742000,
  },
  {
    id: "S-V-230019",
    type: "vendor",
    issueDate: "2023-05-18",
    maker: "三洋",
    model: "海物語ライト",
    customer: "株式会社イーストトレーディング",
    staff: "高橋",
    totalAmount: 215000,
  },
  {
    id: "S-H-230025",
    type: "hall",
    issueDate: "2023-06-01",
    maker: "平和",
    model: "ルパン三世MAX",
    customer: "メガガイア新宿店",
    staff: "鈴木",
    totalAmount: 980000,
  },
  {
    id: "S-V-230028",
    type: "vendor",
    issueDate: "2023-06-22",
    maker: "北電子",
    model: "ジャグラーSP",
    customer: "北斗商会",
    staff: "田中",
    totalAmount: 465000,
  },
  {
    id: "S-H-230033",
    type: "hall",
    issueDate: "2023-07-09",
    maker: "大都技研",
    model: "番長ZERO",
    customer: "キング観光難波店",
    staff: "山本",
    totalAmount: 588000,
  },
  {
    id: "S-V-230037",
    type: "vendor",
    issueDate: "2023-08-15",
    maker: "SANKYO",
    model: "フィーバーX",
    customer: "株式会社ロータス",
    staff: "加藤",
    totalAmount: 312000,
  },
  {
    id: "S-H-230041",
    type: "hall",
    issueDate: "2023-09-04",
    maker: "サミー",
    model: "パチスロ炎舞",
    customer: "キコーナ阪神店",
    staff: "斎藤",
    totalAmount: 702000,
  },
];

const inputCell =
  "w-full rounded-none border border-gray-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-600";

export default function SalesInvoiceListPage() {
  const [invoices, setInvoices] = useState<SalesInvoiceRow[]>(initialInvoices);
  const [formValues, setFormValues] = useState({
    id: "",
    maker: "",
    model: "",
    issueDate: "",
    staff: "",
    customer: "",
    displayCount: "50",
  });
  const [appliedFilters, setAppliedFilters] = useState(formValues);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredInvoices = useMemo(() => {
    const filtered = invoices
      .filter((invoice) => invoice.id.toLowerCase().includes(appliedFilters.id.toLowerCase()))
      .filter((invoice) => invoice.maker.toLowerCase().includes(appliedFilters.maker.toLowerCase()))
      .filter((invoice) => invoice.model.toLowerCase().includes(appliedFilters.model.toLowerCase()))
      .filter((invoice) => invoice.customer.toLowerCase().includes(appliedFilters.customer.toLowerCase()))
      .filter((invoice) => invoice.staff.toLowerCase().includes(appliedFilters.staff.toLowerCase()))
      .filter((invoice) => {
        if (!appliedFilters.issueDate) return true;
        return invoice.issueDate === appliedFilters.issueDate;
      });

    const limit = Number(appliedFilters.displayCount) || filtered.length;
    return filtered.slice(0, limit);
  }, [appliedFilters, invoices]);

  useEffect(() => {
    const stored = loadSalesInvoices();
    const mapped: SalesInvoiceRow[] = stored.map((invoice) => ({
      id: invoice.invoiceId,
      type: invoice.invoiceType,
      issueDate: (invoice.issuedDate ?? "").replaceAll("/", "-") || invoice.createdAt.slice(0, 10),
      maker: invoice.items[0]?.maker ?? "",
      model: invoice.items[0]?.productName ?? "",
      customer: invoice.vendorName ?? "",
      staff: invoice.staff ?? "",
      totalAmount: invoice.totalAmount ?? invoice.subtotal ?? 0,
    }));
    setInvoices([...mapped, ...initialInvoices]);
  }, []);

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectPage = () => {
    setSelectedIds(new Set(filteredInvoices.map((invoice) => invoice.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleDelete = () => {
    if (selectedIds.size === 0) return;
    setInvoices((prev) => prev.filter((invoice) => !selectedIds.has(invoice.id)));
    setSelectedIds(new Set());
  };

  const handleSearch = () => {
    setAppliedFilters(formValues);
  };

  const handleReset = () => {
    const resetValues = {
      id: "",
      maker: "",
      model: "",
      issueDate: "",
      staff: "",
      customer: "",
      displayCount: "50",
    };
    setFormValues(resetValues);
    setAppliedFilters(resetValues);
    setSelectedIds(new Set());
  };

  const formatCurrency = (value: number) => value.toLocaleString("ja-JP");

  const searchRowClass = "border border-gray-300";
  const headerCellClass = "border border-gray-300 px-3 py-2 text-sm";

  return (
    <div className="space-y-5 py-3 text-slate-900 mx-[1cm]">
      <div className="space-y-2">
        <div className="flex items-center gap-3 bg-slate-600 px-3 py-2 text-white">
          <span className="h-3.5 w-3.5 rounded-full bg-white" aria-hidden />
          <h1 className="text-xl font-bold text-white">販売伝票一覧</h1>
        </div>
        <div className="border-b border-dashed border-gray-300" />
      </div>

      <div className="overflow-hidden border border-gray-300 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-600 text-white font-bold">
              <th className={`${headerCellClass} w-32`}>ID</th>
              <th className={`${headerCellClass} w-64`}>メーカー</th>
              <th className={`${headerCellClass} w-64`}>機種名</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-amber-50">
              <td className={searchRowClass}>
                <input
                  type="text"
                  value={formValues.id}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, id: e.target.value }))}
                  className={inputCell}
                />
              </td>
              <td className={searchRowClass}>
                <select
                  value={formValues.maker}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, maker: e.target.value }))}
                  className={inputCell}
                >
                  <option value="">指定なし</option>
                  <option value="サミー">サミー</option>
                  <option value="SANKYO">SANKYO</option>
                  <option value="京楽">京楽</option>
                  <option value="三洋">三洋</option>
                  <option value="北電子">北電子</option>
                  <option value="大都技研">大都技研</option>
                </select>
              </td>
              <td className={searchRowClass}>
                <div className="flex items-center gap-2">
                  <select
                    value={formValues.model}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, model: e.target.value }))}
                    className={`${inputCell} w-full`}
                  >
                    <option value="">指定なし</option>
                    <option value="パチスロ炎舞">パチスロ炎舞</option>
                    <option value="ぱちんこ銀河伝説">ぱちんこ銀河伝説</option>
                    <option value="海物語ライト">海物語ライト</option>
                    <option value="ルパン三世MAX">ルパン三世MAX</option>
                    <option value="ジャグラーSP">ジャグラーSP</option>
                    <option value="番長ZERO">番長ZERO</option>
                    <option value="フィーバーX">フィーバーX</option>
                  </select>
                  <button
                    type="button"
                    className="min-w-[32px] border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800"
                  >
                    🔍
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-600 text-white font-bold">
              <th className={`${headerCellClass} w-32`}>表示数</th>
              <th className={`${headerCellClass} w-56`}>伝票発行日</th>
              <th className={`${headerCellClass} w-56`}>販売担当</th>
              <th className={`${headerCellClass}`}>販売先</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-amber-50">
              <td className={searchRowClass}>
                <select
                  value={formValues.displayCount}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, displayCount: e.target.value }))}
                  className={inputCell}
                >
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                </select>
              </td>
              <td className={searchRowClass}>
                <input
                  type="date"
                  value={formValues.issueDate}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, issueDate: e.target.value }))}
                  className={inputCell}
                />
              </td>
              <td className={searchRowClass}>
                <select
                  value={formValues.staff}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, staff: e.target.value }))}
                  className={inputCell}
                >
                  <option value="">指定なし</option>
                  <option value="木村">木村</option>
                  <option value="佐々木">佐々木</option>
                  <option value="高橋">高橋</option>
                  <option value="鈴木">鈴木</option>
                  <option value="田中">田中</option>
                  <option value="山本">山本</option>
                  <option value="加藤">加藤</option>
                  <option value="斎藤">斎藤</option>
                </select>
              </td>
              <td className={searchRowClass}>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formValues.customer}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, customer: e.target.value }))}
                    className={`${inputCell} w-full`}
                  />
                  <button
                    type="button"
                    className="min-w-[96px] border border-gray-300 bg-white px-4 py-1 text-xs font-semibold text-slate-800"
                  >
                    販売先検索
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-center gap-6 border-t border-gray-300 bg-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={handleSearch}
            className="min-w-[120px] border border-gray-300 bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-[inset_1px_1px_0px_0px_#ffffff]"
          >
            検索する
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="min-w-[120px] border border-gray-300 bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-[inset_1px_1px_0px_0px_#ffffff]"
          >
            リセット
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 border border-gray-300 bg-slate-600 px-3 py-2 text-sm font-bold text-white">
        <span className="h-4 w-1 bg-white" aria-hidden />
        <span>販売伝票リスト</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-900">
        <span className="border border-gray-300 bg-white px-3 py-1">PAGE:[ 1 ] 1-7番目表示</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
        <button
          type="button"
          onClick={handleDelete}
          className="border border-gray-300 bg-white px-3 py-1"
        >
          削除
        </button>
        <button
          type="button"
          className="border border-gray-300 bg-white px-3 py-1"
        >
          結合
        </button>
        <button
          type="button"
          onClick={handleSelectPage}
          className="border border-gray-300 bg-white px-3 py-1"
        >
          ページ内全選択
        </button>
        <button
          type="button"
          onClick={handleClearSelection}
          className="border border-gray-300 bg-white px-3 py-1"
        >
          全解除
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-300 bg-white">
        <table className="min-w-full border-collapse text-sm text-slate-900">
          <thead>
            <tr className="bg-slate-600 text-white font-bold">
              <th className="border border-gray-300 px-3 py-2 text-left">販売伝票ID</th>
              <th className="border border-gray-300 px-3 py-2 text-left">伝票発行日</th>
              <th className="border border-gray-300 px-3 py-2 text-left">メーカー名</th>
              <th className="border border-gray-300 px-3 py-2 text-left">機種名</th>
              <th className="border border-gray-300 px-3 py-2 text-left">販売先</th>
              <th className="border border-gray-300 px-3 py-2 text-left">区分</th>
              <th className="border border-gray-300 px-3 py-2 text-left">担当</th>
              <th className="border border-gray-300 px-3 py-2 text-right">合計金額</th>
              <th className="border border-gray-300 px-3 py-2 text-center">選択</th>
              <th className="border border-gray-300 px-3 py-2 text-center">詳細</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={10} className="border border-gray-300 px-4 py-8 text-center text-sm text-slate-700">
                  該当データがありません。
                </td>
              </tr>
            )}
            {filteredInvoices.map((invoice, index) => {
              const rowColor = index % 2 === 0 ? "bg-amber-50" : "bg-white";
              const detailHref =
                invoice.type === "vendor"
                  ? `/inventory/sales-invoice/vendor/${invoice.id}`
                  : `/inventory/sales-invoice/hall/${invoice.id}`;
              const typeLabel = invoice.type === "vendor" ? "業者" : invoice.type === "hall" ? "ホール" : "-";
              return (
                <tr key={invoice.id} className={`${rowColor}`}>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">{invoice.id}</td>
                  <td className="border border-gray-300 px-3 py-2">{invoice.issueDate.replaceAll("-", "/")}</td>
                  <td className="border border-gray-300 px-3 py-2">{invoice.maker}</td>
                  <td className="border border-gray-300 px-3 py-2">{invoice.model}</td>
                  <td className="border border-gray-300 px-3 py-2">{invoice.customer}</td>
                  <td className="border border-gray-300 px-3 py-2">{typeLabel}</td>
                  <td className="border border-gray-300 px-3 py-2">{invoice.staff}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{formatCurrency(invoice.totalAmount)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(invoice.id)}
                      onChange={(e) => toggleSelect(invoice.id, e.target.checked)}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <Link
                      href={detailHref}
                      className="inline-flex h-7 w-7 items-center justify-center border border-gray-300 bg-slate-200 text-base font-bold text-slate-800 shadow-[inset_1px_1px_0px_0px_#ffffff]"
                    >
                      ＋
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-900">
        <span className="border border-gray-300 bg-white px-3 py-1">PAGE:[ 1 ] 1-7番目表示</span>
      </div>
    </div>
  );
}
