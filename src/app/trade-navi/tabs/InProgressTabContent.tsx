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

const dummyTrades: TradeRow[] = [
  {
    id: "T-2025111901",
    status: "waiting_payment",
    updatedAt: "2025/11/19 14:55",
    partnerName: "株式会社パチテック",
    makerName: "三京商会",
    itemName: "P スーパー海物語 JAPAN2 L1",
    quantity: 10,
    totalAmount: 1280000,
    scheduledShipDate: "2025/11/25",
    pdfUrl: "#",
    sellerUserId: "user-b",
    buyerUserId: "user-a",
    sellerName: "株式会社パチテック",
    buyerName: "株式会社トレード連合",
  },
  {
    id: "T-2025111902",
    status: "navi_in_progress",
    updatedAt: "2025/11/19 13:10",
    partnerName: "有限会社スマイル",
    makerName: "平和",
    itemName: "P ルパン三世 2000カラットの涙",
    quantity: 6,
    totalAmount: 860000,
    scheduledShipDate: "2025/11/26",
    pdfUrl: "#",
    sellerUserId: "user-b",
    buyerUserId: "user-a",
    sellerName: "有限会社スマイル",
    buyerName: "関東レジャー販売",
  },
  {
    id: "T-2025111801",
    status: "waiting_payment",
    updatedAt: "2025/11/18 17:40",
    partnerName: "株式会社アミューズ流通",
    makerName: "SANKYO",
    itemName: "P フィーバー機動戦士ガンダムSEED",
    quantity: 8,
    totalAmount: 1520000,
    scheduledShipDate: "2025/11/27",
    pdfUrl: "#",
    sellerUserId: "user-a",
    buyerUserId: "user-b",
    sellerName: "株式会社アミューズ流通",
    buyerName: "九州エンタメ産業",
  },
  {
    id: "T-2025111802",
    status: "navi_in_progress",
    updatedAt: "2025/11/18 15:05",
    partnerName: "パチンコランド神奈川",
    makerName: "サミー",
    itemName: "P 北斗の拳9 闘神",
    quantity: 5,
    totalAmount: 990000,
    scheduledShipDate: "2025/11/28",
    pdfUrl: "#",
    sellerUserId: "user-a",
    buyerUserId: "user-b",
    sellerName: "パチンコランド神奈川",
    buyerName: "関東レジャー販売",
  },
  {
    id: "T-2025111701",
    status: "waiting_payment",
    updatedAt: "2025/11/17 11:20",
    partnerName: "株式会社ミドルウェーブ",
    makerName: "京楽",
    itemName: "P AKB48 バラの儀式",
    quantity: 4,
    totalAmount: 540000,
    scheduledShipDate: "2025/11/24",
    pdfUrl: "#",
    sellerUserId: "user-b",
    buyerUserId: "user-a",
    sellerName: "株式会社ミドルウェーブ",
    buyerName: "関東レジャー販売",
  },
  {
    id: "T-2025111702",
    status: "navi_in_progress",
    updatedAt: "2025/11/17 09:05",
    partnerName: "エムズホールディングス",
    makerName: "大都技研",
    itemName: "S 押忍！番長ZERO",
    quantity: 12,
    totalAmount: 1320000,
    scheduledShipDate: "2025/11/29",
    pdfUrl: "#",
    sellerUserId: "user-a",
    buyerUserId: "user-b",
    sellerName: "エムズホールディングス",
    buyerName: "関東レジャー販売",
  },
  {
    id: "T-2025111601",
    status: "navi_in_progress",
    updatedAt: "2025/11/16 18:30",
    partnerName: "株式会社ネクストレード",
    makerName: "ニューギン",
    itemName: "P 真・花の慶次3 黄金一閃",
    quantity: 7,
    totalAmount: 1180000,
    scheduledShipDate: "2025/11/27",
    pdfUrl: "#",
    sellerUserId: "user-b",
    buyerUserId: "user-a",
    sellerName: "株式会社ネクストレード",
    buyerName: "関東レジャー販売",
  },
  {
    id: "T-2025111602",
    status: "waiting_payment",
    updatedAt: "2025/11/16 10:12",
    partnerName: "株式会社東海レジャー",
    makerName: "藤商事",
    itemName: "P とある魔術の禁書目録",
    quantity: 9,
    totalAmount: 760000,
    scheduledShipDate: "2025/11/23",
    pdfUrl: "#",
    sellerUserId: "user-a",
    buyerUserId: "user-b",
    sellerName: "株式会社東海レジャー",
    buyerName: "関東レジャー販売",
  },
];

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
      return { text: "承認待ち", className: "bg-sky-100 text-sky-700" };
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

  const filteredTrades = useMemo(() => filterTrades(dummyTrades), [filterTrades]);

  const filteredPendingResponses = useMemo(
    () => filterTrades(buyingPendingResponses),
    [filterTrades]
  );

  const filteredNeedResponses = useMemo(() => filterTrades(sellingNeedResponses), [filterTrades]);

  const buyWaiting = filteredTrades.filter((trade) => trade.kind === "buy" && trade.status === "waiting_payment");
  const buyChecking = filteredTrades.filter((trade) => trade.kind === "buy" && trade.status === "navi_in_progress");
  const buyPendingResponse = filteredPendingResponses.filter((trade) => trade.kind === "buy");
  const sellWaiting = filteredTrades.filter((trade) => trade.kind === "sell" && trade.status === "waiting_payment");
  const sellChecking = filteredTrades.filter((trade) => trade.kind === "sell" && trade.status === "navi_in_progress");
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

  const paymentActionColumn: NaviTableColumn = {
    key: "action",
    label: "入金",
    width: "110px",
    render: (row: TradeRow) => (
      <button
        type="button"
        className="inline-flex items-center justify-center rounded px-3 py-1 text-xs font-semibold bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm"
      >
        入金
      </button>
    ),
  };

  const checkingActionColumn: NaviTableColumn = {
    key: "action",
    label: "動作確認",
    width: "110px",
    render: (row: TradeRow) => (
      <button
        type="button"
        className="inline-flex items-center justify-center rounded px-3 py-1 text-xs font-semibold bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm"
      >
        確認完了
      </button>
    ),
  };

  const tradeColumnsForPayment: NaviTableColumn[] = [
    ...tradeColumnBase,
    paymentActionColumn,
    messageColumn,
  ];

  const tradeColumnsForChecking: NaviTableColumn[] = [
    ...tradeColumnBase,
    checkingActionColumn,
    messageColumn,
  ];

  const tradeColumnsWithoutAction: NaviTableColumn[] = [
    ...tradeColumnBase,
    messageColumn,
  ];

  const tradeColumnsForBuyNetInquiry: NaviTableColumn[] = [
    {
      ...tradeColumnBase[0],
      render: (row: TradeRow) => <StatusBadge statusKey={row.status} context="netInquiryBuy" />,
    },
    ...tradeColumnBase.slice(1),
    messageColumn,
  ];

  const tradeColumnsForSellNetInquiry: NaviTableColumn[] = [
    {
      ...tradeColumnBase[0],
      render: (row: TradeRow) => <StatusBadge statusKey={row.status} context="netInquirySell" />,
    },
    ...tradeColumnBase.slice(1),
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
      key: "actions",
      label: "操作",
      width: "110px",
      render: (draft: TradeNaviDraft) => (
        <button
          type="button"
          className="pm-secondary-button px-3 py-1 text-xs"
          onClick={() => router.push(`/transactions/navi/${draft.id}/edit`)}
        >
          Navi確認
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

  const buySectionDescriptions = {
    approval: "売主様から届いた依頼です。内容を確認のうえ、承認してください。",
    payment: "発送予定日までに振込をお願いします。",
    checking: "動作確認を行い、動作確認ボタンを押してください。",
    pendingResponse: "オンラインでオファーをしています。売主様からの返答をお待ちください。",
  } as const;

  const sellSectionDescriptions = {
    approval: "依頼を送りました。買主様からの承認をお待ちください。",
    payment: "買主様からの入金をお待ちください。",
    checking: "買主様からの入金がありました。発送をしてください。",
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
            columns={draftColumns}
            rows={sortedNavis}
            emptyMessage="現在進行中の取引Naviはありません。"
            onRowClick={(draft) => draft.id && router.push(`/transactions/navi/${draft.id}`)}
          />
        </div>

        <div className="space-y-2">
          <SectionHeader
            className="px-3 py-2 text-xs"
            description={buySectionDescriptions.payment}
          >
            入金待ち
          </SectionHeader>
          <NaviTable
            columns={tradeColumnsForPayment}
            rows={buyWaiting}
            emptyMessage="現在進行中の取引はありません。"
            onRowClick={(row) => row.id && router.push(`/transactions/navi/${row.id}`)}
          />
        </div>

        <div className="space-y-2">
          <SectionHeader
            className="px-3 py-2 text-xs"
            description={buySectionDescriptions.checking}
          >
            確認待ち
          </SectionHeader>
          <NaviTable
            columns={tradeColumnsForChecking}
            rows={buyChecking}
            emptyMessage="現在進行中の取引はありません。"
            onRowClick={(row) => row.id && router.push(`/transactions/navi/${row.id}`)}
          />
        </div>

        <div className="space-y-2">
          <SectionHeader
            className="px-3 py-2 text-xs"
            description={buySectionDescriptions.pendingResponse}
          >
            ネット問い合わせ返答待ち
          </SectionHeader>
          <NaviTable
            columns={tradeColumnsForBuyNetInquiry}
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
            columns={draftColumns}
            rows={sortedNavis}
            emptyMessage="現在進行中の取引Naviはありません。"
            onRowClick={(draft) => draft.id && router.push(`/transactions/navi/${draft.id}`)}
          />
        </div>

        <div className="space-y-2">
          <SectionHeader
            className="px-3 py-2 text-xs"
            description={sellSectionDescriptions.payment}
          >
            入金待ち
          </SectionHeader>
          <NaviTable
            columns={tradeColumnsWithoutAction}
            rows={sellWaiting}
            emptyMessage="現在進行中の取引はありません。"
            onRowClick={(row) => row.id && router.push(`/transactions/navi/${row.id}`)}
          />
        </div>
        <div className="space-y-2">
          <SectionHeader
            className="px-3 py-2 text-xs"
            description={sellSectionDescriptions.checking}
          >
            確認待ち
          </SectionHeader>
          <NaviTable
            columns={tradeColumnsWithoutAction}
            rows={sellChecking}
            emptyMessage="現在進行中の取引はありません。"
            onRowClick={(row) => row.id && router.push(`/transactions/navi/${row.id}`)}
          />
        </div>

        <div className="space-y-2">
          <SectionHeader
            className="px-3 py-2 text-xs"
            description={sellSectionDescriptions.needResponse}
          >
            ネット問い合わせ要返答
          </SectionHeader>
          <NaviTable
            columns={tradeColumnsForSellNetInquiry}
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
