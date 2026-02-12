"use client";

import { useParams } from "next/navigation";

import SalesInvoiceReorderView from "../../../_components/SalesInvoiceReorderView";

export default function SalesInvoiceVendorReorderPage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = Array.isArray(params?.invoiceId) ? params.invoiceId[0] : params?.invoiceId;
  if (!invoiceId) return null;
  return <SalesInvoiceReorderView invoiceId={invoiceId} invoiceType="vendor" />;
}
