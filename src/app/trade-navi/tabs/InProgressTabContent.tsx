"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TradeRecord } from "@/lib/trade/types";
import { calculateStatementTotals } from "@/lib/trade/calcTotals";
import { loadAllTrades, TRADE_STORAGE_KEY } from "@/lib/trade/storage";
import { NaviTable, NaviTableColumn } from "@/components/transactions/NaviTable";
import { StatusBadge } from "@/components/transactions/StatusBadge";
import { TransactionFilterBar } from "@/components/transactions/TransactionFilterBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { type TradeStatusKey } from "@/components/transactions/status";
import { TradeMessageModal } from "@/components/transactions/TradeMessageModal";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { getMessagesForTrade } from "@/lib/dummyMessages";
import { getInProgressDescription } from "@/lib/trade/copy";
import { getStatementPath } from "@/lib/trade/navigation";
import { getTodoPresentation } from "@/lib/trade/todo";
import { todoUiMap, type TodoUiDef } from "@/lib/todo/todoUiMap";
import {
  acceptOnlineInquiry,
  ONLINE_INQUIRY_STORAGE_KEY,
  dismissOnlineInquiry,
  loadOnlineInquiries,
  type OnlineInquiryRecord,
} from "@/lib/trade/onlineInquiries";

type TradeSection = TodoUiDef["section"];

const APPROVAL_LABEL = todoUiMap["application_sent"];

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
  section: TradeSection;
  isOpen: boolean;
};

type OnlineInquiryRow = {
  id: string;
  updatedAt: string;
  partnerName: string;
  makerName: string;
  itemName: string;
  quantity: number;
  totalAmount: number;
  scheduledShipDate: string;
  paymentDate?: string;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatCurrency(amount: number) {
  const formatter = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });
  return formatter.format(amount);
}

function buildTradeRow(trade: TradeRecord, viewerId: string): TradeRow {
  const totals = calculateStatementTotals(trade.items, trade.taxRate ?? 0.1);
  const primaryItem = trade.items[0];
  const totalQty = trade.items.reduce((sum, item) => sum + (item.qty ?? 1), 0);
  const updatedAtLabel = formatDateTime(trade.updatedAt ?? trade.createdAt ?? new Date().toISOString());
  const sellerId = trade.sellerUserId ?? trade.seller.userId ?? "seller";
  const buyerId = trade.buyerUserId ?? trade.buyer.userId ?? "buyer";
  const isSeller = sellerId === viewerId;
  const kind = isSeller ? ("sell" as const) : ("buy" as const);
  const todo = getTodoPresentation(trade, kind === "buy" ? "buyer" : "seller");
  return {
    id: trade.id,
    status: todo.todoKind,
    section: todo.section,
    updatedAt: updatedAtLabel,
    partnerName: isSeller ? trade.buyer.companyName : trade.seller.companyName,
    makerName: primaryItem?.maker ?? "-",
    itemName: primaryItem?.itemName ?? "商品",
    quantity: totalQty,
    totalAmount: totals.total,
    scheduledShipDate: trade.contractDate ?? "-",
    kind,
    sellerUserId: sellerId,
    buyerUserId: buyerId,
    sellerName: trade.seller.companyName,
    buyerName: trade.buyer.companyName,
    isOpen: !!todo.activeTodo,
  };
}

