"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { PrintScaffold } from "../../_components/PrintScaffold";
import { PurchaseContractInvoiceSheet } from "../../_components/PurchaseContractInvoiceSheet";
import { usePurchaseInvoicePrintData } from "../../_components/usePurchaseInvoicePrintData";
import { findBuyerById } from "@/lib/demo-data/buyers";

export default function PaymentRequestPrintPage() {
  const params = useParams<{ invoiceId: string }>();
  const searchParams = useSearchParams();
  const invoiceId = Array.isArray(params?.invoiceId) ? params?.invoiceId[0] : params?.invoiceId;
  const buyerId = searchParams?.get("buyerId");

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

  return (
    <PrintScaffold>
      <PurchaseContractInvoiceSheet
        title="請求書"
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
      />
    </PrintScaffold>
  );
}
