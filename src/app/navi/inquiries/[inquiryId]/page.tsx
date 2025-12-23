"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TradeNaviType } from "@prisma/client";

import MyPageLayout from "@/components/layout/MyPageLayout";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { fetchTradeNaviById } from "@/lib/trade/api";
import { findDevUserById } from "@/lib/dev-user/users";

type InquiryView = {
  id: string;
  productName: string;
  makerName?: string | null;
  quantity: number;
  unitPrice: number;
  shippingAddress?: string;
  contactPerson?: string;
  desiredShipDate?: string;
  desiredPaymentDate?: string;
  memo?: string | null;
  sellerUserId: string;
  buyerUserId: string;
  sellerCompanyName: string;
  buyerCompanyName: string;
};

const formatYen = (value: number) =>
  new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(value);

export default function InquiryDetailPage() {
  const params = useParams<{ inquiryId?: string }>();
  const inquiryId = Array.isArray(params?.inquiryId) ? params?.inquiryId[0] : params?.inquiryId ?? "";
  const currentUser = useCurrentDevUser();
  const router = useRouter();
  const [record, setRecord] = useState<InquiryView | null>(null);

  useEffect(() => {
    const loadInquiry = async () => {
      try {
        const dto = await fetchTradeNaviById(inquiryId);
        if (!dto || dto.naviType !== TradeNaviType.ONLINE_INQUIRY) {
          setRecord(null);
          return;
        }

        const payload = (dto.payload ?? {}) as Record<string, unknown>;
        const conditions = (payload.conditions as Record<string, unknown> | undefined) ?? {};
        const listing = (dto.listingSnapshot as Record<string, unknown> | null) ?? null;

        const resolveCompanyName = (userId: string | null | undefined) =>
          findDevUserById(userId ?? "")?.companyName ?? userId ?? "-";

        const quantity =
          typeof conditions.quantity === "number"
            ? conditions.quantity
            : typeof listing?.quantity === "number"
              ? listing.quantity
              : 1;
        const unitPrice =
          typeof conditions.unitPrice === "number"
            ? conditions.unitPrice
            : typeof listing?.unitPriceExclTax === "number"
              ? listing.unitPriceExclTax
              : 0;

        const view: InquiryView = {
          id: String(dto.id),
          productName:
            (typeof conditions.productName === "string" && conditions.productName) ||
            (typeof listing?.machineName === "string" ? listing.machineName : "商品"),
          makerName:
            (typeof conditions.makerName === "string" && conditions.makerName) ||
            (typeof listing?.maker === "string" ? listing.maker : null),
          quantity,
          unitPrice,
          shippingAddress:
            (typeof payload.buyerAddress === "string" && payload.buyerAddress) ||
            (typeof listing?.storageLocation === "string" ? listing.storageLocation : undefined),
          contactPerson:
            (typeof payload.buyerContactName === "string" && payload.buyerContactName) ||
            (typeof conditions.handler === "string" ? conditions.handler : undefined),
          desiredShipDate:
            (typeof conditions.machineShipmentDate === "string" && conditions.machineShipmentDate) ||
            (typeof payload.desiredShipDate === "string" ? payload.desiredShipDate : undefined),
          desiredPaymentDate:
            (typeof payload.desiredPaymentDate === "string" && payload.desiredPaymentDate) ||
            (typeof conditions.paymentDue === "string" ? conditions.paymentDue : undefined),
          memo:
            (typeof conditions.memo === "string" && conditions.memo) ||
            (typeof payload.buyerMemo === "string" ? payload.buyerMemo : undefined),
          sellerUserId: dto.ownerUserId,
          buyerUserId: dto.buyerUserId ?? "",
          sellerCompanyName: resolveCompanyName(dto.ownerUserId),
          buyerCompanyName: resolveCompanyName(dto.buyerUserId),
        };

        setRecord(view);
      } catch (error) {
        console.error("Failed to load inquiry", error);
        setRecord(null);
      }
    };

    if (inquiryId) {
      loadInquiry();
    }
  }, [inquiryId]);

  const isBuyer = record ? record.buyerUserId === currentUser.id : false;
  const pageTitle = isBuyer ? "送った問い合わせ確認" : "届いた問い合わせ確認";
  const roleLabel = isBuyer ? "買手" : "売手";

  const handlePrint = () => window.print();
  const handleBack = () => router.back();

  if (!record) {
    return (
      <MyPageLayout>
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">問い合わせが見つかりませんでした。</div>
      </MyPageLayout>
    );
  }

  return (
    <MyPageLayout>
      <div className="space-y-6">
        <div className="print-hidden space-y-4">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-600">{roleLabel}</p>
              <h1 className="text-xl font-bold text-slate-900">{pageTitle}</h1>
              <p className="text-sm text-neutral-800">ナビ作成と同じ見出し順で問い合わせ内容を確認できます。</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-slate-50"
              >
                明細書としてPDF保存/印刷
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-slate-50"
              >
                戻る
              </button>
            </div>
          </div>

          <InquirySummary record={record} />
        </div>

        <div className="print-only">
          <InquirySummary record={record} />
        </div>
      </div>
    </MyPageLayout>
  );
}

