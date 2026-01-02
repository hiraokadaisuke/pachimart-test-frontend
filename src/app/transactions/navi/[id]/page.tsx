"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { StatusBadge } from "@/components/transactions/StatusBadge";
import { type TradeStatusKey } from "@/components/transactions/status";
import { TradeDetailView } from "@/components/transactions/TradeDetailView";

type TradeDetailResponse = {
  id: number;
  status: string;
  sellerUserId: string;
  buyerUserId: string | null;
  payload: unknown;
  naviId: number;
  createdAt: string;
  updatedAt: string;
  navi?: {
    id: number;
    ownerUserId: string;
    buyerUserId: string | null;
    payload: unknown;
    createdAt: string;
    updatedAt: string;
  };
  sellerUser?: { id: string; companyName: string } | null;
  buyerUser?: { id: string; companyName: string } | null;
};

type TradeDetailView = {
  tradeId: string;
  statusKey: TradeStatusKey;
  sellerName: string;
  buyerName: string;
  makerName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  shippingFee: number;
  handlingFee: number;
  cardboardFee: number;
  nailSheetFee: number;
  insuranceFee: number;
  removalDate: string;
  machineShipmentDate: string;
  documentShipmentDate: string;
  paymentDue: string;
  notes: string;
  terms: string;
  memo: string;
  handler: string;
};

const buildDefaultView = (tradeId: string): TradeDetailView => ({
  tradeId,
  statusKey: "payment_confirmed",
  sellerName: "株式会社ダミー商事",
  buyerName: "株式会社テスト",
  makerName: "SANKYO",
  productName: "P スーパー海物語 IN 沖縄5",
  quantity: 4,
  unitPrice: 300000,
  shippingFee: 30000,
  handlingFee: 10000,
  cardboardFee: 0,
  nailSheetFee: 0,
  insuranceFee: 0,
  removalDate: "-",
  machineShipmentDate: "-",
  documentShipmentDate: "-",
  paymentDue: "-",
  notes: "-",
  terms: "-",
  memo: "-",
  handler: "-",
});

const toNumber = (value: unknown): number => {
  const parsed = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(parsed) ? parsed : 0;
};

const transformTradeDetail = (dto: TradeDetailResponse, fallbackId: string): TradeDetailView => {
  const base = buildDefaultView(fallbackId);
  const tradeIdValue = dto.id;
  const tradeId = Number.isFinite(tradeIdValue ?? NaN) ? String(tradeIdValue) : base.tradeId;
  const payload = (dto.payload ?? dto.navi?.payload ?? {}) as Record<string, unknown>;
  const conditionsCandidate = (payload as { conditions?: unknown }).conditions;
  const conditions =
    conditionsCandidate && typeof conditionsCandidate === "object"
      ? (conditionsCandidate as Record<string, unknown>)
      : {};

  const unitPrice = toNumber(conditions.unitPrice);
  const quantity = Math.max(toNumber(conditions.quantity) || 1, 1);
  const shippingFee =
    conditions.shippingFee !== undefined ? toNumber(conditions.shippingFee) : base.shippingFee;
  const handlingFee =
    conditions.handlingFee !== undefined ? toNumber(conditions.handlingFee) : base.handlingFee;
  const cardboardFee =
    conditions.cardboardFee && typeof conditions.cardboardFee === "object"
      ? toNumber((conditions.cardboardFee as { amount?: unknown }).amount)
      : base.cardboardFee;
  const nailSheetFee =
    conditions.nailSheetFee && typeof conditions.nailSheetFee === "object"
      ? toNumber((conditions.nailSheetFee as { amount?: unknown }).amount)
      : base.nailSheetFee;
  const insuranceFee =
    conditions.insuranceFee && typeof conditions.insuranceFee === "object"
      ? toNumber((conditions.insuranceFee as { amount?: unknown }).amount)
      : base.insuranceFee;

  const productNameCandidate = (payload as { productName?: unknown }).productName ?? conditions.productName;
  const makerNameCandidate = (payload as { makerName?: unknown }).makerName ?? conditions.makerName;

  const productName =
    typeof productNameCandidate === "string" && productNameCandidate.trim()
      ? productNameCandidate
      : base.productName;
  const makerName =
    typeof makerNameCandidate === "string" && makerNameCandidate.trim()
      ? makerNameCandidate
      : base.makerName;
  const sellerName = dto.sellerUser?.companyName ?? base.sellerName;
  const buyerName = dto.buyerUser?.companyName ?? base.buyerName;

  return {
    ...base,
    tradeId,
    sellerName,
    buyerName,
    makerName,
    productName,
    quantity,
    unitPrice: unitPrice || base.unitPrice,
    shippingFee,
    handlingFee,
    cardboardFee,
    nailSheetFee,
    insuranceFee,
    removalDate: String(conditions.removalDate ?? base.removalDate),
    machineShipmentDate: String(conditions.machineShipmentDate ?? base.machineShipmentDate),
    documentShipmentDate: String(conditions.documentShipmentDate ?? base.documentShipmentDate),
    paymentDue: String(conditions.paymentDue ?? base.paymentDue),
    notes: String(conditions.notes ?? base.notes),
    terms: String(conditions.terms ?? base.terms),
    memo: String(conditions.memo ?? base.memo),
    handler: String(conditions.handler ?? base.handler),
  };
};

const formatCurrency = (value: number) => `¥${value.toLocaleString("ja-JP")}`;
const buildLabel = (value: string) => (value && value !== "null" && value !== "undefined" ? value : "-");

