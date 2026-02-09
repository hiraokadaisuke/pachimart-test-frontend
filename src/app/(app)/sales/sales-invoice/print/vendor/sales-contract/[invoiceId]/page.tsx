"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { PrintScaffold } from "../../../_components/PrintScaffold";
import { useSalesInvoicePrintData } from "../../../_components/useSalesInvoicePrintData";
import { renderVendorSheet } from "@/app/(app)/sales/sales-invoice/_components/SalesInvoiceDetailView";
import { findBuyerById } from "@/lib/demo-data/buyers";

const COPY_OPTIONS = ["both", "seller", "buyer"] as const;
type CopyOption = (typeof COPY_OPTIONS)[number];

const resolveCopyOption = (value?: string | null): CopyOption | null => {
  if (!value) return null;
  return COPY_OPTIONS.includes(value as CopyOption) ? (value as CopyOption) : null;
};

const resolveTitle = (copy: CopyOption | null) => {
  if (copy === "seller") return "売買契約書（売主控え）";
  if (copy === "buyer") return "売買契約書（買主控え）";
  return "売買契約書";
};

export default function SalesContractPrintPage() {
  const params = useParams<{ invoiceId: string }>();
  const searchParams = useSearchParams();
  const invoiceId = Array.isArray(params?.invoiceId) ? params?.invoiceId[0] : params?.invoiceId;
  const sellerId = searchParams?.get("sellerId");
  const copyParam = searchParams?.get("copy");
  const copyOption = resolveCopyOption(copyParam);

  const seller = useMemo(() => findBuyerById(sellerId), [sellerId]);
  const {
    invoice,
    recipientName,
    staffName,
    manager,
    rawItems,
    subtotal,
    tax,
    shippingInsurance,
    grandTotal,
    issuedDateLabel,
    paymentDueDateLabel,
    invoiceOriginalRequiredLabel,
    sellerInvoiceNumber,
    buyerInvoiceNumber,
  } = useSalesInvoicePrintData(invoiceId ?? "");

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
            <div className="mb-4 text-center text-lg font-semibold">{resolveTitle(copy)}</div>
            {renderVendorSheet({
              recipientName,
              staffName,
              manager,
              items: rawItems,
              subtotal,
              tax,
              shippingInsurance,
              grandTotal,
              issuedDateLabel,
              paymentDueDateLabel,
              invoiceOriginalRequiredLabel,
              sellerInfo: seller,
              sellerInvoiceNumber,
              buyerInvoiceNumber,
            })}
            <div className="mb-4 mt-6 min-h-[120px] border border-black p-3 text-[13px]">
              <div className="mb-2 text-sm font-semibold text-neutral-900">備考</div>
              <div className="whitespace-pre-wrap text-neutral-800">{invoice.remarks || "―"}</div>
            </div>
          </div>
        );
      })}
    </PrintScaffold>
  );
}
