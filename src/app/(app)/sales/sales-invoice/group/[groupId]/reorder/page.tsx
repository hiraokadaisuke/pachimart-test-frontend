"use client";

import { useParams } from "next/navigation";

import SalesInvoiceReorderView from "../../../_components/SalesInvoiceReorderView";

export default function SalesInvoiceGroupReorderPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId;
  if (!groupId) return null;
  return <SalesInvoiceReorderView invoiceId={groupId} isGroup />;
}
