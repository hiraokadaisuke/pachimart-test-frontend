"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { PrintScaffold } from "../../_components/PrintScaffold";
import { PurchaseContractInvoiceSheet } from "../../_components/PurchaseContractInvoiceSheet";
import { usePurchaseInvoicePrintData } from "../../_components/usePurchaseInvoicePrintData";
import { findBuyerById } from "@/lib/demo-data/buyers";

const COPY_OPTIONS = ["both", "seller", "buyer"] as const;
type CopyOption = (typeof COPY_OPTIONS)[number];

const resolveCopyOption = (value?: string | null): CopyOption | null => {
  if (!value) return null;
  return COPY_OPTIONS.includes(value as CopyOption) ? (value as CopyOption) : null;
};

const resolveTitle = (_copy: CopyOption | null) => "売買契約書";

export default function SalesContractPrintPage() {
  const params = useParams<{ invoiceId: string }>();
  const searchParams = useSearchParams();
  const invoiceId = Array.isArray(params?.invoiceId) ? params?.invoiceId[0] : params?.invoiceId;
  const buyerId = searchParams?.get("buyerId");
  const copyParam = searchParams?.get("copy");
  const copyOption = resolveCopyOption(copyParam);

  const buyer = useMemo(() => findBuyerById(buyerId), [buyerId]);
  const {
    sellerInvoiceNumber,
    buyerInvoiceNumber,
    staffName,
    recipientLine,
    paymentDateLabel,
    issuedDateLabel,
    detailRows,
    subtotal,
    tax,
    grandTotal,
  } = usePurchaseInvoicePrintData(invoiceId ?? "");

  const copyTargets: Array<CopyOption | null> = copyOption === "both" ? ["seller", "buyer"] : [copyOption];
  const pdfCopyLabel = copyOption ?? "single";
  const pdfFileName = invoiceId ? `sales-contract_${invoiceId}_${pdfCopyLabel}.pdf` : `sales-contract_${pdfCopyLabel}.pdf`;
  const totalPages = copyTargets.length;

  return (
    <PrintScaffold pdfFileName={pdfFileName}>
      {copyTargets.map((copy, index) => {
        const copyLabel = copy === "seller" ? "売主控え" : copy === "buyer" ? "買主控え" : "控え";
        return (
          <div key={`${copy ?? "single"}-${index}`}>
            {index > 0 && (
              <>
                <div className="print-hidden my-8 flex items-center gap-4 text-xs text-slate-500">
                  <div className="h-px flex-1 bg-slate-300" />
                  <span>ページ区切り</span>
                  <div className="h-px flex-1 bg-slate-300" />
                </div>
                <div className="print-page-break" aria-hidden="true" />
              </>
            )}
            {totalPages > 1 && (
              <div className="mb-2 text-center text-xs font-semibold text-neutral-600">
                {index + 1}枚目：{copyLabel}
              </div>
            )}
            <PurchaseContractInvoiceSheet
              title={resolveTitle(copy)}
              issuedDateLabel={issuedDateLabel}
              recipientLine={recipientLine}
              sellerInvoiceNumber={sellerInvoiceNumber}
              buyerInvoiceNumber={buyerInvoiceNumber}
              buyer={buyer}
              staffName={staffName}
              paymentDateLabel={paymentDateLabel}
              detailRows={detailRows}
              subtotal={subtotal}
              tax={tax}
              grandTotal={grandTotal}
              copyLabel={copyLabel}
            />
          </div>
        );
      })}
    </PrintScaffold>
  );
}
