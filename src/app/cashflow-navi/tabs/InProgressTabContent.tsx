"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

function formatCurrency(amount: number) {
  const formatter = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });
  return formatter.format(amount);
}

export function InProgressTabContent() {
  const currentUser = useCurrentDevUser();
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

  const buyWaiting = filteredTrades.filter((trade) => trade.kind === "buy" && trade.status === "waiting_payment");
  const buyChecking = filteredTrades.filter((trade) => trade.kind === "buy" && trade.status === "navi_in_progress");
  const sellWaiting = filteredTrades.filter((trade) => trade.kind === "sell" && trade.status === "waiting_payment");
  const sellChecking = filteredTrades.filter((trade) => trade.kind === "sell" && trade.status === "navi_in_progress");

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

  const buySectionDescriptions = {
    payment: "発送予定日までに振込をお願いします。",
    checking: "動作確認を行い、動作確認ボタンを押してください。",
  } as const;

  const sellSectionDescriptions = {
    payment: "買主様からの入金をお待ちください。",
    checking: "買主様からの入金がありました。発送をしてください。",
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
            description={buySectionDescriptions.payment}
          >
            要入金
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
            要確認
          </SectionHeader>
          <NaviTable
            columns={tradeColumnsForChecking}
            rows={buyChecking}
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
            description={sellSectionDescriptions.payment}
          >
            要入金
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
            要確認
          </SectionHeader>
          <NaviTable
            columns={tradeColumnsWithoutAction}
            rows={sellChecking}
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
