"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { StatusBadge } from "@/components/transactions/StatusBadge";
import { type TradeStatusKey } from "@/components/transactions/status";

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
  title: string;
  partnerName: string;
  statusKey: TradeStatusKey;
  amounts: {
    goods: number;
    shipping: number;
    fee: number;
    total: number;
  };
};

const buildDefaultView = (tradeId: string): TradeDetailView => ({
  tradeId,
  title: "パチンコ機器の売買（サンプル）",
  partnerName: "株式会社ダミー商事",
  statusKey: "payment_confirmed",
  amounts: {
    goods: 1200000,
    shipping: 30000,
    fee: 10000,
    total: 1320000,
  },
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
  const goods = unitPrice > 0 ? unitPrice * quantity : base.amounts.goods;
  const shipping =
    conditions.shippingFee !== undefined ? toNumber(conditions.shippingFee) : base.amounts.shipping;
  const fee = conditions.handlingFee !== undefined ? toNumber(conditions.handlingFee) : base.amounts.fee;
  const total = goods + shipping + fee;

  const productNameCandidate = (payload as { productName?: unknown }).productName;
  const buyerCompanyCandidate =
    (payload as { buyerCompanyName?: unknown }).buyerCompanyName ?? dto.buyerUser?.companyName;

  const productName =
    typeof productNameCandidate === "string" && productNameCandidate.trim()
      ? productNameCandidate
      : base.title;
  const partnerName =
    typeof buyerCompanyCandidate === "string" && buyerCompanyCandidate.trim()
      ? buyerCompanyCandidate
      : base.partnerName;

  return {
    ...base,
    tradeId,
    title: productName,
    partnerName,
    amounts: { goods, shipping, fee, total },
  };
};

const formatCurrency = (value: number) => `¥${value.toLocaleString("ja-JP")}`;

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

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">取引詳細</h1>
        <p className="text-sm text-neutral-800">
          この画面では取引の内容を確認できます。※ダミーデータです
        </p>
      </header>

      <section className="space-y-2 rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold">基本情報</h2>
        <div className="text-sm text-neutral-800 space-y-1">
          <p>取引ID：{view.tradeId}</p>
          <p>案件名：{view.title}</p>
          <p>相手先：{view.partnerName}</p>
        </div>
      </section>

      <section className="space-y-2 rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold">ステータス</h2>
        <StatusBadge statusKey={view.statusKey} />
      </section>

      <section className="space-y-2 rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold">金額サマリー</h2>
        <div className="space-y-1 text-sm text-neutral-800">
          <p>商品代金：{formatCurrency(view.amounts.goods)}</p>
          <p>送料：{formatCurrency(view.amounts.shipping)}</p>
          <p>手数料：{formatCurrency(view.amounts.fee)}</p>
          <p className="font-semibold text-slate-800">税込合計：{formatCurrency(view.amounts.total)}</p>
        </div>
      </section>
    </div>
  );
}
