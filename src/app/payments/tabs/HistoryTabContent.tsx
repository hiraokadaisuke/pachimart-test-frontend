"use client";

import { useEffect, useMemo, useState } from "react";

import { PachipayInfoCard } from "@/components/pachipay/PachipayInfoCard";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { listLedgerEntries, type LedgerEntry } from "@/lib/balance/ledger";

type CashflowTransaction = {
  id: string;
  date: string;
  kind: "入金" | "出金";
  amount: number;
};

export function HistoryTabContent() {
  const currentUser = useCurrentDevUser();
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    const syncLedger = () => {
      setLedgerEntries(listLedgerEntries(currentUser.id));
    };

    syncLedger();
    if (typeof window !== "undefined") {
      window.addEventListener("ledger_updated", syncLedger);
      window.addEventListener("storage", syncLedger);
      return () => {
        window.removeEventListener("ledger_updated", syncLedger);
        window.removeEventListener("storage", syncLedger);
      };
    }
    return;
  }, [currentUser.id]);

  const myTransactions = useMemo(
    () => buildTransactionsFromLedger(ledgerEntries),
    [ledgerEntries]
  );

  return (
    <div className="space-y-6">
      <PachipayInfoCard title="入出金履歴" description="入金・出金の履歴をまとめて表示します。" />

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

function formatDate(value: Date) {
  if (Number.isNaN(value.getTime())) return "-";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function buildTransactionsFromLedger(entries: LedgerEntry[]): CashflowTransaction[] {
  return [...entries]
    .map((entry) => {
      const dateObject = new Date(entry.createdAt);
      return {
        id: entry.id,
        date: formatDate(dateObject),
        kind: entry.amount >= 0 ? ("入金" as const) : ("出金" as const),
        amount: Math.abs(entry.amount),
        sortValue: dateObject.getTime(),
      };
    })
    .sort((a, b) => (Number.isNaN(b.sortValue) ? -1 : Number.isNaN(a.sortValue) ? 1 : b.sortValue - a.sortValue))
    .map(({ sortValue, ...rest }) => rest);
}