export function InProgressTabContent() {
  const currentUser = useCurrentDevUser();
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [onlineInquiries, setOnlineInquiries] = useState<OnlineInquiryRecord[]>([]);
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [messageTarget, setMessageTarget] = useState<string | null>(null);

  const filterTrades = useCallback(
    (trades: TradeRow[]) => {
      const keywordLower = keyword.toLowerCase();

      return trades
        .filter((trade) => trade.section === "approval" && trade.isOpen)
        .filter(
          (trade) => trade.sellerUserId === currentUser.id || trade.buyerUserId === currentUser.id
        )
        .filter((trade) => {
          if (!keywordLower) return true;
          return (
            trade.itemName.toLowerCase().includes(keywordLower) ||
            trade.partnerName.toLowerCase().includes(keywordLower)
          );
        });
    },
    [currentUser.id, keyword]
  );

  useEffect(() => {
    setTrades(loadAllTrades());
    setOnlineInquiries(loadOnlineInquiries());
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === TRADE_STORAGE_KEY) {
        setTrades(loadAllTrades());
      } else if (event.key === ONLINE_INQUIRY_STORAGE_KEY) {
        setOnlineInquiries(loadOnlineInquiries());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const mappedTradeRows = useMemo(
    () => trades.map((trade) => buildTradeRow(trade, currentUser.id)),
    [currentUser.id, trades]
  );

  const filteredTradeRows = useMemo(() => filterTrades(mappedTradeRows), [filterTrades, mappedTradeRows]);
  const sellerApprovalRows = filteredTradeRows.filter(
    (row) => row.kind === "sell" && row.section === "approval"
  );

  const onlineInquiryRows: OnlineInquiryRow[] = useMemo(
    () =>
      onlineInquiries
        .filter((inquiry) => inquiry.status === "pending")
        .filter((inquiry) => inquiry.sellerUserId === currentUser.id)
        .map((inquiry) => ({
          id: inquiry.id,
          updatedAt: formatDateTime(inquiry.updatedAt),
          partnerName: inquiry.buyerName,
          makerName: inquiry.makerName,
          itemName: inquiry.itemName,
          quantity: inquiry.quantity,
          totalAmount: inquiry.totalAmount,
          scheduledShipDate: inquiry.scheduledShipDate,
          paymentDate: inquiry.paymentDate,
        }))
        .filter((inquiry) => {
          const keywordLower = keyword.toLowerCase();
          if (!keywordLower) return true;
          return (
            inquiry.itemName.toLowerCase().includes(keywordLower) ||
            inquiry.partnerName.toLowerCase().includes(keywordLower)
          );
        }),
    [currentUser.id, keyword, onlineInquiries]
  );

  const handleAcceptInquiry = (inquiryId: string) => {
    acceptOnlineInquiry(inquiryId);
    setOnlineInquiries(loadOnlineInquiries());
  };

  const handleDismissInquiry = (inquiryId: string) => {
    dismissOnlineInquiry(inquiryId);
    setOnlineInquiries(loadOnlineInquiries());
  };

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
      key: "quantity",
      label: "台数",
      width: "80px",
      render: (row: TradeRow) => `${row.quantity}台`,
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

  const tradeColumnsWithoutAction: NaviTableColumn[] = [
    ...tradeColumnBase,
    messageColumn,
  ];

  const messageThread = getMessagesForTrade(messageTarget);

  return (
    <section className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen space-y-8 px-4 md:px-6 xl:px-8">
      <TransactionFilterBar
        keyword={keyword}
        onKeywordChange={setKeyword}
        hideStatusFilter
      />

      <section className="space-y-4">
        <h2 className="bg-[#142B5E] text-white text-lg font-semibold px-4 py-2 mb-2">
          売却中の商品
        </h2>
        <div className="space-y-2">
          <SectionHeader
            className="px-3 py-2 text-xs"
            description={getInProgressDescription("sell", "application_sent")}
          >
            {APPROVAL_LABEL.title}
          </SectionHeader>
          <NaviTable
            columns={tradeColumnsWithoutAction}
            rows={sellerApprovalRows}
            emptyMessage="現在承認待ちの送信済み取引はありません。"
            onRowClick={(row) => row.id && router.push(getStatementDestination(row as TradeRow))}
          />
        </div>

        <div className="space-y-2">
          <SectionHeader className="px-3 py-2 text-xs" description="オンラインで届いた問い合わせへの回答をお待ちください。">
            オンライン問い合わせ
          </SectionHeader>
          <NaviTable
            columns={[
              {
                key: "status",
                label: "状況",
                width: "110px",
                render: () => (
                  <span className="inline-flex rounded bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
                    回答待ち
                  </span>
                ),
              },
              { key: "updatedAt", label: "更新日時", width: "160px" },
              { key: "partnerName", label: "取引先（買手）", width: "18%" },
              { key: "makerName", label: "メーカー", width: "140px" },
              { key: "itemName", label: "機種名", width: "22%" },
              {
                key: "quantity",
                label: "台数",
                width: "80px",
                render: (row: OnlineInquiryRow) => `${row.quantity}台`,
              },
              {
                key: "totalAmount",
                label: "合計金額（税込）",
                width: "140px",
                render: (row: OnlineInquiryRow) => formatCurrency(row.totalAmount),
              },
              { key: "scheduledShipDate", label: "発送指定日", width: "140px" },
              { key: "paymentDate", label: "支払日", width: "140px" },
              {
                key: "action",
                label: "操作",
                width: "180px",
                render: (row: OnlineInquiryRow) => (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="inline-flex flex-1 items-center justify-center rounded bg-indigo-700 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptInquiry(row.id);
                      }}
                    >
                      受諾
                    </button>
                    <button
                      type="button"
                      className="inline-flex flex-1 items-center justify-center rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-[#142B5E] hover:bg-slate-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismissInquiry(row.id);
                      }}
                    >
                      見送り
                    </button>
                  </div>
                ),
              },
            ]}
            rows={onlineInquiryRows}
            emptyMessage="現在オンライン問い合わせはありません。"
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
