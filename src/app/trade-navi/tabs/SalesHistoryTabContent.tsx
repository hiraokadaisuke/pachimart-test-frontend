"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { NaviTable, type NaviTableColumn } from "@/components/transactions/NaviTable";
import { StatusBadge } from "@/components/transactions/StatusBadge";
import {
  COMPLETED_STATUS_KEYS,
  IN_PROGRESS_STATUS_KEYS,
  TRADE_STATUS_DEFINITIONS,
  type TradeStatusKey,
} from "@/components/transactions/status";

// TODO: API連携（フィルター条件でサーバーから取得）

type SalesHistoryRow = {
  id: string;
  status: TradeStatusKey;
  contractDate: string;
  partner: string;
  maker: string;
  itemName: string;
  category: "pachinko" | "slot" | "others";
  quantity: number;
  amount: number;
  shipmentDate?: string;
  shippingMethod: string;
  documents: string[];
  paymentStatus: string;
  handler: string;
  documentSentDate?: string;
};

type FilterState = {
  categories: {
    pachinko: boolean;
    slot: boolean;
    others: boolean;
  };
  status: "all" | "inProgress" | "completed";
  handler: string;
  dateTarget: "contract" | "shipment" | "document";
  dateFrom: string;
  dateTo: string;
  keyword: string;
};

const salesHistoryData: SalesHistoryRow[] = [
  {
    id: "S-2025110101",
    status: "completed",
    contractDate: "2025-11-01",
    partner: "株式会社アミューズ流通",
    maker: "三洋",
    itemName: "P 北斗の拳9 闘神",
    category: "pachinko",
    quantity: 6,
    amount: 980000,
    shipmentDate: "2025-11-03",
    shippingMethod: "元払",
    documents: ["検通", "明細", "確認"],
    paymentStatus: "入金確認済",
    handler: "田中",
    documentSentDate: "2025-11-02",
  },
  {
    id: "S-2025102803",
    status: "payment_confirmed",
    contractDate: "2025-10-28",
    partner: "有限会社スマイル",
    maker: "サミー",
    itemName: "P とある魔術の禁書目録",
    category: "pachinko",
    quantity: 4,
    amount: 720000,
    shipmentDate: "2025-10-30",
    shippingMethod: "着払",
    documents: ["明細", "確認"],
    paymentStatus: "請求済（確認待ち）",
    handler: "佐藤",
    documentSentDate: "2025-10-29",
  },
  {
    id: "S-2025101507",
    status: "navi_in_progress",
    contractDate: "2025-10-15",
    partner: "株式会社エス・プラン",
    maker: "ユニバーサル",
    itemName: "S バジリスク絆2",
    category: "slot",
    quantity: 3,
    amount: 540000,
    shipmentDate: "2025-10-18",
    shippingMethod: "引取",
    documents: ["検通"],
    paymentStatus: "決済確認待ち",
    handler: "田中",
    documentSentDate: "2025-10-17",
  },
  {
    id: "S-2025092004",
    status: "canceled",
    contractDate: "2025-09-20",
    partner: "株式会社パチテック",
    maker: "京楽",
    itemName: "P 乃木坂46",
    category: "pachinko",
    quantity: 2,
    amount: 360000,
    shipmentDate: undefined,
    shippingMethod: "未発送",
    documents: ["他"],
    paymentStatus: "キャンセル",
    handler: "佐藤",
    documentSentDate: undefined,
  },
  {
    id: "S-2025081208",
    status: "shipped",
    contractDate: "2025-08-12",
    partner: "株式会社ミドルウェーブ",
    maker: "ニューギン",
    itemName: "周辺機器（玉箱セット）",
    category: "others",
    quantity: 20,
    amount: 200000,
    shipmentDate: "2025-08-14",
    shippingMethod: "元払",
    documents: ["検通", "他"],
    paymentStatus: "配送中（代引）",
    handler: "鈴木",
    documentSentDate: "2025-08-13",
  },
];

const currencyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
});

const dateFormatter = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });

export function SalesHistoryTabContent() {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>({
    categories: { pachinko: true, slot: true, others: true },
    status: "all",
    handler: "",
    dateTarget: "contract",
    dateFrom: "",
    dateTo: "",
    keyword: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const handlerOptions = useMemo(() => {
    const handlers = Array.from(new Set(salesHistoryData.map((row) => row.handler)));
    return ["", ...handlers];
  }, []);

  const filteredRows = useMemo(() => {
    return salesHistoryData
      .filter((row) => filtersToCategories(appliedFilters).includes(row.category))
      .filter((row) => matchStatus(appliedFilters.status, row.status))
      .filter((row) => (appliedFilters.handler ? row.handler === appliedFilters.handler : true))
      .filter((row) => matchDateRange(appliedFilters, row))
      .filter((row) => matchKeyword(appliedFilters.keyword, row));
  }, [appliedFilters]);

  const columns: NaviTableColumn[] = [
    {
      key: "status",
      label: "状況",
      width: "120px",
      render: (row) => <StatusBadge statusKey={row.status} />,
    },
    { key: "contractDate", label: "締結日", width: "120px", render: (row) => formatDate(row.contractDate) },
    { key: "partner", label: "取引先", width: "180px" },
    { key: "maker", label: "メーカー", width: "140px" },
    { key: "itemName", label: "物件名", width: "200px" },
    { key: "quantity", label: "数量", width: "80px" },
    {
      key: "amount",
      label: "金額",
      width: "140px",
      render: (row) => <span className="whitespace-nowrap">{currencyFormatter.format(row.amount)}</span>,
    },
    { key: "shipmentDate", label: "機械発送日", width: "140px", render: (row) => formatDate(row.shipmentDate) },
    { key: "shippingMethod", label: "発送方法", width: "100px" },
    {
      key: "pdf",
      label: "受注票",
      width: "120px",
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/dealings/sales/${row.id}`);
          }}
          className="rounded border border-slate-200 px-2 py-1 text-xs text-blue-700 hover:bg-blue-50"
        >
          PDFダウンロード
        </button>
      ),
    },
    {
      key: "documents",
      label: "書類",
      width: "180px",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.documents.map((doc: string) => (
            <button
              type="button"
              key={doc}
              onClick={(e) => {
                e.stopPropagation();
                alert(`${doc} を確認しました`);
              }}
              className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
            >
              {doc}
            </button>
          ))}
        </div>
      ),
    },
    {
      key: "paymentStatus",
      label: "決済",
      width: "180px",
      render: (row) => (
        <div className="space-y-1">
          <div className="text-sm text-slate-700">{row.paymentStatus}</div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              alert(`決済状況を確認: ${row.id}`);
            }}
            className="rounded border border-slate-200 px-2 py-1 text-xs text-blue-700 hover:bg-blue-50"
          >
            確認
          </button>
        </div>
      ),
    },
  ];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const handleCsvDownload = () => {
    const header = [
      "状況",
      "締結日",
      "取引先",
      "メーカー",
      "物件名",
      "数量",
      "金額",
      "機械発送日",
      "発送方法",
      "担当者",
    ];

    const rows = filteredRows.map((row) => [
      getStatusLabel(row.status),
      formatDate(row.contractDate) || "",
      row.partner,
      row.maker,
      row.itemName,
      row.quantity.toString(),
      currencyFormatter.format(row.amount),
      formatDate(row.shipmentDate) || "",
      row.shippingMethod,
      row.handler,
    ]);

    const csvContent = [header, ...rows].map((line) => line.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sales-history.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FilterGroup title="カテゴリ">
            <div className="flex flex-wrap gap-3">
              {([
                { key: "pachinko", label: "パチンコ" },
                { key: "slot", label: "スロット" },
                { key: "others", label: "その他物品" },
              ] as const).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    checked={filters.categories[key]}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        categories: { ...prev.categories, [key]: e.target.checked },
                      }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="ステータス">
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as FilterState["status"] }))}
              className="block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            >
              <option value="all">全て</option>
              <option value="inProgress">進行中</option>
              <option value="completed">承認済・キャンセル済</option>
            </select>
          </FilterGroup>

          <FilterGroup title="担当者">
            <select
              value={filters.handler}
              onChange={(e) => setFilters((prev) => ({ ...prev, handler: e.target.value }))}
              className="block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            >
              {handlerOptions.map((handler) => (
                <option key={handler} value={handler}>
                  {handler ? handler : "全て"}
                </option>
              ))}
            </select>
          </FilterGroup>

          <FilterGroup title="日付フィルター">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-3 text-sm text-slate-700">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="dateTarget"
                    value="contract"
                    checked={filters.dateTarget === "contract"}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateTarget: e.target.value as FilterState["dateTarget"] }))}
                    className="h-4 w-4 text-blue-600"
                  />
                  締結日
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="dateTarget"
                    value="shipment"
                    checked={filters.dateTarget === "shipment"}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateTarget: e.target.value as FilterState["dateTarget"] }))}
                    className="h-4 w-4 text-blue-600"
                  />
                  機械発送日
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="dateTarget"
                    value="document"
                    checked={filters.dateTarget === "document"}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateTarget: e.target.value as FilterState["dateTarget"] }))}
                    className="h-4 w-4 text-blue-600"
                  />
                  書類発送日
                </label>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full rounded border border-slate-300 px-2 py-1"
                />
                <span className="text-slate-500">〜</span>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full rounded border border-slate-300 px-2 py-1"
                />
              </div>
            </div>
          </FilterGroup>

          <FilterGroup title="キーワード検索">
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
              placeholder="相手先名や機種名で検索"
              className="block w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800"
            />
          </FilterGroup>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-3">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            照会
          </button>
          <button
            type="button"
            onClick={handleCsvDownload}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            CSV出力
          </button>
        </div>
      </form>

      <NaviTable
        columns={columns}
        rows={filteredRows}
        emptyMessage="該当する取引はありません。"
        onRowClick={(row) => row.id && router.push(`/dealings/sales/${row.id}`)}
      />
    </section>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-slate-500">{title}</div>
      {children}
    </div>
  );
}

function matchStatus(filter: FilterState["status"], status: TradeStatusKey) {
  if (filter === "all") return true;
  if (filter === "inProgress") return IN_PROGRESS_STATUS_KEYS.includes(status);
  if (filter === "completed") return COMPLETED_STATUS_KEYS.includes(status);
  return true;
}

function filtersToCategories(filter: FilterState) {
  return (Object.entries(filter.categories).filter(([, checked]) => checked).map(([key]) => key) as SalesHistoryRow["category"][]);
}

function matchKeyword(keyword: string, row: SalesHistoryRow) {
  if (!keyword.trim()) return true;
  const lower = keyword.toLowerCase();
  return row.partner.toLowerCase().includes(lower) || row.itemName.toLowerCase().includes(lower);
}

function matchDateRange(filters: FilterState, row: SalesHistoryRow) {
  if (!filters.dateFrom && !filters.dateTo) return true;

  const targetDateString =
    filters.dateTarget === "contract"
      ? row.contractDate
      : filters.dateTarget === "shipment"
        ? row.shipmentDate
        : row.documentSentDate;

  if (!targetDateString) return false;

  const targetDate = new Date(targetDateString).getTime();
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    if (Number.isFinite(from) && targetDate < from) return false;
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo).getTime();
    if (Number.isFinite(to) && targetDate > to) return false;
  }
  return true;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return dateFormatter.format(date);
}

function getStatusLabel(status: TradeStatusKey) {
  return TRADE_STATUS_DEFINITIONS.find((def) => def.key === status)?.label ?? status;
}
