"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import MyPageLayout from "@/components/layout/MyPageLayout";
import { NaviSectionRow, NaviSectionTable } from "@/components/navi/NaviSectionTable";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { fetchOnlineInquiryDetail, type OnlineInquiryDetail } from "@/lib/online-inquiries/api";

type InquiryView = OnlineInquiryDetail;

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
        const dto = await fetchOnlineInquiryDetail(inquiryId);
        if (!dto) {
          setRecord(null);
          return;
        }

        setRecord(dto);
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
        <section className="rounded-lg border border-slate-400 bg-white text-sm shadow-sm">
          <div className="flex flex-col gap-1 border-b border-slate-300 bg-slate-50 px-4 py-2">
            <h2 className="text-base font-semibold text-slate-900">取引先情報</h2>
          </div>
          <div className="overflow-x-auto px-4 py-3 text-sm text-neutral-900">
            <NaviSectionTable>
              <tbody className="text-slate-900">
                <NaviSectionRow
                  label="会社名"
                  value={
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-800">買手</span>
                      <span className="text-sm text-neutral-900">{record.buyerCompanyName ?? "自社"}</span>
                    </div>
                  }
                />
                <NaviSectionRow label="担当者" value={record.contactPerson || "-"} />
                <NaviSectionRow label="発送先住所" value={record.shippingAddress || "-"} />
                <NaviSectionRow
                  label="会社名"
                  value={
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-800">売手</span>
                      <span className="text-sm text-neutral-900">{record.sellerCompanyName ?? "-"}</span>
                    </div>
                  }
                />
                <NaviSectionRow label="担当者" value="-" />
              </tbody>
            </NaviSectionTable>
          </div>
        </section>

        <section className="rounded-lg border border-slate-400 bg-white text-sm shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-4 py-2">
            <h2 className="text-base font-semibold text-slate-900">物件情報</h2>
            <span className="text-xs font-semibold text-neutral-700">問い合わせ対象</span>
          </div>
          <div className="overflow-x-auto px-4 py-3 text-sm text-neutral-900">
            <NaviSectionTable>
              <tbody className="text-slate-900">
                <NaviSectionRow label="メーカー" value={record.makerName ?? "-"} />
                <NaviSectionRow label="機種名" value={record.productName} />
                <NaviSectionRow label="台数" value={`${record.quantity}台`} />
                <NaviSectionRow label="単価" value={formatYen(record.unitPrice)} />
              </tbody>
            </NaviSectionTable>
          </div>
        </section>

        <section className="rounded-lg border border-slate-400 bg-white text-sm shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-4 py-2">
            <h2 className="text-base font-semibold text-slate-900">取引条件</h2>
            <span className="text-xs font-semibold text-neutral-600">ナビ作成の順序</span>
          </div>
          <div className="overflow-x-auto px-2 py-3">
            <NaviSectionTable>
              <tbody className="text-neutral-900">
                <NaviSectionRow label="単価" value={formatYen(record.unitPrice)} />
                <NaviSectionRow label="台数" value={`${record.quantity}台`} />
                <NaviSectionRow label="撤去日" value="-" />
                <NaviSectionRow label="機械発送日" value={record.desiredShipDate || "-"} />
                <NaviSectionRow label="書類発送予定日" value="-" />
                <NaviSectionRow label="支払日" value={record.desiredPaymentDate || "-"} />
                <NaviSectionRow label="機械運賃" value="-" />
                <NaviSectionRow label="出庫手数料" value="-" />
                <NaviSectionRow label="段ボール" value="-" />
                <NaviSectionRow label="釘シート" value="-" />
                <NaviSectionRow label="保険" value="-" />
                <NaviSectionRow label="特記事項" value="-" />
                <NaviSectionRow label="取引条件（テキスト）" value="-" />
                <NaviSectionRow label="備考" value={record.memo ?? "-"} />
                <NaviSectionRow label="担当者" value={record.contactPerson || "-"} />
              </tbody>
            </NaviSectionTable>
          </div>
        </section>
      </div>

      <div className="space-y-4">
        <section className="rounded-lg border border-slate-400 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-neutral-500">合計（参考）</p>
          <p className="text-lg font-bold text-indigo-700">{formatYen(totalAmount)}</p>
          <p className="mt-1 text-sm text-neutral-800">問い合わせの金額は参考値です。ナビ確定後に金額内訳を計算します。</p>
        </section>
      </div>
    </div>
  );
}
