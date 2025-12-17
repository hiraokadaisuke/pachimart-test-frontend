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
        description="取引の締結書風 明細書です。印刷やPDF保存に対応しています。"
        backHref="/trade-navi"
      />
    </MyPageLayout>
  );
}