export default function TransactionDetailPage() {
  const params = useParams<{ id?: string }>();
  const tradeId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const fallbackId = tradeId ?? "TRADE-000000";
  const [view, setView] = useState<TradeDetailView>(() => buildDefaultView(fallbackId));

  useEffect(() => {
    setView(buildDefaultView(fallbackId));
  }, [fallbackId]);

  useEffect(() => {
    if (!tradeId) return;

    const fetchTradeDetail = async () => {
      try {
        const response = await fetch(`/api/trades/in-progress/${tradeId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch trade detail: ${response.status}`);
        }

        const data: TradeDetailResponse = await response.json();
        setView(transformTradeDetail(data, fallbackId));
      } catch (error) {
        console.error("Failed to load trade detail", error);
      }
    };

    fetchTradeDetail();
  }, [fallbackId, tradeId]);

  const subtotal = useMemo(() => view.unitPrice * view.quantity, [view.quantity, view.unitPrice]);
  const total = useMemo(
    () =>
      subtotal +
      view.shippingFee +
      view.handlingFee +
      view.cardboardFee +
      view.nailSheetFee +
      view.insuranceFee,
    [subtotal, view.cardboardFee, view.handlingFee, view.insuranceFee, view.nailSheetFee, view.shippingFee]
  );
  const isConfirmed = view.statusKey === "payment_confirmed" || view.statusKey === "trade_completed";

  const sections = useMemo(
    () => [
      {
        title: "取引先情報",
        description: "ナビ作成と同じ順序",
        content: (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-700">
              <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-800">買手</span>
              <span className="text-sm text-neutral-900">{view.buyerName}</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-800">売手</span>
              <span className="text-sm text-neutral-900">{view.sellerName}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <InfoItem label="取引ID" value={view.tradeId} emphasis />
              <InfoItem label="担当者" value={buildLabel(view.handler)} />
            </div>
          </div>
        ),
      },
      {
        title: "物件情報",
        description: "取引対象",
        content: (
          <div className="grid gap-3 md:grid-cols-2">
            <InfoItem label="メーカー" value={view.makerName} emphasis />
            <InfoItem label="機種名" value={view.productName} />
            <InfoItem label="台数" value={`${view.quantity}台`} />
            <InfoItem label="単価" value={formatCurrency(view.unitPrice)} />
          </div>
        ),
      },
      {
        title: "取引条件",
        description: "ナビ作成の順序",
        content: (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-slate-300 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-neutral-700">
                  <th className="w-40 px-3 py-1.5">項目</th>
                  <th className="px-3 py-1.5">内容</th>
                </tr>
              </thead>
              <tbody className="text-neutral-900">
                <ConditionRow label="単価" value={formatCurrency(view.unitPrice)} />
                <ConditionRow label="台数" value={`${view.quantity}台`} />
                <ConditionRow label="撤去日" value={buildLabel(view.removalDate)} />
                <ConditionRow label="機械発送日" value={buildLabel(view.machineShipmentDate)} />
                <ConditionRow label="書類発送予定日" value={buildLabel(view.documentShipmentDate)} />
                <ConditionRow label="支払日" value={buildLabel(view.paymentDue)} />
                <ConditionRow label="機械運賃" value={formatFee(view.shippingFee)} />
                <ConditionRow label="出庫手数料" value={formatFee(view.handlingFee)} />
                <ConditionRow label="段ボール" value={formatFee(view.cardboardFee)} />
                <ConditionRow label="釘シート" value={formatFee(view.nailSheetFee)} />
                <ConditionRow label="保険" value={formatFee(view.insuranceFee)} />
                <ConditionRow label="特記事項" value={buildLabel(view.notes)} />
                <ConditionRow label="取引条件（テキスト）" value={buildLabel(view.terms)} />
                <ConditionRow label="備考" value={buildLabel(view.memo)} />
                <ConditionRow label="担当者" value={buildLabel(view.handler)} />
              </tbody>
            </table>
          </div>
        ),
      },
    ],
    [
      view.buyerName,
      view.cardboardFee,
      view.documentShipmentDate,
      view.handlingFee,
      view.handler,
      view.insuranceFee,
      view.machineShipmentDate,
      view.makerName,
      view.memo,
      view.nailSheetFee,
      view.notes,
      view.paymentDue,
      view.productName,
      view.quantity,
      view.removalDate,
      view.sellerName,
      view.shippingFee,
      view.terms,
      view.tradeId,
      view.unitPrice,
    ]
  );

  return (
    <TradeDetailView
      header={{
        title: "取引詳細",
        description: "ナビ作成と同じ見出し順で取引内容を確認できます。",
        rightActions: <StatusBadge statusKey={view.statusKey} context="inProgress" />,
      }}
      leftSections={sections}
      summaryCard={{
        title: isConfirmed ? "合計（確定）" : "合計（参考）",
        total: formatCurrency(total),
        note: isConfirmed
          ? "確定した金額を表示しています。明細書の内容に基づき計算されます。"
          : "金額は参考値です。ナビ確定後に明細書で確定します。",
      }}
      mode="navi"
      variant="view"
    />
  );
}

function formatFee(value: number) {
  return value ? formatCurrency(value) : "-";
}

function ConditionRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-t border-slate-300">
      <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">{label}</th>
      <td className="px-3 py-2">{value}</td>
    </tr>
  );
}

function InfoItem({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold text-neutral-500">{label}</span>
      <span className={`text-sm ${emphasis ? "font-semibold text-slate-900" : "text-neutral-900"}`}>{value}</span>
    </div>
  );
}
