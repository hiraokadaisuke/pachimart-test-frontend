"use client";

import { useParams, useSearchParams } from "next/navigation";

import { PrintScaffold } from "../../../_components/PrintScaffold";
import { useSalesInvoicePrintData } from "../../../_components/useSalesInvoicePrintData";
import { renderSalesContractInvoiceSheet } from "@/app/(app)/sales/sales-invoice/_components/SalesInvoiceDetailView";
import { findBuyerById } from "@/lib/demo-data/buyers";

export default function InvoicePrintPage() {
  const params = useParams<{ invoiceId: string }>();
  const searchParams = useSearchParams();
  const invoiceId = Array.isArray(params?.invoiceId) ? params?.invoiceId[0] : params?.invoiceId;
  const sellerId = searchParams?.get("sellerId");

  const seller = findBuyerById(sellerId);
  const {
    recipientName,
    staffName,
    rawItems,
    subtotal,
    tax,
    grandTotal,
    issuedDateLabel,
    paymentDueDateLabel,
    sellerInvoiceNumber,
    buyerInvoiceNumber,
  } = useSalesInvoicePrintData(invoiceId ?? "");

  return (
    <PrintScaffold>
      {renderSalesContractInvoiceSheet({
        title: "請求書",
        recipientName,
        staffName,
        items: rawItems,
        subtotal,
        tax,
        grandTotal,
        issuedDateLabel,
        paymentDueDateLabel,
        sellerInfo: seller,
        sellerInvoiceNumber,
        buyerInvoiceNumber,
      })}
    </PrintScaffold>
  );
}
