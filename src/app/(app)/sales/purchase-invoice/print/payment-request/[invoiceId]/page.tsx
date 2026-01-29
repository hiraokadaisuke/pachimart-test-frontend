"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { PrintScaffold } from "../../_components/PrintScaffold";
import { usePurchaseInvoicePrintData } from "../../_components/usePurchaseInvoicePrintData";
import { findBuyerById } from "@/lib/demo-data/buyers";

const cellClass = "border border-black px-2 py-2";

export default function PaymentRequestPrintPage() {
  const params = useParams<{ invoiceId: string }>();
  const searchParams = useSearchParams();
  const invoiceId = Array.isArray(params?.invoiceId) ? params?.invoiceId[0] : params?.invoiceId;
  const buyerId = searchParams?.get("buyerId");

  const buyer = useMemo(() => findBuyerById(buyerId), [buyerId]);
  const {
    supplierName,
    branchName,
    staffName,
    paymentDateLabel,
    issuedDateLabel,
    detailRows,
    subtotal,
    tax,
    grandTotal,
  } = usePurchaseInvoicePrintData(invoiceId ?? "");

  return (
    <PrintScaffold>
      <div className="mb-4 text-center text-lg font-semibold">支払依頼書</div>

      <div className="mb-4 flex flex-wrap justify-between gap-4 text-[12px]">
        <div className="space-y-1 text-[13px]">
          <div className="font-semibold">支払先 ⇒ {supplierName} 様</div>
          {branchName && <div className="text-[12px] text-neutral-800">{branchName}</div>}
        </div>
        <div className="space-y-1 text-right text-[12px] font-semibold">
          <div>{issuedDateLabel}</div>
          <div>営業担当　{staffName}</div>
        </div>
      </div>

      <div className="mb-6">
        <table className="w-full table-fixed border border-black text-center text-[12px]">
          <thead className="bg-slate-100 text-sm font-semibold">
            <tr>
              <th className={cellClass}>合計金額</th>
              <th className={cellClass}>支払日</th>
              <th className={cellClass}>確認印</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-base font-semibold">
              <td className={`${cellClass} text-lg`}>{grandTotal.toLocaleString("ja-JP")}<span className="ml-1 text-xs">円</span></td>
              <td className={`${cellClass} text-sm`}>{paymentDateLabel}</td>
              <td className={cellClass}>
                <div className="mx-auto h-12 w-20 border border-black" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-6">
        <table className="w-full table-fixed border border-black text-[11px]">
          <thead className="bg-slate-100 text-center font-semibold">
            <tr>
              <th className={cellClass}>撤去日</th>
              <th className={cellClass}>店舗名</th>
              <th className={cellClass}>メーカー名</th>
              <th className={cellClass}>商品名</th>
              <th className={cellClass}>タイプ</th>
              <th className={`${cellClass} text-right`}>数量</th>
              <th className={`${cellClass} text-right`}>単価</th>
              <th className={`${cellClass} text-right`}>金額</th>
              <th className={`${cellClass} text-right`}>残債</th>
              <th className={cellClass}>商品補足</th>
            </tr>
          </thead>
          <tbody>
            {detailRows.map((row, index) => (
              <tr key={`row-${index}`} className="align-middle text-center">
                <td className={cellClass}>{row.removalDate}</td>
                <td className={`${cellClass} text-left`}>{row.storeName}</td>
                <td className={`${cellClass} text-left`}>{row.maker}</td>
                <td className={`${cellClass} text-left font-semibold`}>{row.machineName}</td>
                <td className={`${cellClass} text-left`}>{row.type}</td>
                <td className={`${cellClass} text-right`}>{row.quantity}</td>
                <td className={`${cellClass} text-right`}>{row.unitPrice}</td>
                <td className={`${cellClass} text-right font-semibold`}>{row.amount}</td>
                <td className={`${cellClass} text-right`}>{row.remainingDebt}</td>
                <td className={`${cellClass} text-left`}>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 text-[11px] md:grid-cols-3">
        <div className="border border-black p-2">小計</div>
        <div className="col-span-2 border border-black px-3 py-2 text-right font-semibold">{subtotal.toLocaleString("ja-JP")}</div>
        <div className="border border-black p-2">消費税（10%）</div>
        <div className="col-span-2 border border-black px-3 py-2 text-right font-semibold">{tax.toLocaleString("ja-JP")}</div>
        <div className="border border-black p-2">合計金額</div>
        <div className="col-span-2 border border-black px-3 py-2 text-right font-semibold">{grandTotal.toLocaleString("ja-JP")}</div>
      </div>

      <div className="grid grid-cols-1 gap-4 text-[11px] md:grid-cols-2">
        <div className="border border-black p-3">
          <div className="border-b border-black pb-2 text-sm font-semibold">売主様控印欄</div>
          <div className="mt-2 space-y-1 leading-relaxed">
            <div>{supplierName}</div>
            {branchName && <div>{branchName}</div>}
            <div className="mt-4 h-16 w-full border border-black" aria-hidden />
          </div>
        </div>
        <div className="border border-black p-3">
          <div className="border-b border-black pb-2 text-sm font-semibold">振込先口座</div>
          <div className="mt-2 h-24 border border-black" aria-hidden />
          <div className="mt-2 text-[11px]">必要に応じてご記入ください。</div>
        </div>
      </div>

      <div className="mt-8 border border-black p-3 text-[11px]">
        <div className="text-sm font-semibold">支払先情報</div>
        <div className="mt-2 space-y-0.5 leading-relaxed">
          <div>{buyer.postalCode}</div>
          <div>{buyer.address}</div>
          <div>{buyer.corporate}</div>
          <div>{buyer.representative}</div>
          <div>{buyer.tel}</div>
          <div>{buyer.fax}</div>
        </div>
      </div>
    </PrintScaffold>
  );
}
