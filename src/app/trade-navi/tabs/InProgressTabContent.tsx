"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";

const dummyTrades: Array<{
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
}> = [
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

  const filteredTrades = useMemo(() => {
    const keywordLower = keyword.toLowerCase();

    return dummyTrades
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
  }, [currentUser.id, keyword, statusFilter]);

  const buyWaiting = filteredTrades.filter((trade) => trade.kind === "buy" && trade.status === "waiting_payment");
  const buyChecking = filteredTrades.filter((trade) => trade.kind === "buy" && trade.status === "navi_in_progress");
  const sellWaiting = filteredTrades.filter((trade) => trade.kind === "sell" && trade.status === "waiting_payment");
  const sellChecking = filteredTrades.filter((trade) => trade.kind === "sell" && trade.status === "navi_in_progress");

  useEffect(() => {
    setNavis(loadAllNavis(currentUser.id));
  }, [currentUser.id]);

  const sortedNavis = useMemo(
    () => [...navis].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [navis]
  );

  const tradeColumns: NaviTableColumn[] = [
    {
      key: "status",
      label: "状況",
      width: "110px",
      render: (row: (typeof dummyTrades)[number]) => (
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
      label: "物件名",
      width: "22%",
    },
    {
      key: "totalAmount",
      label: "合計金額（税込）",
      width: "140px",
      render: (row: (typeof dummyTrades)[number]) => formatCurrency(row.totalAmount),
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
      render: (row: (typeof dummyTrades)[number]) => (
        <a
          href={row.pdfUrl}
          className="inline-flex items-center justify-center rounded px-3 py-1 text-xs font-semibold bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm"
        >
          PDF
        </a>
      ),
    },
    {
      key: "action",
      label: "操作",
      width: "110px",
      render: (row: (typeof dummyTrades)[number]) => (
        <button
          type="button"
          className="inline-flex items-center justify-center rounded px-3 py-1 text-xs font-semibold bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm"
        >
          {row.status === "waiting_payment" ? "振込" : "動作確認"}
        </button>
      ),
    },
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
      label: "確認書",
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
  ];

  const buySectionDescriptions = {
    approval: "オンラインでオファーをしています。売主様からの返答をお待ちください。",
    payment: "発送予定日までに振込をお願いします。",
    checking: "動作確認を行い、動作確認ボタンを押してください。",
  } as const;

  const sellSectionDescriptions = {
    approval: "依頼を送りました。買主様からの承認をお待ちください。",
    payment: "買主様からの入金をお待ちください。",
    checking: "買主様からの入金がありました。発送をしてください。",
  } as const;

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
            要入金
          </SectionHeader>
          <NaviTable
            columns={tradeColumns}
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
            columns={tradeColumns}
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
            description={sellSectionDescriptions.payment}
          >
            要入金
          </SectionHeader>
          <NaviTable
            columns={tradeColumns}
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
            columns={tradeColumns}
            rows={sellChecking}
            emptyMessage="現在進行中の取引はありません。"
            onRowClick={(row) => row.id && router.push(`/transactions/navi/${row.id}`)}
          />
        </div>
      </section>
    </section>
  );
}
