"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TradeNaviStatus, TradeNaviType } from "@prisma/client";

import { TradeRecord } from "@/lib/trade/types";
import { calculateStatementTotals } from "@/lib/trade/calcTotals";
import { loadAllTradesWithApi } from "@/lib/trade/dataSources";
import { NaviTable, NaviTableColumn } from "@/components/transactions/NaviTable";
import { StatusBadge } from "@/components/transactions/StatusBadge";
import { TransactionFilterBar } from "@/components/transactions/TransactionFilterBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { type TradeStatusKey } from "@/components/transactions/status";
import { TradeMessageModal } from "@/components/transactions/TradeMessageModal";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { fetchMessagesByNaviId } from "@/lib/messages/api";
import type { TradeMessage } from "@/lib/messages/transform";
import { getInProgressDescription } from "@/lib/trade/copy";
import { getStatementPath } from "@/lib/trade/navigation";
import { getTodoPresentation } from "@/lib/trade/todo";
import { todoUiMap, type TodoUiDef } from "@/lib/todo/todoUiMap";
import { fetchTradeNavis, mapTradeNaviToTradeRecord, updateTradeStatus } from "@/lib/trade/api";

type TradeSection = TodoUiDef["section"];

const APPROVAL_LABEL = todoUiMap["application_sent"];

const ONLINE_INQUIRY_DESCRIPTION = {
  buy: "送信したオンライン問い合わせの回答をお待ちください。不要になった場合はキャンセルできます。",
  sell: "買主から届いたオンライン問い合わせです。内容を確認して受諾または見送りを選択してください。",
};

