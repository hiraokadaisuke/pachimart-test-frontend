"use client";

import { useParams } from "next/navigation";

import { PurchaseInvoiceDetailView } from "../../_components/PurchaseInvoiceDetailView";

export default function HallInvoiceDetailPage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = Array.isArray(params?.invoiceId) ? params?.invoiceId[0] : params?.invoiceId;

  if (!invoiceId) {
    return null;
  }

  return (
    <PurchaseInvoiceDetailView
      invoiceId={invoiceId}
      title="購入伝票発行（ホール）"
      expectedType="hall"
    />
  );
}
