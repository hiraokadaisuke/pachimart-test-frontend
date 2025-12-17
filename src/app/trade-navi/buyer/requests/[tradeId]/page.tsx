"use client";

import { useParams } from "next/navigation";

import MyPageLayout from "@/components/layout/MyPageLayout";
import { StatementWorkspace } from "@/components/trade-navi/statement/StatementWorkspace";

export default function BuyerRequestDetailPage() {
  const params = useParams<{ tradeId: string }>();
  const tradeId = Array.isArray(params?.tradeId) ? params.tradeId[0] : params?.tradeId ?? "";

  return (
    <MyPageLayout>
      <StatementWorkspace
        tradeId={tradeId}
        pageTitle="届いた依頼（要承認）"
        description="売主から送られてきた依頼の明細書です。発送先と担当者を入力し、承認してください。"
        backHref="/trade-navi"
      />
    </MyPageLayout>
  );
}