function InquirySummary({ record }: { record: InquiryView }) {
  const totalAmount = useMemo(() => record.unitPrice * record.quantity, [record.quantity, record.unitPrice]);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-2">
            <h2 className="text-base font-semibold text-slate-900">取引先情報</h2>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-700">
              <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-800">買手</span>
              <span className="text-sm text-neutral-900">{record.buyerCompanyName ?? "自社"}</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-800">売手</span>
              <span className="text-sm text-neutral-900">{record.sellerCompanyName ?? "-"}</span>
            </div>
          </div>
          <div className="space-y-3 px-4 py-3 text-sm text-neutral-900">
            <div className="grid gap-3 md:grid-cols-2">
              <InfoItem label="メーカー" value={record.makerName ?? "-"} emphasis />
              <InfoItem label="機種名" value={record.productName} />
              <InfoItem label="台数" value={`${record.quantity}台`} />
              <InfoItem label="単価" value={formatYen(record.unitPrice)} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-neutral-600">発送先住所</p>
              <p className="whitespace-pre-line text-neutral-900">{record.shippingAddress || "-"}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <InfoItem label="担当者" value={record.contactPerson || "-"} />
              <InfoItem label="支払予定日" value={record.desiredPaymentDate || "-"} />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
            <h2 className="text-base font-semibold text-slate-900">物件情報</h2>
            <span className="text-xs font-semibold text-neutral-700">問い合わせ対象</span>
          </div>
          <div className="grid gap-3 px-4 py-3 text-sm text-neutral-900 md:grid-cols-2">
            <InfoItem label="合計金額" value={formatYen(totalAmount)} />
            <InfoItem label="発送指定日" value={record.desiredShipDate || "-"} />
            <InfoItem label="問い合わせ先" value={record.sellerCompanyName ?? "-"} />
            <InfoItem label="買主" value={record.buyerCompanyName ?? "-"} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
            <h2 className="text-base font-semibold text-slate-900">取引条件</h2>
            <span className="text-xs font-semibold text-neutral-600">ナビ作成の順序</span>
          </div>
          <div className="overflow-x-auto px-2 py-3">
            <table className="min-w-full border border-slate-300 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-neutral-700">
                  <th className="w-40 px-3 py-1.5">項目</th>
                  <th className="px-3 py-1.5">内容</th>
                </tr>
              </thead>
              <tbody className="text-neutral-900">
                <ConditionRow label="単価" value={formatYen(record.unitPrice)} />
                <ConditionRow label="台数" value={`${record.quantity}台`} />
                <ConditionRow label="撤去日" value="-" />
                <ConditionRow label="機械発送日" value={record.desiredShipDate || "-"} />
                <ConditionRow label="書類発送予定日" value="-" />
                <ConditionRow label="支払日" value={record.desiredPaymentDate || "-"} />
                <ConditionRow label="機械運賃" value="-" />
                <ConditionRow label="出庫手数料" value="-" />
                <ConditionRow label="段ボール" value="-" />
                <ConditionRow label="釘シート" value="-" />
                <ConditionRow label="保険" value="-" />
                <ConditionRow label="特記事項" value="-" />
                <ConditionRow label="取引条件（テキスト）" value="-" />
                <ConditionRow label="備考" value={record.memo ?? "-"} />
                <ConditionRow label="担当者" value={record.contactPerson || "-"} />
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="space-y-4">
        <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-neutral-500">合計（参考）</p>
          <p className="text-lg font-bold text-indigo-700">{formatYen(totalAmount)}</p>
          <p className="mt-1 text-sm text-neutral-800">問い合わせの金額は参考値です。ナビ確定後に金額内訳を計算します。</p>
        </section>
      </div>
    </div>
  );
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
