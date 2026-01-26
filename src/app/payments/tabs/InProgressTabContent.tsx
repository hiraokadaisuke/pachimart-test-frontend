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
import { fetchMessagesByNaviId } from "@/lib/messages/api";
import type { TradeMessage } from "@/lib/messages/transform";
import { calculateStatementTotals } from "@/lib/dealings/calcTotals";
import { getInProgressDescription } from "@/lib/dealings/copy";
import { loadAllTradesWithApi } from "@/lib/dealings/dataSources";
import { getStatementPath } from "@/lib/dealings/navigation";
import { TradeRecord } from "@/lib/dealings/types";
import { getTodoPresentation } from "@/lib/dealings/todo";
import { todoUiMap } from "@/lib/todo/todoUiMap";
import { markTradeCompleted, markTradePaid } from "@/lib/dealings/api";

const SECTION_LABELS = {
  approval: todoUiMap["application_sent"],
  payment: todoUiMap["application_approved"],
  confirmation: todoUiMap["payment_confirmed"],
  completed: todoUiMap["trade_completed"],
  canceled: todoUiMap["trade_canceled"],
} as const;

type DealingRow = {
  id: string;
  naviId?: number;
  status: TradeStatusKey;
  updatedAt: string;
  partnerName: string;
  makerName: string;
  itemName: string;
  quantity: number;
  totalAmount: number;
  scheduledShipDate: string | null;
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
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

function formatShortDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}

const MissingDateLabel = () => (
  <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">未入力</span>
);

function buildDealingRow(dealing: TradeRecord, viewerId: string): DealingRow {
  const totals = calculateStatementTotals(dealing.items, dealing.taxRate ?? 0.1);
  const primaryItem = dealing.items[0];
  const totalQty = dealing.items.reduce((sum, item) => sum + (item.qty ?? 1), 0);
  const sellerUserId = dealing.sellerUserId ?? dealing.seller.userId ?? "seller";
  const buyerUserId = dealing.buyerUserId ?? dealing.buyer.userId ?? "buyer";
  const updatedAtLabel = formatDateTime(dealing.updatedAt ?? dealing.createdAt ?? new Date().toISOString());
  const scheduledShipDate = formatShortDate(dealing.shipmentDate ?? undefined);
  const isSeller = sellerUserId === viewerId;
  const kind = isSeller ? ("sell" as const) : ("buy" as const);
  const todo = getTodoPresentation(dealing, kind === "buy" ? "buyer" : "seller");

  return {
    id: dealing.id,
    naviId: dealing.naviId,
    status: todo.todoKind,
    updatedAt: updatedAtLabel,
    partnerName: isSeller ? dealing.buyer.companyName : dealing.seller.companyName,
    makerName: primaryItem?.maker ?? "-",
    itemName: primaryItem?.itemName ?? "商品",
    quantity: totalQty,
    totalAmount: totals.total,
    scheduledShipDate,
    sellerUserId,
    buyerUserId,
    sellerName: dealing.seller.companyName,
    buyerName: dealing.buyer.companyName,
    kind,
    section: todo.section,
    description: todo.description,
    primaryActionLabel: todo.primaryAction?.label,
    isOpen: !!todo.activeTodo,
  };
}

