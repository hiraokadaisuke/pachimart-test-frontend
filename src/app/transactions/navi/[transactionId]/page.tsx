"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import MainContainer from "@/components/layout/MainContainer";
import { calculateQuote, type QuoteResult } from "@/lib/quotes/calculateQuote";
import { loadNaviDraft } from "@/lib/navi/storage";
import { type TradeNaviDraft } from "@/lib/navi/types";
import { formatCurrency, useDummyNavi } from "@/lib/useDummyNavi";

export default function TransactionNaviConfirmPage() {
  const router = useRouter();
  const params = useParams<{ transactionId?: string }>();
  const transactionId = Array.isArray(params?.transactionId)
    ? params?.transactionId[0]
    : params?.transactionId ?? "dummy-1";
  const [draft, setDraft] = useState<TradeNaviDraft | null>(null);

  useEffect(() => {
    if (!transactionId) return;
    const storedDraft = loadNaviDraft(transactionId);
    if (storedDraft) {
      setDraft(storedDraft);
    }
  }, [transactionId]);

  const naviTargetId = draft?.productId ?? transactionId;
  const { confirmBreadcrumbItems, buyerInfo, propertyInfo, statusLabel, currentConditions } =
    useDummyNavi(naviTargetId);

  const quoteResult = useMemo<QuoteResult | null>(() => {
    if (!draft) return null;
    const quoteInput = {
      unitPrice: draft.conditions.unitPrice,
      quantity: draft.conditions.quantity,
      shippingFee: draft.conditions.shippingFee ?? 0,
      handlingFee: draft.conditions.handlingFee ?? 0,
      taxRate: draft.conditions.taxRate ?? 0.1,
    } satisfies Parameters<typeof calculateQuote>[0];

    return calculateQuote(quoteInput);
  }, [draft]);

  const displayConditions = useMemo(() => {
    if (!draft) return null;
    const { conditions } = draft;

    return {
      price: conditions.unitPrice,
      quantity: conditions.quantity,
      removalDate: currentConditions.removalDate,
      machineShipmentDate: currentConditions.machineShipmentDate,
      machineShipmentType: currentConditions.machineShipmentType,
      documentShipmentDate: currentConditions.documentShipmentDate,
      documentShipmentType: currentConditions.documentShipmentType,
      paymentDue: currentConditions.paymentDue,
      freightCost: conditions.shippingFee ?? currentConditions.freightCost,
      otherFee1Label: "出庫手数料",
      otherFee1Amount: conditions.handlingFee ?? 0,
      otherFee2Label: "税率",
      otherFee2Amount: conditions.taxRate,
      notes: currentConditions.notes,
      terms: currentConditions.terms,
    };
  }, [currentConditions, draft]);

  const handleApprove = () => {
    alert("この条件で取引を承認しました（ダミー）");
    router.push("/mypage/transactions?tab=pending");
  };

  const handleRequestChanges = () => {
    alert("修正依頼を送信しました（ダミー）");
    console.log("request changes", draft);
    router.push(`/transactions/navi/${transactionId}/edit`);
  };

  if (!draft || !displayConditions || !quoteResult) {
    return (
      <MainContainer>
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">取引Naviが見つかりません</h1>
          <p className="text-sm text-slate-600">
            もう一度ページを読み込み直すか、マイページから取引を選択してください。
          </p>
          <div className="flex justify-center gap-3 text-sm font-semibold">
            <Link
              href="/mypage"
              className="rounded border border-slate-300 px-4 py-2 text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              マイページへ戻る
            </Link>
            <Link
              href="/"
              className="rounded bg-sky-600 px-4 py-2 text-white shadow hover:bg-sky-700"
            >
              トップに戻る
            </Link>
          </div>
        </div>
      </MainContainer>
    );
  }

  return (
    <MainContainer variant="wide">
      <div className="flex flex-col gap-8 pb-10">
        <section className="flex flex-col gap-4 border-b border-slate-200 pb-6">
          <nav className="text-xs text-slate-500">
            <ol className="flex flex-wrap items-center gap-2">
              {confirmBreadcrumbItems.map((item, index) => (
                <li key={item} className="flex items-center gap-2">
                  <span>{item}</span>
                  {index < confirmBreadcrumbItems.length - 1 && (
                    <span className="text-slate-400">›</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">取引Naviの確認</h1>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {statusLabel}
              </span>
            </div>
            <div className="text-sm text-slate-600">
              買手が最終条件を確認し、承認または差戻しを選択するページです。
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="grid gap-4 md:grid-cols-2">
              <InfoCard title="買手情報" badge="取引先">
                <InfoRow label="会社名" value={buyerInfo.companyName} emphasis />
                <InfoRow label="担当者" value={buyerInfo.contactPerson} />
                <InfoRow label="電話" value={buyerInfo.phoneNumber} />
                <InfoRow label="メール" value={buyerInfo.email} />
                {buyerInfo.notes && <InfoRow label="備考" value={buyerInfo.notes} muted />}
              </InfoCard>

              <InfoCard title="物件情報" badge="対象機器">
                <InfoRow label="機種名" value={propertyInfo.modelName} emphasis />
                <InfoRow label="メーカー" value={propertyInfo.maker} />
                <InfoRow label="台数" value={`${displayConditions.quantity} 台`} />
                <InfoRow label="台番号" value={propertyInfo.machineNumber ?? "-"} />
                <InfoRow label="保管場所" value={propertyInfo.storageLocation} />
              </InfoCard>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">最終取引条件</h2>
                <span className="text-xs font-semibold text-slate-500">確認用</span>
              </div>
              <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ConditionRow label="金額 (1台あたり)" value={`${formatCurrency(displayConditions.price)} / 税抜`} />
                <ConditionRow label="台数" value={`${displayConditions.quantity} 台`} />
                <ConditionRow label="撤去日" value={displayConditions.removalDate} />
                <ConditionRow
                  label="機械発送予定日"
                  value={`${displayConditions.machineShipmentDate}（${displayConditions.machineShipmentType}）`}
                />
                <ConditionRow
                  label="書類発送予定日"
                  value={`${displayConditions.documentShipmentDate}（${displayConditions.documentShipmentType}）`}
                />
                <ConditionRow label="支払期日" value={displayConditions.paymentDue} />
                <ConditionRow label="機械運賃" value={formatCurrency(displayConditions.freightCost)} />
                <ConditionRow
                  label="出庫手数料"
                  value={`${displayConditions.otherFee1Label}: ${formatCurrency(displayConditions.otherFee1Amount)}`}
                />
                <ConditionRow
                  label="その他料金"
                  value={`${displayConditions.otherFee2Label}: ${formatCurrency(displayConditions.otherFee2Amount)}`}
                />
                <ConditionRow label="特記事項" value={displayConditions.notes} />
                <ConditionRow label="取引条件" value={displayConditions.terms} fullWidth />
              </dl>
            </section>
          </div>

          <div className="space-y-4 lg:col-span-1">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">お支払い金額</h2>
                <span className="text-xs font-semibold text-slate-500">再計算</span>
              </div>
              <div className="space-y-3 text-sm text-slate-800">
                <SummaryRow label="商品代金" value={formatCurrency(quoteResult.productSubtotal)} />
                <SummaryRow label="送料" value={formatCurrency(quoteResult.shippingFee)} />
                <SummaryRow label="出庫手数料" value={formatCurrency(quoteResult.handlingFee)} />
                <div className="h-px bg-slate-200" aria-hidden />
                <SummaryRow label="小計" value={formatCurrency(quoteResult.subtotal)} />
                <SummaryRow label="消費税" value={formatCurrency(quoteResult.tax)} />
                <div className="flex items-center justify-between rounded bg-slate-50 px-3 py-2 text-base font-semibold text-slate-900">
                  <span>合計</span>
                  <span className="text-xl text-emerald-700">{formatCurrency(quoteResult.total)}</span>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-700">
                内容を確認のうえ、承認または差戻しを選択してください。選択後に担当者へ通知されます。
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleApprove}
                  className="rounded bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-700"
                >
                  この条件で承認する
                </button>
                <button
                  type="button"
                  onClick={handleRequestChanges}
                  className="rounded border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                >
                  修正を依頼する（差戻し）
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </MainContainer>
  );
}

function InfoCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <span className="text-xs font-semibold text-slate-500">{badge}</span>
      </div>
      <div className="space-y-2 text-sm text-slate-700">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  emphasis,
  muted,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <span className="w-24 text-slate-500">{label}</span>
      <span className={`${emphasis ? "font-medium text-slate-900" : "text-slate-800"} ${muted ? "text-slate-600" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function ConditionRow({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded border border-slate-100 bg-slate-50 p-3 ${fullWidth ? "md:col-span-2" : ""}`}
    >
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm text-slate-800">{value}</dd>
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
