"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { PrintScaffold } from "../../_components/PrintScaffold";
import { usePurchaseInvoicePrintData } from "../../_components/usePurchaseInvoicePrintData";
import { findBuyerById } from "@/lib/demo-data/buyers";

const cellClass = "border border-black px-2 py-2";

export default function InspectionPickupPrintPage() {
  const params = useParams<{ invoiceId: string }>();
  const searchParams = useSearchParams();
  const invoiceId = Array.isArray(params?.invoiceId) ? params?.invoiceId[0] : params?.invoiceId;
  const buyerId = searchParams?.get("buyerId");

  const buyer = useMemo(() => findBuyerById(buyerId), [buyerId]);
  const {
    supplierName,
    branchName,
    staffName,
    recipientLine,
    warehousingDateLabel,
    issuedDateLabel,
    detailRows,
  } = usePurchaseInvoicePrintData(invoiceId ?? "");

  return (
    <PrintScaffold>
      <div className="mb-4 text-center text-lg font-semibold">入庫検品依頼書　兼　引取依頼書</div>

      <div className="mb-4 flex flex-wrap justify-between gap-4 text-[12px]">
        <div className="space-y-1 text-[13px]">
          <div className="font-semibold">購入先 ⇒ {supplierName} 様</div>
          {branchName && <div className="text-[12px] text-neutral-800">{branchName}</div>}
        </div>
        <div className="min-w-[240px] text-right text-[12px]">
          <div className="text-sm font-semibold">{issuedDateLabel}</div>
          <div className="mt-2 inline-block border border-black px-3 py-2 text-left text-[11px] font-semibold leading-relaxed">
            <div>{buyer.postalCode}</div>
            <div>{buyer.address}</div>
            <div>{buyer.corporate}</div>
            <div>{buyer.representative}</div>
            <div>{buyer.tel}</div>
            <div>{buyer.fax}</div>
            <div className="mt-1">担当　{staffName}</div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-12 gap-4 text-[12px]">
        <div className="col-span-5 border border-black p-3">
          <div className="text-sm font-semibold">入庫日</div>
          <div className="mt-2 h-10 border border-black px-3 py-2 text-base font-semibold">{warehousingDateLabel}</div>
        </div>
        <div className="col-span-7 border border-black p-3 text-[11px]">
          <div className="text-sm font-semibold">購入先</div>
          <div className="mt-2 space-y-1 leading-relaxed">
            <div>{recipientLine}</div>
            <div>{supplierName}</div>
            {branchName && <div>{branchName}</div>}
          </div>
        </div>
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

      <div className="mt-6 border border-black p-3 text-[11px]">
        <div className="border-b border-black pb-2 text-sm font-semibold">備考</div>
        <div className="mt-2 h-32 border border-black" aria-hidden />
      </div>
    </PrintScaffold>
  );
}
