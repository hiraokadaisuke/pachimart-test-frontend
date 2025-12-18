"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NaviTable, NaviTableColumn } from "@/components/transactions/NaviTable";
import { StatusBadge } from "@/components/transactions/StatusBadge";
import { TransactionFilterBar } from "@/components/transactions/TransactionFilterBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { type TradeStatusKey } from "@/components/transactions/status";
import { TradeMessageModal } from "@/components/transactions/TradeMessageModal";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { getMessagesForTrade } from "@/lib/dummyMessages";
import { calculateStatementTotals } from "@/lib/trade/calcTotals";
import { getInProgressDescription } from "@/lib/trade/copy";
import { getStatementPath } from "@/lib/trade/navigation";
import {
  TRADE_STORAGE_KEY,
  completeTodoForTrade,
  loadAllTrades,
} from "@/lib/trade/storage";
import { TradeRecord } from "@/lib/trade/types";
import { getTodoPresentation } from "@/lib/trade/todo";
import { todoUiMap } from "@/lib/todo/todoUiMap";

const SECTION_LABELS = {
  approval: todoUiMap["application_sent"],
  payment: todoUiMap["application_approved"],
  confirmation: todoUiMap["payment_confirmed"],
  completed: todoUiMap["trade_completed"],
  canceled: todoUiMap["trade_canceled"],
} as const;

type TradeRow = {
  id: string;
  status: TradeStatusKey;
  updatedAt: string;
  partnerName: string;
  makerName: string;
  itemName: string;
  quantity: number;
  totalAmount: number;
  scheduledShipDate: string;
  sellerUserId: string;
  buyerUserId: string;
  sellerName: string;
  buyerName: string;
  kind: "buy" | "sell";
  section: keyof typeof SECTION_LABELS;
  description: string;
  primaryActionLabel?: string;
  isOpen: boolean;
};

function formatCurrency(amount: number) {
  const formatter = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });
  return formatter.format(amount);
}

