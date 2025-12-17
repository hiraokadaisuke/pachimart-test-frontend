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
import {
  COMPLETED_STATUS_KEYS,
  IN_PROGRESS_STATUS_KEYS,
  type TradeStatusKey,
} from "@/components/transactions/status";
import { TradeMessageModal } from "@/components/transactions/TradeMessageModal";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { getMessagesForTrade } from "@/lib/dummyMessages";

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
  pdfUrl: string;
  sellerUserId: string;
  buyerUserId: string;
  sellerName: string;
  buyerName: string;
  kind?: "buy" | "sell";
};

const buyingPendingResponses: TradeRow[] = [
  {
    id: "T-2025112001",
    status: "navi_in_progress",
    updatedAt: "2025/11/20 09:30",
    partnerName: "株式会社オファーテック",
    makerName: "サミー",
    itemName: "P 北斗の拳 暴凶星",
    quantity: 3,
    totalAmount: 450000,
    scheduledShipDate: "2025/11/29",
    pdfUrl: "#",
    sellerUserId: "user-b",
    buyerUserId: "user-a",
    sellerName: "株式会社オファーテック",
    buyerName: "株式会社パチテック",
  },
  {
    id: "T-2025112002",
    status: "navi_in_progress",
    updatedAt: "2025/11/20 12:10",
    partnerName: "株式会社ディーエル商会",
    makerName: "SANKYO",
    itemName: "P フィーバー機動戦士ガンダムSEED",
    quantity: 2,
    totalAmount: 360000,
    scheduledShipDate: "2025/11/30",
    pdfUrl: "#",
    sellerUserId: "user-b",
    buyerUserId: "user-a",
    sellerName: "株式会社ディーエル商会",
    buyerName: "株式会社トレード連合",
  },
];

const sellingNeedResponses: TradeRow[] = [
  {
    id: "T-2025112003",
    status: "navi_in_progress",
    updatedAt: "2025/11/20 14:45",
    partnerName: "株式会社トレード連合",
    makerName: "ニューギン",
    itemName: "P 真・花の慶次3 黄金一閃",
    quantity: 4,
    totalAmount: 680000,
    scheduledShipDate: "2025/12/02",
    pdfUrl: "#",
    sellerUserId: "user-a",
    buyerUserId: "user-b",
    sellerName: "株式会社パチテック",
    buyerName: "株式会社トレード連合",
  },
  {
    id: "T-2025112004",
    status: "navi_in_progress",
    updatedAt: "2025/11/20 16:20",
    partnerName: "関西エンタメ商事",
    makerName: "京楽",
    itemName: "P とある魔術の禁書目録",
    quantity: 5,
    totalAmount: 850000,
    scheduledShipDate: "2025/12/03",
    pdfUrl: "#",
    sellerUserId: "user-a",
    buyerUserId: "user-b",
    sellerName: "株式会社パチテック",
    buyerName: "関西エンタメ商事",
  },
];

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

function mapTradeStatus(status: TradeRecord["status"]): TradeStatusKey {
  switch (status) {
    case "APPROVAL_REQUIRED":
      return "requesting";
    case "APPROVED":
    case "PAYMENT_REQUIRED":
      return "waiting_payment";
    case "CONFIRM_REQUIRED":
      return "payment_confirmed";
    default:
      return "navi_in_progress";
  }
}

function buildTradeRow(trade: TradeRecord, viewerId: string): TradeRow {
  const totals = calculateStatementTotals(trade.items, trade.taxRate ?? 0.1);
  const primaryItem = trade.items[0];
  const totalQty = trade.items.reduce((sum, item) => sum + (item.qty ?? 1), 0);
  const updatedAtLabel = formatDateTime(trade.updatedAt ?? trade.createdAt ?? new Date().toISOString());
  const status = mapTradeStatus(trade.status);
  const sellerId = trade.seller.userId ?? "seller";
  const buyerId = trade.buyer.userId ?? "buyer";
  const isSeller = sellerId === viewerId;
  return {
    id: trade.id,
    status,
    updatedAt: updatedAtLabel,
    partnerName: isSeller ? trade.buyer.companyName : trade.seller.companyName,
    makerName: primaryItem?.maker ?? "-",
    itemName: primaryItem?.itemName ?? "商品",
    quantity: totalQty,
    totalAmount: totals.total,
    scheduledShipDate: trade.contractDate ?? "-",
    pdfUrl: `/trade-navi/${trade.id}/statement`,
    sellerUserId: sellerId,
    buyerUserId: buyerId,
    sellerName: trade.seller.companyName,
    buyerName: trade.buyer.companyName,
  };
}

