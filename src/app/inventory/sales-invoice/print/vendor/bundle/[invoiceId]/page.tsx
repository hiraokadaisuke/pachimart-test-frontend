"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { PrintScaffold } from "../../_components/PrintScaffold";
import { useSalesInvoicePrintData } from "../../_components/useSalesInvoicePrintData";
import { renderVendorSheet } from "@/app/inventory/sales-invoice/_components/SalesInvoiceDetailView";
import { findBuyerById } from "@/lib/demo-data/buyers";

const titles = ["売却証明書（兼 請求書）", "請求書", "発送依頼書"] as const;

export default function BundlePrintPage() {
  const params = useParams<{ invoiceId: string }>();
  const searchParams = useSearchParams();
  const invoiceId = Array.isArray(params?.invoiceId) ? params?.invoiceId[0] : params?.invoiceId;
  const sellerId = searchParams?.get("sellerId");

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
  } = useSalesInvoicePrintData(invoiceId ?? "");

  return (
    <PrintScaffold>
      <div className="space-y-12">
        {titles.map((title, index) => (
          <div
            key={title}
            style={index < titles.length - 1 ? { pageBreakAfter: "always" } : undefined}
          >
            <div className="mb-4 text-center text-lg font-semibold">{title}</div>
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
            })}
            <div className="mb-4 mt-6 min-h-[120px] border border-black p-3 text-[13px]">
              <div className="mb-2 text-sm font-semibold text-neutral-900">備考</div>
              <div className="whitespace-pre-wrap text-neutral-800">{invoice.remarks || "―"}</div>
            </div>
          </div>
        ))}
      </div>
    </PrintScaffold>
  );
}
