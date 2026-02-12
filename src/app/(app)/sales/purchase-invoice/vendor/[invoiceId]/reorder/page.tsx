"use client";

import { useParams } from "next/navigation";

import PurchaseInvoiceReorderView from "../../../_components/PurchaseInvoiceReorderView";

export default function PurchaseInvoiceVendorReorderPage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = Array.isArray(params?.invoiceId) ? params.invoiceId[0] : params?.invoiceId;
  if (!invoiceId) return null;
  return <PurchaseInvoiceReorderView invoiceId={invoiceId} expectedType="vendor" />;
}
