"use client";

import { useParams } from "next/navigation";

import SalesInvoiceDetailView from "../../_components/SalesInvoiceDetailView";

export default function SalesInvoiceGroupDetailPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId;

  if (!groupId) return null;

  return <SalesInvoiceDetailView invoiceId={groupId} title="販売伝票発行（結合）" />;
}
