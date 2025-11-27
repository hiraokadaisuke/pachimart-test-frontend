"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import MainContainer from "@/components/layout/MainContainer";
import { products } from "@/lib/dummyData";
import { calculateQuote } from "@/lib/quotes/calculateQuote";
import { loadNavi, updateNaviStatus } from "@/lib/navi/storage";
import { type TradeNaviDraft } from "@/lib/navi/types";

const statusChipStyles: Record<TradeNaviDraft["status"], { label: string; className: string }> = {
  draft: { label: "下書き", className: "bg-slate-100 text-slate-700" },
  sent_to_buyer: { label: "承認待ち", className: "bg-amber-100 text-amber-800" },
  buyer_approved: { label: "承認済み", className: "bg-emerald-100 text-emerald-800" },
  buyer_rejected: { label: "差戻し", className: "bg-rose-100 text-rose-800" },
};

const formatCurrency = (value: number) => `¥${value.toLocaleString("ja-JP")}`;

export default function TransactionNaviConfirmPage() {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const naviId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [draft, setDraft] = useState<TradeNaviDraft | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!naviId) {
      setDraft(null);
      setHasLoaded(true);
      return;
    }

    const storedDraft = loadNavi(naviId);
    setDraft(storedDraft);
    setHasLoaded(true);
  }, [naviId]);

  const quote = useMemo(() => {
    if (!draft) return null;
    return calculateQuote({
      unitPrice: draft.conditions.unitPrice,
      quantity: draft.conditions.quantity,
      shippingFee: draft.conditions.shippingFee ?? 0,
      handlingFee: draft.conditions.handlingFee ?? 0,
      taxRate: draft.conditions.taxRate ?? 0,
    });
  }, [draft]);

  const productInfo = useMemo(() => {
    if (!draft) return null;
    if (draft.productId) {
      const product = products.find((item) => String(item.id) === String(draft.productId));
      return {
        hasProduct: true,
        modelName: product?.name ?? "選択された商品",
        maker: product?.maker ?? "-",
        quantity: draft.conditions.quantity,
        location: product?.warehouseName ?? draft.conditions.location ?? "-",
      };
    }

    return {
      hasProduct: false,
      modelName: draft.conditions.productName ?? "未設定",
      maker: draft.conditions.makerName ?? "未設定",
      quantity: draft.conditions.quantity,
      location: draft.conditions.location ?? "",
    };
  }, [draft]);

  const isActionDisabled = draft?.status === "buyer_approved" || draft?.status === "buyer_rejected";

  const handleApprove = () => {
    if (!draft) return;
    const nextDraft = updateNaviStatus(draft.id, "buyer_approved");
    if (nextDraft) {
      setDraft(nextDraft);
      alert("この条件で承認しました。");
      router.push("/trade-navi?tab=progress");
    }
  };

  const handleReject = () => {
    if (!draft) return;
    const nextDraft = updateNaviStatus(draft.id, "buyer_rejected");
    if (nextDraft) {
      setDraft(nextDraft);
      alert("修正依頼を送信しました。");
      router.push("/trade-navi");
    }
  };

  if (hasLoaded && !draft) {
    return (
      <MainContainer>
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">指定された取引Naviが見つかりません。</h1>
          <div className="text-sm text-slate-600">IDをご確認のうえ、一覧ページから再度お試しください。</div>
          <div className="flex justify-center">
            <Link
              href="/trade-navi"
              className="rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
            >
              取引Navi一覧に戻る
            </Link>
          </div>
        </div>
      </MainContainer>
    );
  }

  if (!draft || !productInfo || !quote) return null;

  const statusChip = statusChipStyles[draft.status];

  return (
    <MainContainer variant="wide">
      <div className="flex flex-col gap-8 pb-10">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Buyer確認</p>
            <h1 className="text-2xl font-bold text-slate-900">取引Naviの確認</h1>
            <p className="mt-1 text-sm text-slate-600">条件を確認し、承認または修正依頼を選択してください。</p>
          </div>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusChip.className}`}>
            {statusChip.label}
          </span>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">物件情報</h2>
                <span className="text-xs font-semibold text-slate-500">概要</span>
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoRow label="機種名" value={productInfo.modelName} />
                <InfoRow label="メーカー" value={productInfo.maker} />
                <InfoRow label="台数" value={`${productInfo.quantity} 台`} />
                <InfoRow label="保管場所" value={productInfo.location || "-"} />
              </dl>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">取引条件</h2>
                <span className="text-xs font-semibold text-slate-500">読み取り専用</span>
              </div>
              <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoRow label="単価（税抜）" value={formatCurrency(draft.conditions.unitPrice)} />
                <InfoRow label="台数" value={`${draft.conditions.quantity} 台`} />
                <InfoRow label="商品代金小計" value={formatCurrency(quote.productSubtotal)} />
                <InfoRow label="送料" value={formatCurrency(draft.conditions.shippingFee ?? 0)} />
                <InfoRow label="出庫手数料" value={formatCurrency(draft.conditions.handlingFee ?? 0)} />
                <InfoRow label="税率" value={`${Math.round((draft.conditions.taxRate ?? 0) * 100)}%`} />
                <InfoRow label="撤去日" value={draft.conditions.removalDate ?? "-"} />
                <InfoRow label="機械発送予定日" value={draft.conditions.machineShipmentDate ?? "-"} />
                <InfoRow label="発送方法" value={draft.conditions.machineShipmentType ?? "-"} />
                <InfoRow label="書類発送予定日" value={draft.conditions.documentShipmentDate ?? "-"} />
                <InfoRow label="書類発送方法" value={draft.conditions.documentShipmentType ?? "-"} />
                <InfoRow label="支払期日" value={draft.conditions.paymentDue ?? "-"} />
                <InfoRow
                  label={draft.conditions.otherFee1?.label ?? "その他料金1"}
                  value={
                    draft.conditions.otherFee1?.amount !== undefined
                      ? formatCurrency(draft.conditions.otherFee1.amount)
                      : "-"
                  }
                />
                <InfoRow
                  label={draft.conditions.otherFee2?.label ?? "その他料金2"}
                  value={
                    draft.conditions.otherFee2?.amount !== undefined
                      ? formatCurrency(draft.conditions.otherFee2.amount)
                      : "-"
                  }
                />
                <InfoRow label="特記事項" value={draft.conditions.notes || "-"} fullWidth />
                <InfoRow label="取引条件" value={draft.conditions.terms || "-"} fullWidth />
              </dl>
            </section>
          </div>

          <div className="space-y-4 lg:col-span-1">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">お支払い金額</h2>
                <span className="text-xs font-semibold text-slate-500">再計算</span>
              </div>
              <div className="space-y-3 text-sm text-slate-800">
                <SummaryRow label="商品代金小計" value={formatCurrency(quote.productSubtotal)} />
                <SummaryRow label="送料" value={formatCurrency(quote.shippingFee)} />
                <SummaryRow label="出庫手数料" value={formatCurrency(quote.handlingFee)} />
                <div className="h-px bg-slate-200" aria-hidden />
                <SummaryRow label="小計" value={formatCurrency(quote.subtotal)} />
                <SummaryRow label="税額" value={formatCurrency(quote.tax)} />
                <div className="flex items-center justify-between rounded bg-slate-50 px-3 py-2 text-base font-semibold text-slate-900">
                  <span>合計（税込）</span>
                  <span className="text-xl text-emerald-700">{formatCurrency(quote.total)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-700">内容を確認のうえ、承認または修正依頼を選択してください。</p>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isActionDisabled}
                  className="rounded bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  この条件で承認する
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isActionDisabled}
                  className="rounded border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white"
                >
                  修正を依頼する
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </MainContainer>
  );
}

function InfoRow({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={`flex flex-col rounded border border-slate-100 bg-slate-50 p-3 ${fullWidth ? "md:col-span-2" : ""}`}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-800">{value}</dd>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
