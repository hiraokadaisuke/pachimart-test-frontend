"use client";

import { useMemo } from "react";

import { PachipayInfoCard } from "@/components/pachipay/PachipayInfoCard";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { dummyTransactions } from "@/lib/dummyBalances";

export function HistoryTabContent() {
  const currentUser = useCurrentDevUser();

  const myTransactions = useMemo(
    () => dummyTransactions.filter((tx) => tx.userId === currentUser.id),
    [currentUser.id]
  );

  return (
    <div className="space-y-6">
      <PachipayInfoCard
        title="入出金履歴"
        description="入金・出金の履歴をまとめて表示するスタブです。詳細や検索条件は今後拡張予定です。"
      />

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <table className="min-w-full table-auto text-sm text-slate-800">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-3 py-2">日付</th>
              <th className="px-3 py-2">区分</th>
              <th className="px-3 py-2 text-right">金額</th>
            </tr>
          </thead>
          <tbody>
            {myTransactions.map((tx) => (
              <tr key={tx.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{tx.date}</td>
                <td className="px-3 py-2">{tx.kind}</td>
                <td className="px-3 py-2 text-right">{tx.amount.toLocaleString()} 円</td>
              </tr>
            ))}
            {myTransactions.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-center text-sm text-neutral-600" colSpan={3}>
                  入出金履歴はまだありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
