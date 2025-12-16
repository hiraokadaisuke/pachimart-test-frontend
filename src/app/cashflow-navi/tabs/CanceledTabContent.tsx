"use client";

import { useMemo } from "react";

import { NaviTable, type NaviTableColumn } from "@/components/transactions/NaviTable";
import { StatusBadge } from "@/components/transactions/StatusBadge";
import type { TradeStatusKey } from "@/components/transactions/status";

const canceledTrades = [
  {
    id: "CN-2025111502",
    canceledAt: "2025/11/15",
    partner: "株式会社ミドルウェーブ",
    itemName: "P 北斗の拳9 闘神",
    amount: 620000,
    reason: "買主都合によりキャンセル",
    status: "canceled" as TradeStatusKey,
  },
  {
    id: "CN-2025111201",
    canceledAt: "2025/11/12",
    partner: "株式会社トレード連合",
    itemName: "S バジリスク絆2",
    amount: 450000,
    reason: "条件合意に至らず",
    status: "canceled" as TradeStatusKey,
  },
];

export function CanceledTabContent() {
  const columns: NaviTableColumn[] = useMemo(
    () => [
      {
        key: "status",
        label: "状況",
        width: "110px",
        render: (row: (typeof canceledTrades)[number]) => <StatusBadge statusKey={row.status} context="history" />,
      },
      { key: "canceledAt", label: "キャンセル日", width: "140px" },
      { key: "partner", label: "取引先", width: "22%" },
      { key: "itemName", label: "機種名", width: "30%" },
      {
        key: "amount",
        label: "予定金額",
        width: "140px",
        render: (row: (typeof canceledTrades)[number]) => `${row.amount.toLocaleString()} 円`,
      },
      { key: "reason", label: "備考" },
    ],
    []
  );

  return (
    <section className="space-y-3 text-neutral-900">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">キャンセル一覧</h2>
        <p className="text-sm text-neutral-700">
          キャンセルとなった案件の履歴です。理由欄にはキャンセル時のメモやコメントを追記する想定です。
        </p>
      </div>

      <NaviTable columns={columns} rows={canceledTrades} emptyMessage="キャンセル済みの案件はありません。" />
    </section>
  );
}
