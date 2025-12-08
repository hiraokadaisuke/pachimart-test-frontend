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

const SALES_ROWS = [
  {
    id: "S-2025111203",
    itemName: "S 押忍！番長ZERO",
    quantity: 12,
    partnerName: "株式会社アミューズ流通",
    totalAmount: 1320000,
    status: "waiting_payment" as TradeStatusKey,
    updatedAt: "2025/11/13 08:45",
    sellerUserId: "user-a",
    buyerUserId: "user-b",
  },
  {
    id: "S-2025110501",
    itemName: "P フィーバー機動戦士ガンダムSEED",
    quantity: 7,
    partnerName: "有限会社スマイル",
    totalAmount: 1520000,
    status: "shipped" as TradeStatusKey,
    updatedAt: "2025/11/06 16:15",
    sellerUserId: "user-a",
    buyerUserId: "user-b",
  },
  {
    id: "S-2025102803",
    itemName: "P 北斗の拳9 闘神",
    quantity: 5,
    partnerName: "株式会社パチテック",
    totalAmount: 980000,
    status: "completed" as TradeStatusKey,
    updatedAt: "2025/10/29 09:30",
    sellerUserId: "user-b",
    buyerUserId: "user-a",
  },
];

export default function SalesPage() {
  const router = useRouter();
  const currentUser = useCurrentDevUser();
  const [statusFilter, setStatusFilter] = useState<"all" | "inProgress" | "completed">("all");
  const [keyword, setKeyword] = useState("");

  const filteredRows = useMemo(() => {
    const keywordLower = keyword.toLowerCase();

    return SALES_ROWS.filter((row) => row.sellerUserId === currentUser.id).filter((row) => {
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
          <h1 className="text-xl font-bold text-slate-900">売却一覧</h1>
          <p className="text-sm text-neutral-800">取引Naviのテーブルと同一コンポーネントで、売却取引の進捗と履歴を確認できます。</p>
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
          物件名 / 台数 / 相手先 / 税込合計 / ステータス / 更新日時 の順で並べ、他タブと世界観を合わせています。
        </div>

        <NaviTable
          columns={standardNaviColumns}
          rows={filteredRows}
          emptyMessage="売却済みの取引はまだありません。"
          onRowClick={(row) => row.id && router.push(`/transactions/navi/${row.id}`)}
        />
      </section>
    </main>
  );
}
