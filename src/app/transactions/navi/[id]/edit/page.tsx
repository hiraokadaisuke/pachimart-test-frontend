"use client";

import { useParams, useSearchParams } from "next/navigation";
import { TransactionNaviEditor } from "@/app/transactions/navi/TransactionNaviEditor";

export default function TransactionNaviEditPage() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const transactionId = Array.isArray(params?.id) ? params?.id[0] : params?.id ?? "dummy-1";

  return <TransactionNaviEditor transactionId={transactionId} searchParams={searchParams ?? undefined} />;
}
