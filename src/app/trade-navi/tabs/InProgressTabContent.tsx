"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { products } from "@/lib/dummyData";
import { calculateQuote } from "@/lib/quotes/calculateQuote";
import { loadAllNavis } from "@/lib/navi/storage";
import { NaviStatus, TradeNaviDraft } from "@/lib/navi/types";
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

function getStatusLabel(status: NaviStatus | null) {
  switch (status) {
    case "sent_to_buyer":
      return { text: "要承認", className: "bg-sky-100 text-sky-700" };
    case "buyer_approved":
      return { text: "承認済み", className: "bg-emerald-100 text-emerald-700" };
    case "buyer_rejected":
      return { text: "差戻し", className: "bg-rose-100 text-rose-700" };
    default:
      // eslint-disable-next-line no-case-declarations
      return { text: "-", className: "bg-slate-100 text-neutral-600" };
  }
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getBuyerLabel(draft: TradeNaviDraft) {
  return draft.buyerCompanyName ?? draft.buyerId ?? "未設定";
}

function getProductLabel(draft: TradeNaviDraft) {
  const product =
    draft.productId != null
      ? products.find((p) => String(p.id) === String(draft.productId))
      : undefined;

  return product?.name ?? draft.conditions.productName ?? "未設定";
}

function formatCurrency(amount: number) {
  const formatter = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });
  return formatter.format(amount);
}

export function InProgressTabContent() {
  const currentUser = useCurrentDevUser();
  const [navis, setNavis] = useState<TradeNaviDraft[]>([]);
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
          if (statusFilter === "inProgress") return IN_PROGRESS_STATUS_KEYS.includes(trade.status);
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
    setNavis(loadAllNavis(currentUser.id));
  }, [currentUser.id]);

  const sortedNavis = useMemo(
    () => [...navis].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [navis]
  );

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

  const draftColumns: NaviTableColumn[] = [
    {
      key: "status",
      label: "状況",
      width: "110px",
      render: (draft: TradeNaviDraft) => {
        const statusInfo = getStatusLabel(draft.status);
        return (
          <span
            className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${statusInfo.className}`}
          >
            {statusInfo.text}
          </span>
        );
      },
    },
    {
      key: "updatedAt",
      label: "更新日時",
      width: "160px",
      render: (draft: TradeNaviDraft) => formatDateTime(draft.updatedAt),
    },
    {
      key: "partner",
      label: "取引先",
      width: "18%",
      render: (draft: TradeNaviDraft) => getBuyerLabel(draft),
    },
    {
      key: "makerName",
      label: "メーカー",
      width: "140px",
      render: (draft: TradeNaviDraft) => {
        const product =
          draft.productId != null
            ? products.find((p) => String(p.id) === String(draft.productId))
            : undefined;
        return product?.maker ?? "-";
      },
    },
    {
      key: "itemName",
      label: "機種名",
      width: "22%",
      render: (draft: TradeNaviDraft) => getProductLabel(draft),
    },
    {
      key: "quantity",
      label: "台数",
      width: "80px",
      render: (draft: TradeNaviDraft) => {
        const qty = (draft.conditions as any).quantity ?? (draft.conditions as any).units ?? null;
        return qty != null ? `${qty}台` : "-";
      },
    },
    {
      key: "totalAmount",
      label: "合計金額（税込）",
      width: "140px",
      render: (draft: TradeNaviDraft) => {
        const quote = calculateQuote(draft.conditions);
        return quote.total ? formatCurrency(quote.total) : "-";
      },
    },
    {
      key: "scheduledShipDate",
      label: "発送予定日",
      width: "140px",
      render: (draft: TradeNaviDraft) => {
        const date =
          (draft.conditions as any).scheduledShipmentDate ??
          (draft.conditions as any).expectedShipmentDate ??
          null;
        return date ? formatDateTime(date) : "-";
      },
    },
    {
      key: "document",
      label: "明細書",
      width: "110px",
      render: (draft: TradeNaviDraft) => (
        <button
          type="button"
          className="inline-flex items-center justify-center rounded px-3 py-1 text-xs font-semibold bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm disabled:opacity-50"
          disabled
        >
          PDF
        </button>
      ),
    },
    {
      key: "message",
      label: "メッセージ",
      width: "110px",
      render: (draft: TradeNaviDraft) => (
        <button
          type="button"
          className="inline-flex items-center justify-center rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-[#142B5E] hover:bg-slate-100"
          onClick={(e) => {
            e.stopPropagation();
            if (draft.id) setMessageTarget(draft.id);
          }}
        >
          メッセージ
        </button>
      ),
    },
  ];

  const buyerApprovalColumns: NaviTableColumn[] = draftColumns.map((col) =>
    col.key === "document" ? { ...col, label: "発送先入力" } : col
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
            要承認
          </SectionHeader>
          <NaviTable
            columns={buyerApprovalColumns}
            rows={sortedNavis}
            emptyMessage="現在進行中の取引Naviはありません。"
            onRowClick={(draft) => draft.id && router.push(`/transactions/navi/${draft.id}`)}
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
            要承認
          </SectionHeader>
          <NaviTable
            columns={draftColumns}
            rows={sortedNavis}
            emptyMessage="現在進行中の取引Naviはありません。"
            onRowClick={(draft) => draft.id && router.push(`/transactions/navi/${draft.id}`)}
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
