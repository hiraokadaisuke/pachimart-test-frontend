"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { NaviTable, type NaviTableColumn, type SortState } from "@/components/transactions/NaviTable";
import { StatusBadge } from "@/components/transactions/StatusBadge";
import { TRADE_STATUS_DEFINITIONS, type TradeStatusKey } from "@/components/transactions/status";
import { DocumentBadges, type DocumentStatus } from "@/components/transactions/DocumentBadges";
import { TradeMessageModal } from "@/components/transactions/TradeMessageModal";
import { fetchMessagesByNaviId } from "@/lib/messages/api";
import type { TradeMessage } from "@/lib/messages/transform";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { calculateStatementTotals } from "@/lib/trade/calcTotals";
import { loadSalesHistoryForUser } from "@/lib/trade/dataSources";
import { deriveTradeStatusFromTodos } from "@/lib/trade/deriveStatus";
import { getStatementPath } from "@/lib/trade/navigation";
import type { TradeRecord } from "@/lib/trade/types";
import { resolveCurrentTodoKind } from "@/lib/trade/todo";
import { TodoUiDef, todoUiMap } from "@/lib/todo/todoUiMap";

// TODO: API連携（フィルター条件でサーバーから取得）

type SalesHistoryRow = {
  id: string;
  naviId?: number;
  status: TradeStatusKey;
  section: TodoUiDef["section"];
  contractDate: string;
  partner: string;
  maker: string;
  itemName: string;
  category: "pachinko" | "slot" | "others";
  quantity: number;
  amount: number;
  shipmentDate?: string;
  shippingMethod: string;
  documentStatus: DocumentStatus;
  uploadUrl: string;
  paymentCompleted: boolean;
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

const currencyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
});

const dateFormatter = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });

