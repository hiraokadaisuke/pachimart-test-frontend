"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MainContainer from "@/components/layout/MainContainer";
import MyPageLayout from "@/components/layout/MyPageLayout";
import { products } from "@/lib/dummyData";
import { loadAllNavis, createEmptyNaviDraft, saveNaviDraft } from "@/lib/navi/storage";
import { NaviStatus, TradeNaviDraft } from "@/lib/navi/types";
import { calculateQuote } from "@/lib/quotes/calculateQuote";

type TradeStatus = "入金待ち" | "確認中";
type TradeKind = "buy" | "sell";

type TradeNaviRow = {
  id: string;
  kind: TradeKind;
  status: TradeStatus;
  updatedAt: string;
  partnerName: string;
  makerName: string;
  itemName: string;
  totalAmount: number;
  scheduledShipDate: string;
  pdfUrl: string;
};

const tabs = [
  { key: "request", label: "依頼入力" },
  { key: "in-progress", label: "進行中一覧" },
  { key: "sell-history", label: "売却履歴" },
  { key: "buy-history", label: "購入履歴" },
];

const getDefaultTab = (value: string | null): (typeof tabs)[number]["key"] => {
  const candidate = tabs.find((tab) => tab.key === value)?.key;
  return candidate ?? "in-progress";
};

const dummyTrades: TradeNaviRow[] = [
  {
    id: "T-2025111901",
    kind: "buy",
    status: "入金待ち",
    updatedAt: "2025/11/19 14:55",
    partnerName: "株式会社パチテック",
    makerName: "三京商会",
    itemName: "P スーパー海物語 JAPAN2 L1",
    totalAmount: 1280000,
    scheduledShipDate: "2025/11/25",
    pdfUrl: "#",
  },
  {
    id: "T-2025111902",
    kind: "buy",
    status: "確認中",
    updatedAt: "2025/11/19 13:10",
    partnerName: "有限会社スマイル",
    makerName: "平和",
    itemName: "P ルパン三世 2000カラットの涙",
    totalAmount: 860000,
    scheduledShipDate: "2025/11/26",
    pdfUrl: "#",
  },
  {
    id: "T-2025111801",
    kind: "sell",
    status: "入金待ち",
    updatedAt: "2025/11/18 17:40",
    partnerName: "株式会社アミューズ流通",
    makerName: "SANKYO",
    itemName: "P フィーバー機動戦士ガンダムSEED",
    totalAmount: 1520000,
    scheduledShipDate: "2025/11/27",
    pdfUrl: "#",
  },
  {
    id: "T-2025111802",
    kind: "sell",
    status: "確認中",
    updatedAt: "2025/11/18 15:05",
    partnerName: "パチンコランド神奈川",
    makerName: "サミー",
    itemName: "P 北斗の拳9 闘神",
    totalAmount: 990000,
    scheduledShipDate: "2025/11/28",
    pdfUrl: "#",
  },
  {
    id: "T-2025111701",
    kind: "buy",
    status: "入金待ち",
    updatedAt: "2025/11/17 11:20",
    partnerName: "株式会社ミドルウェーブ",
    makerName: "京楽",
    itemName: "P AKB48 バラの儀式",
    totalAmount: 540000,
    scheduledShipDate: "2025/11/24",
    pdfUrl: "#",
  },
  {
    id: "T-2025111702",
    kind: "sell",
    status: "確認中",
    updatedAt: "2025/11/17 09:05",
    partnerName: "エムズホールディングス",
    makerName: "大都技研",
    itemName: "S 押忍！番長ZERO",
    totalAmount: 1320000,
    scheduledShipDate: "2025/11/29",
    pdfUrl: "#",
  },
  {
    id: "T-2025111601",
    kind: "buy",
    status: "確認中",
    updatedAt: "2025/11/16 18:30",
    partnerName: "株式会社ネクストレード",
    makerName: "ニューギン",
    itemName: "P 真・花の慶次3 黄金一閃",
    totalAmount: 1180000,
    scheduledShipDate: "2025/11/27",
    pdfUrl: "#",
  },
  {
    id: "T-2025111602",
    kind: "sell",
    status: "入金待ち",
    updatedAt: "2025/11/16 10:12",
    partnerName: "株式会社東海レジャー",
    makerName: "藤商事",
    itemName: "P とある魔術の禁書目録",
    totalAmount: 760000,
    scheduledShipDate: "2025/11/23",
    pdfUrl: "#",
  },
];

