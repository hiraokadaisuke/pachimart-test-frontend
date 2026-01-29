"use client";

import { useParams } from "next/navigation";

import SalesInvoiceDetailView from "../../_components/SalesInvoiceDetailView";

export default function VendorSalesInvoiceDetailPage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = Array.isArray(params?.invoiceId) ? params.invoiceId[0] : params?.invoiceId;

  if (!invoiceId) return null;

  return (
    <SalesInvoiceDetailView invoiceId={invoiceId} title="販売伝票発行（業者）" expectedType="vendor" />
  );
}