export function SalesHistoryTabContent() {
  const router = useRouter();
  const currentUser = useCurrentDevUser();
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
  const [sortState, setSortState] = useState<SortState>(null);
  const [messageTarget, setMessageTarget] = useState<string | null>(null);
  const [messageNaviId, setMessageNaviId] = useState<number | null>(null);
  const [messages, setMessages] = useState<TradeMessage[]>([]);
  const [rows, setRows] = useState<SalesHistoryRow[]>([]);

  useEffect(() => {
    loadSalesHistoryForUser(currentUser.id)
      .then((trades) => setRows(trades.map(mapTradeToSalesHistoryRow)))
      .catch((error) => console.error("Failed to load sales history", error));
  }, [currentUser.id]);

  const handlerOptions = useMemo(() => {
    const handlers = Array.from(new Set(rows.map((row) => row.handler).filter(Boolean)));
    return ["", ...handlers];
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows
      .filter((row) => filtersToCategories(appliedFilters).includes(row.category))
      .filter((row) => matchStatus(appliedFilters.status, row.status))
      .filter((row) => (appliedFilters.handler ? row.handler === appliedFilters.handler : true))
      .filter((row) => matchDateRange(appliedFilters, row))
      .filter((row) => matchKeyword(appliedFilters.keyword, row));
  }, [appliedFilters, rows]);

  const sortedRows = useMemo(
    () => sortRows(filteredRows, sortState),
    [filteredRows, sortState]
  );

  const getStatementDestination = (row: SalesHistoryRow) =>
    getStatementPath(row.id, row.status, "seller");

  const columns: NaviTableColumn[] = [
    {
      key: "status",
      label: "状況",
      width: "120px",
      sortable: true,
      render: (row) => <StatusBadge statusKey={row.status} context="history" />,
    },
    {
      key: "contractDate",
      label: "成約日",
      width: "120px",
      sortable: true,
      render: (row) => formatDate(row.contractDate),
    },
    {
      key: "partner",
      label: "取引先",
      width: "180px",
      sortable: true,
    },
    {
      key: "maker",
      label: "メーカー",
      width: "140px",
      sortable: true,
    },
    {
      key: "itemName",
      label: "機種名", // ← 物件名 → 機種名 に統一
      width: "200px",
      sortable: true,
    },
    { key: "quantity", label: "数量", width: "80px" },
    {
      key: "amount",
      label: "金額",
      width: "140px",
      sortable: true,
      render: (row) => <span className="whitespace-nowrap">{currencyFormatter.format(row.amount)}</span>,
    },
    {
      key: "shipmentDate",
      label: "機械発送日",
      width: "140px",
      sortable: true,
      render: (row) => formatDate(row.shipmentDate),
    },
    { key: "shippingMethod", label: "発送方法", width: "100px" },
    {
      key: "pdf",
      label: "明細書",
      width: "120px",
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push(getStatementDestination(row as SalesHistoryRow));
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
      width: "220px",
      render: (row) => (
        <DocumentBadges
          status={row.documentStatus}
          onUploadClick={() => router.push(row.uploadUrl)}
        />
      ),
    },
    {
      key: "paymentStatus",
      label: "決済",
      width: "80px",
      render: (row) => (row.paymentCompleted ? "済" : "-"),
    },
    {
      key: "message",
      label: "メッセージ",
      width: "120px",
      render: (row) => (
        <button
          type="button"
          className="inline-flex items-center justify-center rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-[#142B5E] hover:bg-slate-100"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenMessage(row);
          }}
        >
          メッセージ
        </button>
      ),
    },
  ];

  const handleSortChange = (key: string) => {
    setSortState((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  useEffect(() => {
    if (messageNaviId === null) {
      setMessages([]);
      return;
    }

    if (!Number.isInteger(messageNaviId)) {
      console.error("Invalid navi id for messages", messageTarget);
      setMessages([]);
      return;
    }

    fetchMessagesByNaviId(messageNaviId)
      .then(setMessages)
      .catch((error) => {
        console.error(error);
        setMessages([]);
      });
  }, [messageNaviId, messageTarget]);

  const handleOpenMessage = (row: SalesHistoryRow) => {
    setMessageTarget(row.id);

    if (typeof row.naviId === "number" && Number.isInteger(row.naviId)) {
      setMessageNaviId(row.naviId);
      return;
    }

    const parsedId = Number(row.id);
    if (Number.isInteger(parsedId)) {
      setMessageNaviId(parsedId);
      return;
    }

    console.error("Invalid navi id for messages", row.id);
    setMessageNaviId(null);
  };

  const messageThread = messages;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const handleCsvDownload = () => {
    const header = [
      "状況",
      "成約日",
      "取引先",
      "メーカー",
      "機種名",
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
    <section className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen space-y-3 px-4 md:px-6 xl:px-8">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-y-2 gap-x-3 md:gap-y-2 md:gap-x-4">
          <fieldset className="flex w-full flex-wrap items-center gap-3 md:w-auto" aria-label="カテゴリ">
            <legend className="sr-only">カテゴリ</legend>
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
          </fieldset>

          <div className="w-full min-w-[140px] md:w-[170px]">
            <label htmlFor="sales-status" className="sr-only">
              ステータス
            </label>
            <select
              id="sales-status"
              aria-label="ステータス"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as FilterState["status"] }))}
              className="h-10 w-full rounded border border-slate-300 bg-white px-2 text-xs text-slate-800"
            >
              <option value="all">ステータス（全て）</option>
              <option value="inProgress">進行中</option>
              <option value="completed">承認済・キャンセル済</option>
            </select>
          </div>

          <div className="w-full min-w-[140px] md:w-[170px]">
            <label htmlFor="sales-handler" className="sr-only">
              担当
            </label>
            <select
              id="sales-handler"
              aria-label="担当"
              value={filters.handler}
              onChange={(e) => setFilters((prev) => ({ ...prev, handler: e.target.value }))}
              className="h-10 w-full rounded border border-slate-300 bg-white px-2 text-xs text-slate-800"
            >
              {handlerOptions.map((handler) => (
                <option key={handler} value={handler}>
                  {handler ? handler : "担当"}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full flex-1 min-w-[200px]">
            <label htmlFor="sales-keyword" className="sr-only">
              キーワード検索
            </label>
            <input
              id="sales-keyword"
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
              placeholder="相手先名・機種名で検索"
              className="h-10 w-full rounded border border-slate-300 px-3 text-xs text-slate-800"
            />
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
            <span className="sr-only">日付種別</span>
            <label className="flex items-center gap-2 whitespace-nowrap">
              <input
                type="radio"
                name="sales-dateTarget"
            value="contract"
            checked={filters.dateTarget === "contract"}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateTarget: e.target.value as FilterState["dateTarget"] }))}
            className="h-4 w-4 text-blue-600"
          />
          成約日
        </label>
            <label className="flex items-center gap-2 whitespace-nowrap">
              <input
                type="radio"
                name="sales-dateTarget"
                value="shipment"
                checked={filters.dateTarget === "shipment"}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateTarget: e.target.value as FilterState["dateTarget"] }))}
                className="h-4 w-4 text-blue-600"
              />
              機械発送日
            </label>
            <label className="flex items-center gap-2 whitespace-nowrap">
              <input
                type="radio"
                name="sales-dateTarget"
                value="document"
                checked={filters.dateTarget === "document"}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateTarget: e.target.value as FilterState["dateTarget"] }))}
                className="h-4 w-4 text-blue-600"
              />
              書類発送日
            </label>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
            <label htmlFor="sales-date-from" className="sr-only">
              開始日
            </label>
            <input
              id="sales-date-from"
              type="date"
              placeholder="年/月/日"
              value={filters.dateFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
              className="h-10 w-full min-w-[140px] rounded border border-slate-300 px-2 text-xs"
            />
            <span className="text-neutral-700">〜</span>
            <label htmlFor="sales-date-to" className="sr-only">
              終了日
            </label>
            <input
              id="sales-date-to"
              type="date"
              placeholder="年/月/日"
              value={filters.dateTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
              className="h-10 w-full min-w-[140px] rounded border border-slate-300 px-2 text-xs"
            />
          </div>

          <div className="ml-auto flex w-full items-center justify-end gap-2 md:w-auto">
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
      </form>

        <NaviTable
          columns={columns}
          rows={sortedRows}
          emptyMessage="該当する取引はありません。"
        onRowClick={(row) => row.id && router.push(getStatementDestination(row as SalesHistoryRow))}
        sortState={sortState}
        onSortChange={handleSortChange}
      />

      <TradeMessageModal
        open={messageTarget !== null}
        tradeId={messageTarget}
        messages={messageThread}
        onClose={() => {
          setMessageTarget(null);
          setMessageNaviId(null);
        }}
      />
    </section>
  );
}