export function InProgressTabContent() {
  const currentUser = useCurrentDevUser();
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"all" | "inProgress" | "completed">("all");
  const [keyword, setKeyword] = useState("");
  const [messageTarget, setMessageTarget] = useState<string | null>(null);

  const filterTrades = useCallback(
    (trades: TradeRow[]) => {
      const keywordLower = keyword.toLowerCase();

      return trades
        .filter(
          (trade) => trade.sellerUserId === currentUser.id || trade.buyerUserId === currentUser.id
        )
        .map((trade) => {
          const isSeller = trade.sellerUserId === currentUser.id;
          return {
            ...trade,
            kind: isSeller ? ("sell" as const) : ("buy" as const),
            partnerName: isSeller ? trade.buyerName : trade.sellerName,
          };
        })
        .filter((trade) => {
          if (statusFilter === "all") return true;
          if (statusFilter === "inProgress")
            return IN_PROGRESS_STATUS_KEYS.includes(trade.status) || trade.status === "requesting";
          if (statusFilter === "completed") return COMPLETED_STATUS_KEYS.includes(trade.status);
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

  const filteredPendingResponses = useMemo(
    () => filterTrades(buyingPendingResponses),
    [filterTrades]
  );

  const filteredNeedResponses = useMemo(() => filterTrades(sellingNeedResponses), [filterTrades]);

  const buyPendingResponse = filteredPendingResponses.filter((trade) => trade.kind === "buy");
  const sellNeedResponse = filteredNeedResponses.filter((trade) => trade.kind === "sell");

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

  const mappedTradeRows = useMemo(
    () => trades.map((trade) => buildTradeRow(trade, currentUser.id)),
    [currentUser.id, trades]
  );

  const filteredTradeRows = useMemo(() => filterTrades(mappedTradeRows), [filterTrades, mappedTradeRows]);
  const buyerApprovalRows = filteredTradeRows.filter((row) => row.kind === "buy");
  const sellerApprovalRows = filteredTradeRows.filter((row) => row.kind === "sell");

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
      render: (row: TradeRow) => (
        <a
          href={row.pdfUrl}
          className="inline-flex items-center justify-center rounded px-3 py-1 text-xs font-semibold bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm"
        >
          PDF
        </a>
      ),
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

  const buyerApprovalColumns: NaviTableColumn[] = tradeColumnsWithoutAction.map((col) =>
    col.key === "document"
      ? {
          ...col,
          label: "発送先入力",
          render: (row: TradeRow) => (
            <a
              href={`/trade-navi/buyer/requests/${row.id}`}
              className="inline-flex items-center justify-center rounded px-3 py-1 text-xs font-semibold bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              入力
            </a>
          ),
        }
      : col
  );

  const buySectionDescriptions = {
    approval: "売主様から届いた依頼です。内容を確認のうえ、承認してください。",
    pendingResponse: "オンラインでオファーをしています。売主様からの返答をお待ちください。",
  } as const;

  const sellSectionDescriptions = {
    approval: "依頼を送りました。買主様からの承認をお待ちください。",
    needResponse: "買主様からオンラインでのオファー相談が届いています。内容をご確認のうえ、ご返答ください。",
  } as const;

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
            description={buySectionDescriptions.approval}
          >
            承認待ち
          </SectionHeader>
          <NaviTable
            columns={buyerApprovalColumns}
            rows={buyerApprovalRows}
            emptyMessage="現在承認待ちの取引はありません。"
            onRowClick={(row) => row.id && router.push(`/trade-navi/buyer/requests/${row.id}`)}
          />
        </div>

        <div className="space-y-2">
          <SectionHeader
            className="px-3 py-2 text-xs"
            description={buySectionDescriptions.pendingResponse}
          >
            返答待ち
          </SectionHeader>
          <NaviTable
            columns={tradeColumnsWithoutAction}
            rows={buyPendingResponse}
            emptyMessage="現在進行中の取引はありません。"
            onRowClick={(row) => row.id && router.push(`/transactions/navi/${row.id}`)}
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
            description={sellSectionDescriptions.approval}
          >
            承認待ち
          </SectionHeader>
          <NaviTable
            columns={tradeColumnsWithoutAction}
            rows={sellerApprovalRows}
            emptyMessage="現在承認待ちの送信済み取引はありません。"
            onRowClick={(row) => row.id && router.push(`/trade-navi/${row.id}/statement`)}
          />
        </div>

        <div className="space-y-2">
          <SectionHeader
            className="px-3 py-2 text-xs"
            description={sellSectionDescriptions.needResponse}
          >
            要返答
          </SectionHeader>
          <NaviTable
            columns={tradeColumnsWithoutAction}
            rows={sellNeedResponse}
            emptyMessage="現在進行中の取引はありません。"
            onRowClick={(row) => row.id && router.push(`/transactions/navi/${row.id}`)}
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