function formatDateTime(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildTradeRow(trade: TradeRecord, viewerId: string): TradeRow {
  const totals = calculateStatementTotals(trade.items, trade.taxRate ?? 0.1);
  const primaryItem = trade.items[0];
  const totalQty = trade.items.reduce((sum, item) => sum + (item.qty ?? 1), 0);
  const sellerUserId = trade.sellerUserId ?? trade.seller.userId ?? "seller";
  const buyerUserId = trade.buyerUserId ?? trade.buyer.userId ?? "buyer";
  const updatedAtLabel = formatDateTime(trade.updatedAt ?? trade.createdAt ?? new Date().toISOString());
  const scheduledShipDate = trade.contractDate ? trade.contractDate.slice(0, 10) : "-";
  const isSeller = sellerUserId === viewerId;
  const kind = isSeller ? ("sell" as const) : ("buy" as const);
  const todo = getTodoPresentation(trade, kind === "buy" ? "buyer" : "seller");

  return {
    id: trade.id,
    status: todo.todoKind,
    updatedAt: updatedAtLabel,
    partnerName: isSeller ? trade.buyer.companyName : trade.seller.companyName,
    makerName: primaryItem?.maker ?? "-",
    itemName: primaryItem?.itemName ?? "商品",
    quantity: totalQty,
    totalAmount: totals.total,
    scheduledShipDate,
    sellerUserId,
    buyerUserId,
    sellerName: trade.seller.companyName,
    buyerName: trade.buyer.companyName,
    kind,
    section: todo.section,
    description: todo.description,
    primaryActionLabel: todo.primaryAction?.label,
    isOpen: !!todo.activeTodo,
  };
}

export function InProgressTabContent() {
  const currentUser = useCurrentDevUser();
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"all" | "inProgress" | "completed">("inProgress");
  const [keyword, setKeyword] = useState("");
  const [messageTarget, setMessageTarget] = useState<string | null>(null);

  const filterTrades = useCallback(
    (trades: TradeRow[]) => {
      const keywordLower = keyword.toLowerCase();

      return trades
        .filter(
          (trade) => trade.sellerUserId === currentUser.id || trade.buyerUserId === currentUser.id
        )
        .filter((trade) => {
          if (statusFilter === "inProgress") return trade.isOpen;
          if (statusFilter === "completed")
            return !trade.isOpen || trade.section === "completed" || trade.section === "canceled";
          return true;
        })
        .filter((trade) => {
          if (!keywordLower) return true;
          return (
            trade.itemName.toLowerCase().includes(keywordLower) ||
            trade.partnerName.toLowerCase().includes(keywordLower)
          );
        });
    },
    [currentUser.id, keyword, statusFilter]
  );

  const refreshTrades = useCallback(() => {
    setTrades(loadAllTrades());
  }, []);

  const handleCompleteTodo = useCallback(
    (tradeId: string, todoKind: TradeStatusKey) => {
      completeTodoForTrade(tradeId, todoKind, currentUser.id);
      refreshTrades();
    },
    [currentUser.id, refreshTrades]
  );

  useEffect(() => {
    setTrades(loadAllTrades());
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === TRADE_STORAGE_KEY) {
        setTrades(loadAllTrades());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const tradeRows = useMemo(
    () => trades.map((trade) => buildTradeRow(trade, currentUser.id)),
    [currentUser.id, trades]
  );

  const filteredTrades = useMemo(() => filterTrades(tradeRows), [filterTrades, tradeRows]);

  const buyApproval = filteredTrades.filter(
    (trade) => trade.kind === "buy" && trade.section === "approval"
  );
  const buyPayment = filteredTrades.filter(
    (trade) => trade.kind === "buy" && trade.section === "payment"
  );
  const buyConfirmation = filteredTrades.filter(
    (trade) => trade.kind === "buy" && trade.section === "confirmation"
  );
  const sellApproval = filteredTrades.filter(
    (trade) => trade.kind === "sell" && trade.section === "approval"
  );
  const sellPayment = filteredTrades.filter(
    (trade) => trade.kind === "sell" && trade.section === "payment"
  );
  const sellConfirmation = filteredTrades.filter(
    (trade) => trade.kind === "sell" && trade.section === "confirmation"
  );

  const getStatementDestination = (row: TradeRow) =>
    getStatementPath(row.id, row.status, row.kind === "buy" ? "buyer" : "seller");

  const tradeColumnBase: NaviTableColumn[] = [
    {
      key: "status",
      label: "状況",
      width: "110px",
      render: (row: TradeRow) => (
        <StatusBadge statusKey={row.status} context="inProgress" />
      ),
    },
    {
      key: "updatedAt",
      label: "更新日時",
      width: "160px",
    },
    {
      key: "partnerName",
      label: "取引先",
      width: "18%",
    },
    {
      key: "makerName",
      label: "メーカー",
      width: "140px",
    },
    {
      key: "itemName",
      label: "機種名",
      width: "22%",
    },
    {
      key: "totalAmount",
      label: "合計金額（税込）",
      width: "140px",
      render: (row: TradeRow) => formatCurrency(row.totalAmount),
    },
    {
      key: "scheduledShipDate",
      label: "発送予定日",
      width: "140px",
    },
    {
      key: "document",
      label: "明細書",
      width: "110px",
      render: (row: TradeRow) => {
        const statementPath = getStatementDestination(row);
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(statementPath);
            }}
            className="inline-flex items-center justify-center rounded px-3 py-1 text-xs font-semibold bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm"
          >
            PDF
          </button>
        );
      },
    },
  ];

  const messageColumn: NaviTableColumn = {
    key: "message",
    label: "メッセージ",
    width: "110px",
    render: (row: TradeRow) => (
      <button
        type="button"
        className="inline-flex items-center justify-center rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-[#142B5E] hover:bg-slate-100"
        onClick={(e) => {
          e.stopPropagation();
          setMessageTarget(row.id);
        }}
      >
        メッセージ
      </button>
    ),
  };
  const actionColumn: NaviTableColumn = {
    key: "action",
    label: "操作",
    width: "120px",
    render: (row: TradeRow) =>
      row.primaryActionLabel && row.isOpen ? (
        <button
          type="button"
          className="inline-flex items-center justify-center rounded px-3 py-1 text-xs font-semibold bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleCompleteTodo(row.id, row.status);
          }}
        >
          {row.primaryActionLabel}
        </button>
      ) : (
        <span className="text-[11px] text-neutral-500">-</span>
      ),
  };

  const tradeColumnsWithAction: NaviTableColumn[] = [
    ...tradeColumnBase,
    actionColumn,
    messageColumn,
  ];

  const tradeColumnsWithoutAction: NaviTableColumn[] = [
    ...tradeColumnBase,
    messageColumn,
  ];

  const messageThread = getMessagesForTrade(messageTarget);

  return (
    <section className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen space-y-8 px-4 md:px-6 xl:px-8">
      <TransactionFilterBar
        statusFilter={statusFilter}
        keyword={keyword}
        onStatusChange={setStatusFilter}
        onKeywordChange={setKeyword}
      />

      <section className="space-y-4">
        <h2 className="bg-[#142B5E] text-white text-lg font-semibold px-4 py-2 mb-2">
          購入中の商品
        </h2>
        <div className="space-y-2">
          <SectionHeader
            className="px-3 py-2 text-xs"
            description={getInProgressDescription("buy", "application_sent")}
          >
            {SECTION_LABELS.approval.title}
          </SectionHeader>
          <NaviTable
            columns={tradeColumnsWithAction}
            rows={buyApproval}
            emptyMessage="現在進行中の取引はありません。"
            onRowClick={(row) => row.id && router.push(getStatementDestination(row as TradeRow))}
          />
        </div>

        <div className="space-y-2">
          <SectionHeader
            className="px-3 py-2 text-xs"
            description={getInProgressDescription("buy", "application_approved")}
          >
            {SECTION_LABELS.payment.title}
          </SectionHeader>
          <NaviTable
            columns={tradeColumnsWithAction}
            rows={buyPayment}
            emptyMessage="現在進行中の取引はありません。"
            onRowClick={(row) => row.id && router.push(getStatementDestination(row as TradeRow))}
          />
        </div>

        <div className="space-y-2">
          <SectionHeader
            className="px-3 py-2 text-xs"
            description={getInProgressDescription("buy", "payment_confirmed")}
          >
            {SECTION_LABELS.confirmation.title}
          </SectionHeader>
          <NaviTable
            columns={tradeColumnsWithAction}
            rows={buyConfirmation}
            emptyMessage="現在進行中の取引はありません。"
            onRowClick={(row) => row.id && router.push(getStatementDestination(row as TradeRow))}
          />
        </div>

      </section>

      <section className="space-y-4">
        <h2 className="bg-[#142B5E] text-white text-lg font-semibold px-4 py-2 mb-2">
          売却中の商品
        </h2>
        <div className="space-y-2">
          <SectionHeader
            className="px-3 py-2 text-xs"
            description={getInProgressDescription("sell", "application_sent")}
          >
            {SECTION_LABELS.approval.title}
          </SectionHeader>
          <NaviTable
            columns={tradeColumnsWithoutAction}
            rows={sellApproval}
            emptyMessage="現在進行中の取引はありません。"
            onRowClick={(row) => row.id && router.push(getStatementDestination(row as TradeRow))}
          />
        </div>
        <div className="space-y-2">
          <SectionHeader
            className="px-3 py-2 text-xs"
            description={getInProgressDescription("sell", "application_approved")}
          >
            {SECTION_LABELS.payment.title}
          </SectionHeader>
          <NaviTable
            columns={tradeColumnsWithoutAction}
            rows={sellPayment}
            emptyMessage="現在進行中の取引はありません。"
            onRowClick={(row) => row.id && router.push(getStatementDestination(row as TradeRow))}
          />
        </div>
        <div className="space-y-2">
          <SectionHeader
            className="px-3 py-2 text-xs"
            description={getInProgressDescription("sell", "payment_confirmed")}
          >
            {SECTION_LABELS.confirmation.title}
          </SectionHeader>
          <NaviTable
            columns={tradeColumnsWithoutAction}
            rows={sellConfirmation}
            emptyMessage="現在進行中の取引はありません。"
            onRowClick={(row) => row.id && router.push(getStatementDestination(row as TradeRow))}
          />
        </div>
      </section>

      <TradeMessageModal
        open={messageTarget !== null}
        tradeId={messageTarget}
        messages={messageThread}
        onClose={() => setMessageTarget(null)}
      />
    </section>
  );
}