function mapTradeToSalesHistoryRow(trade: TradeRecord): SalesHistoryRow {
  const primaryItem = trade.items[0];
  const totalQuantity = trade.quantity ?? trade.items.reduce((sum, item) => sum + (item.qty ?? 1), 0);
  const totalAmount =
    trade.totalAmount ?? calculateStatementTotals(trade.items, trade.taxRate ?? 0.1).total;
  const status = resolveCurrentTodoKind(trade);
  const derivedStatus = deriveTradeStatusFromTodos(trade);
  const section = todoUiMap[status]?.section ?? "approval";

  return {
    id: trade.id,
    naviId: trade.naviId,
    status,
    section,
    contractDate: trade.contractDate ?? trade.createdAt ?? "",
    partner: trade.buyerName ?? trade.buyer.companyName ?? "",
    maker: trade.makerName ?? primaryItem?.maker ?? "-",
    itemName: trade.itemName ?? primaryItem?.itemName ?? "商品",
    category: getCategoryFromTrade(trade),
    quantity: totalQuantity,
    amount: totalAmount,
    shipmentDate: trade.shipmentDate,
    shippingMethod: trade.shippingMethod ?? trade.receiveMethod ?? "未定",
    documentStatus: buildDocumentStatusFromTrade(derivedStatus, section),
    uploadUrl: `/dealings/sales/${trade.id}/documents`,
    paymentCompleted: Boolean(trade.paymentDate) || section === "completed",
    handler: trade.handlerName ?? "",
    documentSentDate: trade.documentSentDate,
  };
}

function getCategoryFromTrade(trade: TradeRecord): SalesHistoryRow["category"] {
  if (trade.category === "pachinko" || trade.category === "slot" || trade.category === "others") {
    return trade.category;
  }
  return "others";
}

function buildDocumentStatusFromTrade(
  derivedStatus: TradeRecord["status"],
  section: TodoUiDef["section"]
): DocumentStatus {
  const isCompleted = section === "completed" || derivedStatus === "COMPLETED";
  const isCanceled = derivedStatus === "CANCELED" || section === "canceled";
  return {
    inspection: isCompleted,
    removal: isCompleted,
    confirmation: isCompleted,
    other: isCanceled,
  };
}

function sortRows(rows: SalesHistoryRow[], sortState: SortState) {
  if (!sortState) return rows;
  const { key, direction } = sortState;
  const sorted = [...rows].sort((a, b) => {
    const aValue = getSortableValue(a, key);
    const bValue = getSortableValue(b, key);

    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    if (typeof aValue === "number" && typeof bValue === "number") {
      return direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    return direction === "asc"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  return sorted;
}

function getSortableValue(row: SalesHistoryRow, key: string) {
  switch (key) {
    case "contractDate":
      return new Date(row.contractDate).getTime();
    case "partner":
      return row.partner;
    case "maker":
      return row.maker;
    case "itemName":
      return row.itemName;
    case "amount":
      return row.amount;
    case "shipmentDate":
      return row.shipmentDate ? new Date(row.shipmentDate).getTime() : undefined;
    case "status":
      return (
        TRADE_STATUS_DEFINITIONS.findIndex((def) => def.key === row.status) ?? row.status
      );
    default:
      return undefined;
  }
}

function matchStatus(filter: FilterState["status"], status: TradeStatusKey) {
  if (filter === "all") return true;
  const section = todoUiMap[status]?.section;
  if (!section) return false;
  if (filter === "inProgress") return section !== "completed" && section !== "canceled";
  if (filter === "completed") return section === "completed" || section === "canceled";
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
