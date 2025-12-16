"use client";

import { useMemo } from "react";

import { NaviTable, type NaviTableColumn } from "@/components/transactions/NaviTable";
import { StatusBadge } from "@/components/transactions/StatusBadge";
import { type TradeStatusKey } from "@/components/transactions/status";

const currencyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
});

const completedTrades = [
  {
    id: "CF-2025112101",
    contractDate: "2025/11/18",
    partner: "株式会社パチテック",
    itemName: "P とある魔術の禁書目録",
    amount: 1280000,
    role: "sell",
    status: "completed" as TradeStatusKey,
    settledAt: "2025/11/20",
  },
  {
    id: "CF-2025111904",
    contractDate: "2025/11/15",
    partner: "有限会社スマイル",
    itemName: "S 押忍！番長ZERO",
    amount: 760000,
    role: "buy",
    status: "payment_confirmed" as TradeStatusKey,
    settledAt: "2025/11/19",
  },
  {
    id: "CF-2025111202",
    contractDate: "2025/11/10",
    partner: "株式会社エス・プラン",
    itemName: "P スーパー海物語 JAPAN2 L1",
    amount: 450000,
    role: "sell",
    status: "shipped" as TradeStatusKey,
    settledAt: "2025/11/14",
  },
];

export function CompletedTabContent() {
  const columns: NaviTableColumn[] = useMemo(
    () => [
      {
        key: "status",
        label: "状況",
        width: "110px",
        render: (row: (typeof completedTrades)[number]) => (
          <StatusBadge statusKey={row.status} context="history" />
        ),
      },
      { key: "contractDate", label: "成約日", width: "120px" },
      {
        key: "role",
        label: "区分",
        width: "90px",
        render: (row: (typeof completedTrades)[number]) => (row.role === "buy" ? "購入" : "売却"),
      },
      { key: "partner", label: "取引先", width: "18%" },
      { key: "itemName", label: "機種名", width: "26%" },
      {
        key: "amount",
        label: "合計金額（税込）",
        width: "150px",
        render: (row: (typeof completedTrades)[number]) => currencyFormatter.format(row.amount),
      },
      { key: "settledAt", label: "入出金日", width: "120px" },
    ],
    []
  );

  return (
    <section className="space-y-3 text-neutral-900">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">成約一覧</h2>
        <p className="text-sm text-neutral-700">
          取引が完了した案件を一覧で確認できます。入金・出金の完了状況とあわせて金額の内訳を把握できます。
        </p>
      </div>

      <NaviTable columns={columns} rows={completedTrades} emptyMessage="成約済みの取引はありません。" />
    </section>
  );
}
