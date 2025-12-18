"use client";

import { useParams } from "next/navigation";

import MyPageLayout from "@/components/layout/MyPageLayout";
import { StatementWorkspace } from "@/components/trade-navi/statement/StatementWorkspace";

export default function StatementPage() {
  const params = useParams<{ tradeId: string }>();
  const tradeId = Array.isArray(params?.tradeId) ? params.tradeId[0] : params?.tradeId ?? "";

  return (
    <MyPageLayout>
      <StatementWorkspace
        tradeId={tradeId}
        pageTitle="明細書"
        backHref="/trade-navi"
      />
    </MyPageLayout>
  );
}