export function InProgressTabContent() {
  const currentUser = useCurrentDevUser();
  const [dealings, setDealings] = useState<TradeRecord[]>([]);
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"all" | "inProgress" | "completed">("inProgress");
  const [keyword, setKeyword] = useState("");
  const [messageTarget, setMessageTarget] = useState<string | null>(null);
  const [messageNaviId, setMessageNaviId] = useState<number | null>(null);
  const [messages, setMessages] = useState<TradeMessage[]>([]);

  const filterTrades = useCallback(
    (rows: DealingRow[]) => {
      const keywordLower = keyword.toLowerCase();

      return rows
        .filter((dealing) => dealing.sellerUserId === currentUser.id || dealing.buyerUserId === currentUser.id)
        .filter((dealing) => {
          if (statusFilter === "inProgress") return dealing.isOpen;
          if (statusFilter === "completed")
            return !dealing.isOpen || dealing.section === "completed" || dealing.section === "canceled";
          return true;
        })
        .filter((dealing) => {
          if (!keywordLower) return true;
          return (
            dealing.itemName.toLowerCase().includes(keywordLower) ||
            dealing.partnerName.toLowerCase().includes(keywordLower)
          );
        });
    },
    [currentUser.id, keyword, statusFilter]
  );

  const refreshTrades = useCallback(async () => {
    try {
      const navis = await loadAllTradesWithApi();

      console.table(
        navis.map((dealing) => ({
          id: dealing.id,
          status: dealing.status,
          source: dealing.naviType ?? "UNKNOWN",
          buyerId: dealing.buyerUserId,
          sellerId: dealing.sellerUserId,
        }))
      );

      const data = navis.filter((dealing) => dealing.status !== "APPROVAL_REQUIRED");
      const ownedDealings = data.filter(
        (dealing) => dealing.sellerUserId === currentUser.id || dealing.buyerUserId === currentUser.id
      );
      setDealings(ownedDealings);
    } catch (error) {
      console.error("Failed to load trades", error);
      setDealings([]);
    }
  }, [currentUser.id]);

  const handleCompleteTodo = useCallback(
    async (row: DealingRow) => {
      const targetDealing = dealings.find((dealing) => dealing.id === row.id);

      if (!targetDealing) {
        console.error("Trade not found for todo completion", { tradeId: row.id, todoKind: row.status });
        return;
      }

      try {
        if (row.status === "application_approved") {
          await markTradePaid(row.id, currentUser.id);
          await refreshTrades();
          return;
        }

        if (row.status === "payment_confirmed") {
          await markTradeCompleted(row.id, currentUser.id);
          await refreshTrades();
          return;
        }

        console.warn("Todo completion is not supported for fetched trades", {
          tradeId: row.id,
          todoKind: row.status,
        });
      } catch (error) {
        console.error("Failed to update trade status", error);
      }
    },
    [currentUser.id, dealings, refreshTrades]
  );

  useEffect(() => {
    refreshTrades();
  }, [refreshTrades]);

  const dealingRows = useMemo(
    () => dealings.map((dealing) => buildDealingRow(dealing, currentUser.id)),
    [currentUser.id, dealings]
  );

  const acceptedDealings = useMemo(
    () => dealingRows.filter((dealing) => dealing.status !== "application_sent"),
    [dealingRows]
  );

  const filteredDealings = useMemo(() => filterTrades(acceptedDealings), [acceptedDealings, filterTrades]);

  useEffect(() => {
    const paymentRows = filteredDealings.filter((dealing) => dealing.status === "application_approved");
    console.table(paymentRows.map((dealing) => ({ id: dealing.id, status: dealing.status })));
  }, [filteredDealings]);

  const buyPayment = filteredDealings.filter(
    (dealing) => dealing.kind === "buy" && dealing.status === "application_approved"
  );
  const buyConfirmation = filteredDealings.filter(
    (dealing) => dealing.kind === "buy" && dealing.status === "payment_confirmed"
  );
  const sellPayment = filteredDealings.filter(
    (dealing) => dealing.kind === "sell" && dealing.status === "application_approved"
  );
  const sellConfirmation = filteredDealings.filter(
    (dealing) => dealing.kind === "sell" && dealing.status === "payment_confirmed"
  );

  const getStatementDestination = (row: DealingRow) =>
    getStatementPath(row.id, row.status, row.kind === "buy" ? "buyer" : "seller", {
      naviId: row.naviId,
    });

  const dealingColumnBase: NaviTableColumn[] = [
    {
      key: "status",
      label: "状況",
      width: "110px",
      render: (row: DealingRow) => <StatusBadge statusKey={row.status} context="inProgress" />,
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
      render: (row: DealingRow) => formatCurrency(row.totalAmount),
    },
    {
      key: "scheduledShipDate",
      label: "機械発送日",
      width: "140px",
      render: (row: DealingRow) => row.scheduledShipDate ?? <MissingDateLabel />,
    },
    {
      key: "document",
      label: "明細書",
      width: "110px",
      render: (row: DealingRow) => {
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
    render: (row: DealingRow) => (
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
  };

  const actionColumn: NaviTableColumn = {
    key: "action",
    label: "操作",
    width: "120px",
    render: (row: DealingRow) =>
      row.kind === "buy" && row.primaryActionLabel && row.isOpen ? (
        <button
          type="button"
          className="inline-flex items-center justify-center rounded px-3 py-1 text-xs font-semibold bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleCompleteTodo(row);
          }}
        >
          {row.primaryActionLabel}
        </button>
      ) : (
        <span className="text-[11px] text-neutral-500">-</span>
      ),
  };

  const dealingColumns: NaviTableColumn[] = [...dealingColumnBase, actionColumn, messageColumn];

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

  const handleOpenMessage = (row: DealingRow) => {
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

  return (
    <section className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen space-y-8 px-4 md:px-6 xl:px-8">
      <TransactionFilterBar
        statusFilter={statusFilter}
        keyword={keyword}
        onStatusChange={setStatusFilter}
        onKeywordChange={setKeyword}
      />

      <section className="space-y-4">
        <h2 className="bg-[#142B5E] text-white text-lg font-semibold px-4 py-2 mb-2">購入中の商品</h2>

        <div className="space-y-2">
          <SectionHeader className="px-3 py-2 text-xs" description={getInProgressDescription("buy", "application_approved")}>
            {SECTION_LABELS.payment.title}
          </SectionHeader>

          <NaviTable
            columns={dealingColumns}
            rows={buyPayment}
            emptyMessage="現在進行中の取引はありません。"
            onRowClick={(row) => row.id && router.push(getStatementDestination(row as DealingRow))}
          />
        </div>

        <div className="space-y-2">
          <SectionHeader className="px-3 py-2 text-xs" description={getInProgressDescription("buy", "payment_confirmed")}>
            {SECTION_LABELS.confirmation.title}
          </SectionHeader>

          <NaviTable
            columns={dealingColumns}
            rows={buyConfirmation}
            emptyMessage="現在進行中の取引はありません。"
            onRowClick={(row) => row.id && router.push(getStatementDestination(row as DealingRow))}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="bg-[#142B5E] text-white text-lg font-semibold px-4 py-2 mb-2">売却中の商品</h2>

        <div className="space-y-2">
          <SectionHeader className="px-3 py-2 text-xs" description={getInProgressDescription("sell", "application_approved")}>
            {SECTION_LABELS.payment.title}
          </SectionHeader>

          <NaviTable
            columns={dealingColumns}
            rows={sellPayment}
            emptyMessage="現在進行中の取引はありません。"
            onRowClick={(row) => row.id && router.push(getStatementDestination(row as DealingRow))}
          />
        </div>

        <div className="space-y-2">
          <SectionHeader className="px-3 py-2 text-xs" description={getInProgressDescription("sell", "payment_confirmed")}>
            {SECTION_LABELS.confirmation.title}
          </SectionHeader>

          <NaviTable
            columns={dealingColumns}
            rows={sellConfirmation}
            emptyMessage="現在進行中の取引はありません。"
            onRowClick={(row) => row.id && router.push(getStatementDestination(row as DealingRow))}
          />
        </div>
      </section>

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
