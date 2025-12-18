"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { NaviTable } from "@/components/transactions/NaviTable";
import { TransactionFilterBar } from "@/components/transactions/TransactionFilterBar";
import { standardNaviColumns } from "@/components/transactions/standardColumns";
import {
  COMPLETED_STATUS_KEYS,
  IN_PROGRESS_STATUS_KEYS,
  type TradeStatusKey,
} from "@/components/transactions/status";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";

const PURCHASE_ROWS = [
  {
    id: "P-2025111401",
    itemName: "P スーパー海物語 IN 沖縄5", // 物件名（機種名）
    quantity: 8,
    partnerName: "株式会社パチテック", // 相手先
    totalAmount: 1180000,
    status: "payment_confirmed" as TradeStatusKey, // 状況
    updatedAt: "2025/11/15 09:20", // 更新日時
    buyerUserId: "user-a",
    sellerUserId: "user-b",
  },
  {
    id: "P-2025110802",
    itemName: "P とある魔術の禁書目録",
    quantity: 4,
    partnerName: "有限会社スマイル",
    totalAmount: 760000,
    status: "application_approved" as TradeStatusKey,
    updatedAt: "2025/11/09 17:05",
    buyerUserId: "user-a",
    sellerUserId: "user-b",
  },
  {
    id: "P-2025103011",
    itemName: "P ルパン三世 2000カラットの涙",
    quantity: 6,
    partnerName: "株式会社ミドルウェーブ",
    totalAmount: 840000,
    status: "trade_completed" as TradeStatusKey,
    updatedAt: "2025/10/31 10:45",
    buyerUserId: "user-b",
    sellerUserId: "user-a",
  },
];

export default function PurchasesPage() {
  const router = useRouter();
  const currentUser = useCurrentDevUser();
  const [statusFilter, setStatusFilter] = useState<"all" | "inProgress" | "completed">("all");
  const [keyword, setKeyword] = useState("");

  const filteredRows = useMemo(() => {
    const keywordLower = keyword.toLowerCase();

    return PURCHASE_ROWS.filter((row) => row.buyerUserId === currentUser.id).filter((row) => {
      if (statusFilter === "inProgress") return IN_PROGRESS_STATUS_KEYS.includes(row.status);
      if (statusFilter === "completed") return COMPLETED_STATUS_KEYS.includes(row.status);
      return true;
    }).filter((row) => {
      if (!keywordLower) return true;
      return row.itemName.toLowerCase().includes(keywordLower) || row.partnerName.toLowerCase().includes(keywordLower);
    });
  }, [currentUser.id, keyword, statusFilter]);

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900">購入一覧</h1>
          <p className="text-sm text-neutral-800">取引Naviの履歴と同じフォーマットで、購入取引の状況を確認できます。</p>
        </div>
      </header>

      <section className="space-y-3">
        <TransactionFilterBar
          statusFilter={statusFilter}
          keyword={keyword}
          onStatusChange={setStatusFilter}
          onKeywordChange={setKeyword}
        />

        <div className="rounded border border-slate-200 bg-white px-4 py-2 text-xs text-neutral-800">
          機種名・台数・相手先・税込合計・ステータス・更新日時を共通レイアウトで表示しています。
        </div>

        <NaviTable
          columns={standardNaviColumns}
          rows={filteredRows}
          emptyMessage="購入済みの取引はまだありません。"
          onRowClick={(row) => row.id && router.push(`/transactions/navi/${row.id}`)}
        />
      </section>
    </main>
  );
}