type TradeRow = {
  id: string;
  naviId?: number;
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

type InquiryRow = {
  id: string;
  naviId?: number;
  updatedAt: string;
  partnerName: string;
  makerName: string;
  itemName: string;
  quantity: number;
  totalAmount: number;
  sellerUserId: string;
  buyerUserId: string;
  kind: "buy" | "sell";
  status: TradeNaviStatus;
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
    naviId: trade.naviId,
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

function buildInquiryRowFromTrade(trade: TradeRecord, viewerId: string): InquiryRow {
  const totals = calculateStatementTotals(trade.items, trade.taxRate ?? 0.1);
  const primaryItem = trade.items[0];
  const updatedAtLabel = formatDateTime(trade.updatedAt ?? trade.createdAt ?? new Date().toISOString());
  const isBuyer = (trade.buyerUserId ?? trade.buyer.userId) === viewerId;
  const kind = isBuyer ? ("buy" as const) : ("sell" as const);
  const sellerId = trade.sellerUserId ?? trade.seller.userId ?? "seller";
  const buyerId = trade.buyerUserId ?? trade.buyer.userId ?? "buyer";

  return {
    id: trade.naviId ? String(trade.naviId) : trade.id,
    naviId: trade.naviId,
    status: TradeNaviStatus.SENT,
    partnerName: isBuyer ? trade.seller.companyName : trade.buyer.companyName,
    makerName: primaryItem?.maker ?? trade.makerName ?? "-",
    itemName: primaryItem?.itemName ?? trade.itemName ?? "商品",
    quantity: trade.quantity ?? primaryItem?.qty ?? 1,
    totalAmount: totals.total,
    updatedAt: updatedAtLabel,
    sellerUserId: sellerId,
    buyerUserId: buyerId,
    kind,
  };
}

export function InProgressTabContent() {
  const currentUser = useCurrentDevUser();
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [onlineInquiryRows, setOnlineInquiryRows] = useState<InquiryRow[]>([]);
  const [sellerApprovalRows, setSellerApprovalRows] = useState<TradeRow[]>([]);
  const [buyerNaviApprovalRows, setBuyerNaviApprovalRows] = useState<TradeRow[]>([]);
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [messageTarget, setMessageTarget] = useState<string | null>(null);
  const [messageNaviId, setMessageNaviId] = useState<number | null>(null);
  const [messages, setMessages] = useState<TradeMessage[]>([]);

  const keywordLower = keyword.toLowerCase();

  useEffect(() => {
    loadAllTradesWithApi().then(setTrades).catch((error) => console.error(error));
  }, []);

  const fetchApprovalRows = useCallback(async () => {
    try {
      const apiTrades = await fetchTradeNavis();
      const mappedTrades = apiTrades
        .filter(
          (trade) =>
            trade.status === TradeNaviStatus.SENT &&
            (trade.ownerUserId === currentUser.id || trade.buyerUserId === currentUser.id)
        )
        .map((trade) => mapTradeNaviToTradeRecord(trade))
        .filter((trade): trade is TradeRecord => Boolean(trade));

      const rows = mappedTrades
        .map((trade) => buildTradeRow(trade, currentUser.id))
        .filter((row) => row.section === "approval" && row.isOpen);

      setSellerApprovalRows(rows.filter((row) => row.kind === "sell"));
      setBuyerNaviApprovalRows(rows.filter((row) => row.kind === "buy"));

      const inquiryRows = apiTrades
        .filter((trade) => trade.naviType === TradeNaviType.ONLINE_INQUIRY && trade.status === TradeNaviStatus.SENT)
        .map((trade) => mapTradeNaviToTradeRecord(trade))
        .filter((trade): trade is TradeRecord => Boolean(trade))
        .map((trade) => buildInquiryRowFromTrade(trade, currentUser.id));

      setOnlineInquiryRows(inquiryRows);
    } catch (error) {
      console.error(error);
      setSellerApprovalRows([]);
      setBuyerNaviApprovalRows([]);
      setOnlineInquiryRows([]);
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchApprovalRows();
  }, [fetchApprovalRows]);

  const mappedTradeRows = useMemo(
    () => trades.map((trade) => buildTradeRow(trade, currentUser.id)),
    [currentUser.id, trades]
  );

  const filteredTradeRows = useMemo(
    () =>
      mappedTradeRows
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
        }),
    [currentUser.id, keywordLower, mappedTradeRows]
  );
  const buyerApprovalRowsFromTrades = filteredTradeRows.filter(
    (row) => row.kind === "buy" && row.section === "approval"
  );

  const filteredSellerApprovalRows = useMemo(
    () =>
      sellerApprovalRows.filter((trade) => {
        if (!keywordLower) return true;
        return (
          trade.itemName.toLowerCase().includes(keywordLower) ||
          trade.partnerName.toLowerCase().includes(keywordLower)
        );
      }),
    [keywordLower, sellerApprovalRows]
  );

  const filteredBuyerNaviApprovalRows = useMemo(
    () =>
      buyerNaviApprovalRows.filter((trade) => {
        if (!keywordLower) return true;
        return (
          trade.itemName.toLowerCase().includes(keywordLower) ||
          trade.partnerName.toLowerCase().includes(keywordLower)
        );
      }),
    [keywordLower, buyerNaviApprovalRows]
  );

  const buyerApprovalRows = useMemo(() => {
    const rows: TradeRow[] = [];
    const naviIds = new Set<number>();
    const ids = new Set<string>();

    buyerApprovalRowsFromTrades.forEach((row) => {
      rows.push(row);
      if (typeof row.naviId === "number") {
        naviIds.add(row.naviId);
      }
      ids.add(row.id);
    });

    filteredBuyerNaviApprovalRows.forEach((row) => {
      const hasNaviId = typeof row.naviId === "number";
      if (hasNaviId) {
        const naviId = row.naviId as number;
        if (naviIds.has(naviId)) return;
        naviIds.add(naviId);
      } else {
        if (ids.has(row.id)) return;
        ids.add(row.id);
      }
      rows.push(row);
    });

    return rows;
  }, [buyerApprovalRowsFromTrades, filteredBuyerNaviApprovalRows]);

  const mappedInquiryRows = useMemo(() => onlineInquiryRows, [onlineInquiryRows]);

  const filteredInquiryRows = useMemo(
    () =>
      mappedInquiryRows
        .filter(
          (inquiry) => inquiry.sellerUserId === currentUser.id || inquiry.buyerUserId === currentUser.id
        )
        .filter((inquiry) => {
          if (!keywordLower) return true;
          return (
            inquiry.itemName.toLowerCase().includes(keywordLower) ||
            inquiry.partnerName.toLowerCase().includes(keywordLower)
          );
        }),
    [currentUser.id, keywordLower, mappedInquiryRows]
  );

  const buyerInquiryRows = filteredInquiryRows.filter((row) => row.kind === "buy");
  const sellerInquiryRows = filteredInquiryRows.filter((row) => row.kind === "sell");

  const getStatementDestination = (row: TradeRow) =>
    getStatementPath(row.id, row.status, row.kind === "buy" ? "buyer" : "seller");

  const inquiryStatusBadge = (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
      回答待ち
    </span>
  );

  const resolveNaviId = (rowId: string | number | undefined) => {
    if (typeof rowId === "number" && Number.isInteger(rowId)) return String(rowId);
    const parsed = Number(rowId);
    return Number.isInteger(parsed) ? String(parsed) : null;
  };

  const handleCancelInquiry = async (inquiryId: string | number | undefined) => {
    const targetId = resolveNaviId(inquiryId);
    if (!targetId) return;
    await updateTradeStatus(targetId, "REJECTED").catch((error) => console.error(error));
    fetchApprovalRows();
  };

  const handleAcceptInquiry = async (inquiryId: string | number | undefined) => {
    const targetId = resolveNaviId(inquiryId);
    if (!targetId) return;
    await updateTradeStatus(targetId, "APPROVED").catch((error) => console.error(error));
    fetchApprovalRows();
  };

  const handleDeclineInquiry = async (inquiryId: string | number | undefined) => {
    const targetId = resolveNaviId(inquiryId);
    if (!targetId) return;
    await updateTradeStatus(targetId, "REJECTED").catch((error) => console.error(error));
    fetchApprovalRows();
  };

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
          handleOpenMessage(row);
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
          render: (row: TradeRow) => {
            const statementPath = getStatementDestination(row);
            return (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded px-3 py-1 text-xs font-semibold bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(statementPath);
                }}
              >
                入力
              </button>
            );
          },
        }
      : col
  );

  const inquiryColumnBase: NaviTableColumn[] = [
    {
      key: "status",
      label: "状況",
      width: "110px",
      render: () => inquiryStatusBadge,
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
      render: (row: InquiryRow) => `${row.quantity}台`,
    },
    {
      key: "totalAmount",
      label: "合計金額（税込）",
      width: "140px",
      render: (row: InquiryRow) => formatCurrency(row.totalAmount),
    },
  ];

  const buyerInquiryColumns: NaviTableColumn[] = [
    ...inquiryColumnBase,
    {
      key: "action",
      label: "操作",
      width: "120px",
      render: (row: InquiryRow) => (
        <button
          type="button"
          className="inline-flex w-full justify-center rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-[#142B5E] hover:bg-slate-100"
          onClick={(e) => {
            e.stopPropagation();
            handleCancelInquiry(row.naviId ?? row.id);
          }}
        >
          キャンセル
        </button>
      ),
    },
  ];

  const sellerInquiryColumns: NaviTableColumn[] = [
    ...inquiryColumnBase,
    {
      key: "action",
      label: "操作",
      width: "180px",
      render: (row: InquiryRow) => (
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex flex-1 justify-center rounded bg-indigo-700 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800"
            onClick={(e) => {
              e.stopPropagation();
              handleAcceptInquiry(row.naviId ?? row.id);
            }}
          >
            受諾
          </button>
          <button
            type="button"
            className="inline-flex flex-1 justify-center rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-[#142B5E] hover:bg-slate-100"
            onClick={(e) => {
              e.stopPropagation();
              handleDeclineInquiry(row.naviId ?? row.id);
            }}
          >
            見送り
          </button>
        </div>
      ),
    },
  ];

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

  const handleOpenMessage = (row: TradeRow) => {
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
        keyword={keyword}
        onKeywordChange={setKeyword}
        hideStatusFilter
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
            {APPROVAL_LABEL.title}
          </SectionHeader>
          <NaviTable
            columns={buyerApprovalColumns}
            rows={buyerApprovalRows}
            emptyMessage="現在承認待ちの取引はありません。"
            onRowClick={(row) => row.id && router.push(getStatementDestination(row as TradeRow))}
          />
        </div>
        <div className="space-y-2">
          <SectionHeader className="px-3 py-2 text-xs" description={ONLINE_INQUIRY_DESCRIPTION.buy}>
            オンライン問い合わせ
          </SectionHeader>
          <NaviTable
            columns={buyerInquiryColumns}
            rows={buyerInquiryRows}
            emptyMessage="現在オンライン問い合わせはありません。"
            onRowClick={(row) => row.id && router.push(`/navi/inquiries/${(row as InquiryRow).id}`)}
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
            {APPROVAL_LABEL.title}
          </SectionHeader>
          <NaviTable
            columns={tradeColumnsWithoutAction}
            rows={filteredSellerApprovalRows}
            emptyMessage="現在承認待ちの送信済み取引はありません。"
            onRowClick={(row) => row.id && router.push(getStatementDestination(row as TradeRow))}
          />
        </div>
        <div className="space-y-2">
          <SectionHeader className="px-3 py-2 text-xs" description={ONLINE_INQUIRY_DESCRIPTION.sell}>
            オンライン問い合わせ
          </SectionHeader>
          <NaviTable
            columns={sellerInquiryColumns}
            rows={sellerInquiryRows}
            emptyMessage="現在オンライン問い合わせはありません。"
            onRowClick={(row) => row.id && router.push(`/navi/inquiries/${(row as InquiryRow).id}`)}
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
