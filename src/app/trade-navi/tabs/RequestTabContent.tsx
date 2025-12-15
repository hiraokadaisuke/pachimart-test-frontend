"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { TransactionNaviEditor } from "@/app/transactions/navi/TransactionNaviEditor";

export function RequestTabContent() {
  const searchParams = useSearchParams();
  const safeSearchParams = useMemo(() => searchParams ?? new URLSearchParams(), [searchParams]);

  return <TransactionNaviEditor transactionId="new" searchParams={safeSearchParams} />;
}