type TradeNaviTableProps = {
  title: string;
  rows: TradeNaviRow[];
  actionType: "pay" | "confirm";
};

function TradeNaviTable({ title, rows, actionType }: TradeNaviTableProps) {
  const actionLabel = actionType === "pay" ? "振込" : "OK";

  return (
    <div className="rounded border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
        {title}
      </div>
      <div className="overflow-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
            <tr>
              <th className="w-20 px-3 py-2 text-left">状況</th>
              <th className="w-32 px-3 py-2 text-left">更新日時</th>
              <th className="w-40 px-3 py-2 text-left">取引先</th>
              <th className="w-32 px-3 py-2 text-left">メーカー</th>
              <th className="px-3 py-2 text-left">物件名</th>
              <th className="w-32 px-3 py-2 text-left">合計金額（税込）</th>
              <th className="w-28 px-3 py-2 text-left">発送予定日</th>
              <th className="w-28 px-3 py-2 text-left">確認書</th>
              <th className="w-24 px-3 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody className="text-xs text-slate-700">
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-center text-slate-500" colSpan={9}>
                  該当する取引はありません。
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-200 hover:bg-slate-50">
                <td className="px-3 py-2 align-top font-semibold text-orange-600">{row.status}</td>
                <td className="px-3 py-2 align-top text-slate-600">{row.updatedAt}</td>
                <td className="px-3 py-2 align-top">{row.partnerName}</td>
                <td className="px-3 py-2 align-top">{row.makerName}</td>
                <td className="px-3 py-2 align-top">{row.itemName}</td>
                <td className="px-3 py-2 align-top font-semibold">
                  ¥{row.totalAmount.toLocaleString("ja-JP")}
                </td>
                <td className="px-3 py-2 align-top">{row.scheduledShipDate}</td>
                <td className="px-3 py-2 align-top">
                  <a
                    href={row.pdfUrl}
                    className="inline-flex items-center rounded border border-blue-600 bg-blue-600 px-2 py-1 text-xs font-semibold text-white"
                  >
                    PDF
                  </a>
                </td>
                <td className="px-3 py-2 align-top">
                  <button
                    type="button"
                    className="inline-flex items-center rounded border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-100"
                  >
                    {row.status === "入金待ち" ? "振込" : actionLabel}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getStatusLabel(status: NaviStatus) {
  switch (status) {
    case "draft":
      return { text: "下書き", className: "bg-slate-200 text-slate-700" };
    case "sent_to_buyer":
      return { text: "承認待ち", className: "bg-amber-100 text-amber-700" };
    case "buyer_approved":
      return { text: "承認済み", className: "bg-emerald-100 text-emerald-700" };
    case "buyer_rejected":
      return { text: "差戻し", className: "bg-rose-100 text-rose-700" };
    default:
      // eslint-disable-next-line no-case-declarations
      const unreachable: never = status;
      return { text: unreachable, className: "" };
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

type TradeNaviDraftTableProps = {
  title: string;
  navis: TradeNaviDraft[];
};

function TradeNaviDraftTable({ title, navis }: TradeNaviDraftTableProps) {
  const router = useRouter();

  const sortedNavis = useMemo(
    () =>
      [...navis].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [navis]
  );

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">{title}</h2>

      {sortedNavis.length === 0 ? (
        <p className="text-sm text-slate-500">現在進行中の取引Naviはありません。</p>
      ) : (
        <div className="overflow-hidden rounded border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">状況</th>
                <th className="px-3 py-2 text-left">更新日時</th>
                <th className="px-3 py-2 text-left">取引先</th>
                <th className="px-3 py-2 text-left">物件名</th>
                <th className="px-3 py-2 text-right">金額（税込）</th>
                <th className="px-3 py-2 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {sortedNavis.map((draft) => {
                const statusInfo = getStatusLabel(draft.status);
                const quote = calculateQuote(draft.conditions);
                const totalLabel =
                  quote.total && quote.total > 0 ? formatCurrency(quote.total) : "-";

                return (
                  <tr key={draft.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 align-top">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusInfo.className}`}
                      >
                        {statusInfo.text}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top">{formatDateTime(draft.updatedAt)}</td>
                    <td className="px-3 py-2 align-top">{getBuyerLabel(draft)}</td>
                    <td className="px-3 py-2 align-top">{getProductLabel(draft)}</td>
                    <td className="px-3 py-2 align-top text-right font-semibold">{totalLabel}</td>
                    <td className="px-3 py-2 align-top text-right">
                      <button
                        type="button"
                        className="pm-secondary-button"
                        onClick={() => router.push(`/transactions/navi/${draft.id}/edit`)}
                      >
                        Navi確認
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TradeNaviPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const buyWaiting = dummyTrades.filter(
    (trade) => trade.kind === "buy" && trade.status === "入金待ち"
  );
  const buyChecking = dummyTrades.filter(
    (trade) => trade.kind === "buy" && trade.status === "確認中"
  );
  const sellWaiting = dummyTrades.filter(
    (trade) => trade.kind === "sell" && trade.status === "入金待ち"
  );
  const sellChecking = dummyTrades.filter(
    (trade) => trade.kind === "sell" && trade.status === "確認中"
  );

  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["key"]>(() =>
    getDefaultTab(searchParams?.get("tab"))
  );
  const [hasRedirected, setHasRedirected] = useState(false);
  const [navis, setNavis] = useState<TradeNaviDraft[]>([]);

  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    const nextTab = getDefaultTab(tabParam);
    setActiveTab((current) => {
      if (current !== nextTab) {
        setHasRedirected(false);
        return nextTab;
      }
      return current;
    });
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === "request" && !hasRedirected) {
      setHasRedirected(true);
      const draft = createEmptyNaviDraft();
      saveNaviDraft(draft);
      router.replace(`/transactions/navi/${draft.id}/edit`);
    }
  }, [activeTab, hasRedirected, router]);

  useEffect(() => {
    setNavis(loadAllNavis());
  }, []);

  const handleTabClick = (tabKey: (typeof tabs)[number]["key"]) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("tab", tabKey);
    setActiveTab(tabKey);
    setHasRedirected(false);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <MainContainer variant="wide">
      <div className="flex flex-col gap-8">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold text-slate-900">取引Navi</h1>
          <div className="mb-6 border-b border-slate-200">
            <div className="flex gap-2">
              {tabs.map((tab) => {
                const isActive = tab.key === activeTab;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    className={[
                      "rounded-t-md border px-4 py-2 text-sm",
                      isActive
                        ? "border-slate-200 border-b-white bg-white font-semibold text-slate-900"
                        : "border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200",
                    ].join(" ")}
                    onClick={() => handleTabClick(tab.key)}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-sm text-slate-700">
            電話などで合意した取引内容を、パチマート上で確認・管理するための画面です。
          </p>
        </header>

        <section className="space-y-4">
          {activeTab === "request" ? (
            <div className="rounded border border-slate-200 bg-white p-8 text-center text-sm text-slate-700">
              新しい取引Naviを作成しています…
            </div>
          ) : (
            <>
              <div className="mb-2 rounded-t-sm bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
                買いたい物件 – 入金・確認状況
              </div>
              <p className="text-xs font-semibold text-red-500">
                入金待ちの案件は、発注予定日までに必ずご確認ください。
              </p>

              <TradeNaviDraftTable title="取引条件の承認状況（Navi）" navis={navis} />

              <TradeNaviTable title="入金待ち" rows={buyWaiting} actionType="pay" />

              <p className="text-xs font-semibold text-red-500">
                ※ 入金確認後は、必ず「振込」ボタンを押してください。ボタンが押されないと売主様に入金が伝わりません。
              </p>

              <TradeNaviTable title="確認中" rows={buyChecking} actionType="confirm" />
            </>
          )}
        </section>

        {activeTab !== "request" && (
          <section className="space-y-4">
            <div className="mb-2 rounded-t-sm bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
              売りたい物件 – 入金・確認状況
            </div>
            <p className="text-xs font-semibold text-red-500">
              売りたい物件の入金・動作確認状況を確認できます。入金手続き中の案件は、買い手様の手続き完了までお待ちください。
            </p>

            <TradeNaviDraftTable title="取引条件の承認状況（Navi）" navis={navis} />

            <TradeNaviTable title="入金待ち" rows={sellWaiting} actionType="pay" />
            <TradeNaviTable title="確認中" rows={sellChecking} actionType="confirm" />
          </section>
        )}
      </div>
    </MainContainer>
  );
}

export default function TradeNaviPage() {
  return (
    <MyPageLayout>
      <Suspense
        fallback={
          <MainContainer variant="wide">
            <div className="rounded border border-slate-200 bg-white p-8 text-center text-sm text-slate-700">
              取引Naviを読み込んでいます…
            </div>
          </MainContainer>
        }
      >
        <TradeNaviPageContent />
      </Suspense>
    </MyPageLayout>
  );
}
