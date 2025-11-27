"use client";

import { useMemo } from "react";
import MainContainer from "@/components/layout/MainContainer";

type TradeStatus = "入金待ち" | "確認中";
type TradeKind = "buy" | "sell";

type TradeNaviApproval = {
  id: number;
  role: "buyer" | "seller";
  kind: "inquiry" | "need_my_approval" | "waiting_buyer";
  statusLabel: string;
  updatedAt: string;
  counterparty: string;
  maker: string;
  title: string;
  totalAmount: number;
};

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

const buyerApprovals: TradeNaviApproval[] = [
  {
    id: 1,
    role: "buyer",
    kind: "inquiry",
    statusLabel: "売手の条件入力待ち",
    updatedAt: "2025/11/19 14:55",
    counterparty: "株式会社パチテック",
    maker: "SANKYO",
    title: "Ｐフィーバー機動戦士ガンダムSEED",
    totalAmount: 1520000,
  },
  {
    id: 2,
    role: "buyer",
    kind: "need_my_approval",
    statusLabel: "あなたの承認待ち",
    updatedAt: "2025/11/18 10:20",
    counterparty: "株式会社スマイル",
    maker: "三洋",
    title: "Ｐスーパー海物語 JAPAN2 L1",
    totalAmount: 980000,
  },
];

const sellerApprovals: TradeNaviApproval[] = [
  {
    id: 3,
    role: "seller",
    kind: "waiting_buyer",
    statusLabel: "買手の承認待ち",
    updatedAt: "2025/11/18 17:40",
    counterparty: "株式会社アミューズ流通",
    maker: "SANKYO",
    title: "Ｐフィーバー機動戦士ガンダムSEED",
    totalAmount: 1520000,
  },
];

type TradeNaviTableProps = {
  title: string;
  rows: TradeNaviRow[];
  actionType: "pay" | "confirm";
};

type TradeNaviApprovalTableProps = {
  title: string;
  approvals: TradeNaviApproval[];
  role: "buyer" | "seller";
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
                    className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded border border-blue-600 bg-blue-600 text-white"
                  >
                    PDF
                  </a>
                </td>
                <td className="px-3 py-2 align-top">
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1 text-xs rounded border border-slate-300 bg-white hover:bg-slate-100"
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

function TradeNaviApprovalTable({ title, approvals, role }: TradeNaviApprovalTableProps) {
  const formatter = useMemo(() => new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }), []);

  const getCategoryLabel = (kind: TradeNaviApproval["kind"]) => {
    if (kind === "inquiry") return "問い合わせ中";
    return "承認待ち";
  };

  const getActionStyle = (kind: TradeNaviApproval["kind"]) => {
    if (kind === "need_my_approval") {
      return "inline-flex items-center rounded border border-blue-600 bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-blue-700";
    }
    return "inline-flex items-center rounded border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-100";
  };

  const getActionLabel = (kind: TradeNaviApproval["kind"]) => {
    if (kind === "need_my_approval") return "内容確認・承認";
    return "詳細を見る";
  };

  const renderStatus = (approval: TradeNaviApproval) => {
    if (role === "seller") {
      return "買手の承認待ち";
    }
    if (approval.kind === "inquiry") return "売手の条件入力待ち";
    if (approval.kind === "need_my_approval") return "あなたの承認待ち";
    return approval.statusLabel;
  };

  return (
    <div className="rounded border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
        {title}
      </div>
      <div className="overflow-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
            <tr>
              <th className="w-28 px-3 py-2 text-left">状況</th>
              <th className="w-24 px-3 py-2 text-left">区分</th>
              <th className="w-32 px-3 py-2 text-left">更新日時</th>
              <th className="w-40 px-3 py-2 text-left">取引先</th>
              <th className="w-28 px-3 py-2 text-left">メーカー</th>
              <th className="px-3 py-2 text-left">物件名（機種名）</th>
              <th className="w-36 px-3 py-2 text-left">合計金額（税込）</th>
              <th className="w-28 px-3 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody className="text-xs text-slate-700">
            {approvals.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-center text-slate-500" colSpan={8}>
                  取引条件の承認状況に該当する案件はありません。
                </td>
              </tr>
            )}
            {approvals.map((approval) => (
              <tr key={approval.id} className="border-t border-slate-200 hover:bg-slate-50">
                <td className="px-3 py-2 align-top font-semibold text-orange-600">{renderStatus(approval)}</td>
                <td className="px-3 py-2 align-top text-slate-700">{getCategoryLabel(approval.kind)}</td>
                <td className="px-3 py-2 align-top text-slate-600">{approval.updatedAt}</td>
                <td className="px-3 py-2 align-top">{approval.counterparty}</td>
                <td className="px-3 py-2 align-top">{approval.maker}</td>
                <td className="px-3 py-2 align-top">{approval.title}</td>
                <td className="px-3 py-2 align-top font-semibold">{formatter.format(approval.totalAmount)}</td>
                <td className="px-3 py-2 align-top">
                  <button type="button" className={getActionStyle(approval.kind)}>
                    {getActionLabel(approval.kind)}
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


export default function TradeNaviPage() {
  const buyWaiting = dummyTrades.filter((trade) => trade.kind === "buy" && trade.status === "入金待ち");
  const buyChecking = dummyTrades.filter((trade) => trade.kind === "buy" && trade.status === "確認中");
  const sellWaiting = dummyTrades.filter((trade) => trade.kind === "sell" && trade.status === "入金待ち");
  const sellChecking = dummyTrades.filter((trade) => trade.kind === "sell" && trade.status === "確認中");
  const activeTab: (typeof tabs)[number]["key"] = "in-progress";

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
                      "px-4 py-2 text-sm rounded-t-md border",
                      isActive
                        ? "border-slate-200 border-b-white bg-white font-semibold text-slate-900"
                        : "border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200",
                    ].join(" ")}
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
          <div className="mb-2 rounded-t-sm bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
            買いたい物件 – 入金・確認状況
          </div>
          <p className="text-xs font-semibold text-red-500">
            入金待ちの案件は、発注予定日までに必ずご確認ください。
          </p>

          <TradeNaviApprovalTable title="取引条件の承認状況（Navi）" approvals={buyerApprovals} role="buyer" />

          <TradeNaviTable title="入金待ち" rows={buyWaiting} actionType="pay" />

          <p className="text-xs font-semibold text-red-500">
            ※ 入金確認後は、必ず「振込」ボタンを押してください。ボタンが押されないと売主様に入金が伝わりません。
          </p>

          <TradeNaviTable title="確認中" rows={buyChecking} actionType="confirm" />
        </section>

        <section className="space-y-4">
          <div className="mb-2 rounded-t-sm bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
            売りたい物件 – 入金・確認状況
          </div>
          <p className="text-xs font-semibold text-red-500">
            売りたい物件の入金・動作確認状況を確認できます。入金手続き中の案件は、買い手様の手続き完了までお待ちください。
          </p>

          <TradeNaviApprovalTable title="取引条件の承認状況（Navi）" approvals={sellerApprovals} role="seller" />

          <TradeNaviTable title="入金待ち" rows={sellWaiting} actionType="pay" />
          <TradeNaviTable title="確認中" rows={sellChecking} actionType="confirm" />
        </section>
      </div>
    </MainContainer>
  );
}
