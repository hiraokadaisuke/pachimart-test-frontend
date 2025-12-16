"use client";

import Link from "next/link";
import { useMemo } from "react";

import { formatCurrency } from "@/lib/currency";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { dummyBalances } from "@/lib/dummyBalances";
import type { BalanceSummary } from "@/types/balance";

function BalanceSummaryCard({ summary }: { summary: BalanceSummary }) {
  const items = useMemo(
    () => [
      { label: "購入予定残高", value: formatCurrency(summary.plannedPurchase) },
      { label: "売却予定残高", value: formatCurrency(summary.plannedSales) },
      { label: "利用可能残高", value: formatCurrency(summary.available) },
    ],
    [summary.available, summary.plannedPurchase, summary.plannedSales]
  );

  return (
    <div className="rounded-lg border border-sky-100 bg-white px-4 py-3 shadow-sm">
      <div className="grid gap-2 text-sm text-slate-800">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between gap-3">
            <span className="font-semibold text-sky-700">{item.label}</span>
            <span className="font-bold text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinkCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="space-y-1">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <p className="text-xs text-neutral-700">{description}</p>
      </div>
    </Link>
  );
}

export default function PachipayTopPage() {
  const currentUser = useCurrentDevUser();
  const balanceSummary: BalanceSummary =
    dummyBalances.find((balance) => balance.userId === currentUser.id) ?? dummyBalances[0];

  const linkCards = [
    {
      href: "/mypage/pachipay/in-progress",
      title: "入出金の進行中一覧を見る",
      description: "入出金申請や振込手続きなど、現在進行中のステータスを確認します。",
    },
    {
      href: "/mypage/pachipay/completed",
      title: "入出金の成約一覧を見る",
      description: "完了した入出金の成約状況をまとめて確認できます。",
    },
    {
      href: "/mypage/pachipay/history",
      title: "入出金の履歴一覧を見る",
      description: "これまでの入出金履歴を時系列で確認します。",
    },
    {
      href: "/mypage/pachipay/canceled",
      title: "入出金のキャンセル一覧を見る",
      description: "キャンセルされた入出金申請を一覧で表示します。",
    },
  ];

  return (
    <main className="space-y-6">
      <p className="text-sm text-neutral-900">
        入出金管理のハブページです。パチマート残高の状況や入出金の各種一覧にアクセスできます。
      </p>

      <BalanceSummaryCard summary={balanceSummary} />

      <div className="space-y-3">
        {linkCards.map((card) => (
          <LinkCard key={card.href} {...card} />
        ))}
      </div>
    </main>
  );
}
