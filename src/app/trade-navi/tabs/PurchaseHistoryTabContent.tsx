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

const docLabelMap: Record<string, string> = {
  "検通": "検",
  "明細": "撤",
  "確認": "確",
};

// TODO: API連携（フィルター条件でサーバーから取得）

type PurchaseHistoryRow = {
  id: string;
  status: TradeStatusKey;
  contractDate: string;
  seller: string;
  maker: string;
  itemName: string;
  category: "pachinko" | "slot" | "others";
  quantity: number;
  amount: number;
  shipmentDate?: string;
  receiveMethod: string;
  documents: string[];
  paymentMethod: string;
  handler: string;
  documentReceivedDate?: string;
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

const purchaseHistoryData: PurchaseHistoryRow[] = [
  {
    id: "P-2025110501",
    status: "completed",
    contractDate: "2025-11-05",
    seller: "株式会社トレードリンク",
    maker: "SANKYO",
    itemName: "P フィーバー機動戦士ガンダムSEED",
    category: "pachinko",
    quantity: 5,
    amount: 1250000,
    shipmentDate: "2025-11-07",
    receiveMethod: "元払",
    documents: ["受注票", "検収"],
    paymentMethod: "振込（前払い）",
    handler: "佐藤",
    documentReceivedDate: "2025-11-06",
  },
  {
    id: "P-2025103008",
    status: "payment_confirmed",
    contractDate: "2025-10-30",
    seller: "有限会社メダルサプライ",
    maker: "大都技研",
    itemName: "L 押忍！番長4",
    category: "slot",
    quantity: 4,
    amount: 960000,
    shipmentDate: "2025-11-01",
    receiveMethod: "引取",
    documents: ["受注票"],
    paymentMethod: "代引（現金）",
    handler: "鈴木",
    documentReceivedDate: "2025-10-31",
  },
  {
    id: "P-2025101204",
    status: "navi_in_progress",
    contractDate: "2025-10-12",
    seller: "株式会社オーシャンパーツ",
    maker: "京楽",
    itemName: "周辺機器（のぼりセット）",
    category: "others",
    quantity: 12,
    amount: 180000,
    shipmentDate: "2025-10-15",
    receiveMethod: "指定便（着払）",
    documents: ["受注票", "確認"],
    paymentMethod: "請求書払い（末締め翌月末）",
    handler: "田中",
    documentReceivedDate: "2025-10-13",
  },
  {
    id: "P-2025092506",
    status: "canceled",
    contractDate: "2025-09-25",
    seller: "株式会社サプライチェーン",
    maker: "三洋",
    itemName: "P 大海物語5",
    category: "pachinko",
    quantity: 3,
    amount: 690000,
    shipmentDate: undefined,
    receiveMethod: "未定",
    documents: ["受注票"],
    paymentMethod: "キャンセル",
    handler: "佐藤",
    documentReceivedDate: undefined,
  },
  {
    id: "P-2025081803",
    status: "shipped",
    contractDate: "2025-08-18",
    seller: "株式会社アーク貿易",
    maker: "ニューギン",
    itemName: "P うる星やつら",
    category: "pachinko",
    quantity: 7,
    amount: 1400000,
    shipmentDate: "2025-08-21",
    receiveMethod: "元払",
    documents: ["受注票", "検収"],
    paymentMethod: "振込（納品後）",
    handler: "鈴木",
    documentReceivedDate: "2025-08-20",
  },
];

const currencyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
});

const dateFormatter = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });

export function PurchaseHistoryTabContent() {
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
    const handlers = Array.from(new Set(purchaseHistoryData.map((row) => row.handler)));
    return ["", ...handlers];
  }, []);

  const filteredRows = useMemo(() => {
    return purchaseHistoryData
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
      render: (row) => <StatusBadge statusKey={row.status} context="history" />,
    },
    { key: "contractDate", label: "締結日", width: "120px", render: (row) => formatDate(row.contractDate) },
    { key: "seller", label: "取引先（売手）", width: "180px" },
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
    { key: "receiveMethod", label: "受取方法", width: "100px" },
    {
      key: "pdf",
      label: "受注票",
      width: "120px",
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/dealings/purchases/${row.id}`);
          }}
          className="inline-flex items-center justify-center rounded px-3 py-1 text-xs font-semibold bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm"
        >
          PDF
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
              className="inline-flex items-center justify-center rounded px-2 py-1 text-xs font-semibold bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm"
            >
              {docLabelMap[doc] ?? doc}
            </button>
          ))}
        </div>
      ),
    },
    {
      key: "paymentMethod",
      label: "決済",
      width: "200px",
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            alert(`支払方法を確認しました: ${row.paymentMethod}`);
          }}
          className="inline-flex items-center justify-center rounded px-3 py-1 text-xs font-semibold bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm"
        >
          振込
        </button>
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
      "取引先（売手）",
      "メーカー",
      "物件名",
      "数量",
      "金額",
      "機械発送日",
      "受取方法",
      "担当者",
    ];

    const rows = filteredRows.map((row) => [
      getStatusLabel(row.status),
      formatDate(row.contractDate) || "",
      row.seller,
      row.maker,
      row.itemName,
      row.quantity.toString(),
      currencyFormatter.format(row.amount),
      formatDate(row.shipmentDate) || "",
      row.receiveMethod,
      row.handler,
    ]);

    const csvContent = [header, ...rows].map((line) => line.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "purchase-history.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen space-y-3 px-4 md:px-6 xl:px-8">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs shadow-sm"
      >
        <div className="flex flex-col gap-2 lg:gap-3">
          <div className="flex flex-wrap items-center gap-3 lg:gap-4">
            <InlineField label="カテゴリ" className="lg:gap-3">
              {([
                { key: "pachinko", label: "パチンコ" },
                { key: "slot", label: "スロット" },
                { key: "others", label: "その他物品" },
              ] as const).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-xs text-neutral-900">
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
            </InlineField>

            <InlineField label="ステータス">
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as FilterState["status"] }))}
                className="h-10 w-full max-w-[180px] rounded border border-slate-300 bg-white px-2 text-xs text-slate-800"
              >
                <option value="all">全て</option>
                <option value="inProgress">進行中</option>
                <option value="completed">承認済・キャンセル済</option>
              </select>
            </InlineField>

            <InlineField label="担当">
              <select
                value={filters.handler}
                onChange={(e) => setFilters((prev) => ({ ...prev, handler: e.target.value }))}
                className="h-10 w-full max-w-[180px] rounded border border-slate-300 bg-white px-2 text-xs text-slate-800"
              >
                {handlerOptions.map((handler) => (
                  <option key={handler} value={handler}>
                    {handler ? handler : "全て"}
                  </option>
                ))}
              </select>
            </InlineField>

            <InlineField label="キーワード" className="lg:ml-auto">
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
                placeholder="売手名や機種名で検索"
                className="h-10 w-full max-w-[280px] rounded border border-slate-300 px-3 text-xs text-slate-800"
              />
            </InlineField>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="submit"
                className="h-10 rounded bg-blue-600 px-4 text-xs font-semibold text-white shadow hover:bg-blue-700"
              >
                照会
              </button>
              <button
                type="button"
                onClick={handleCsvDownload}
                className="h-10 rounded border border-slate-300 px-4 text-xs font-semibold text-neutral-900 hover:bg-slate-50"
              >
                CSV出力
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:gap-4">
            <InlineField label="日付" className="gap-2">
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
                書類受領日
              </label>
            </InlineField>

            <InlineField label="期間" className="gap-2">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                className="h-10 w-full max-w-[150px] rounded border border-slate-300 px-2 text-xs"
              />
              <span className="text-neutral-700">〜</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                className="h-10 w-full max-w-[150px] rounded border border-slate-300 px-2 text-xs"
              />
            </InlineField>
          </div>
        </div>
      </form>

      <NaviTable
        columns={columns}
        rows={filteredRows}
        emptyMessage="該当する取引はありません。"
        onRowClick={(row) => row.id && router.push(`/dealings/purchases/${row.id}`)}
      />
    </section>
  );
}

function InlineField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 ${className ?? ""}`}>
      <span className="whitespace-nowrap text-xs font-semibold text-neutral-700">{label}</span>
      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-900">{children}</div>
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
  return (Object.entries(filter.categories).filter(([, checked]) => checked).map(([key]) => key) as PurchaseHistoryRow["category"][]);
}

function matchKeyword(keyword: string, row: PurchaseHistoryRow) {
  if (!keyword.trim()) return true;
  const lower = keyword.toLowerCase();
  return row.seller.toLowerCase().includes(lower) || row.itemName.toLowerCase().includes(lower);
}

function matchDateRange(filters: FilterState, row: PurchaseHistoryRow) {
  if (!filters.dateFrom && !filters.dateTo) return true;

  const targetDateString =
    filters.dateTarget === "contract"
      ? row.contractDate
      : filters.dateTarget === "shipment"
        ? row.shipmentDate
        : row.documentReceivedDate;

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
