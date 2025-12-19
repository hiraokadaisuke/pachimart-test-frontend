"use client";

import { useEffect, useMemo, useState } from "react";

import { PachipayInfoCard } from "@/components/pachipay/PachipayInfoCard";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { TRADE_STORAGE_KEY, loadAllTrades } from "@/lib/trade/storage";
import { calculateStatementTotals } from "@/lib/trade/calcTotals";
import { TradeRecord } from "@/lib/trade/types";

type CashflowTransaction = {
  id: string;
  date: string;
  kind: "入金" | "出金";
  amount: number;
};

export function HistoryTabContent() {
  const currentUser = useCurrentDevUser();
  const [trades, setTrades] = useState<TradeRecord[]>([]);

  useEffect(() => {
    setTrades(loadAllTrades());
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === TRADE_STORAGE_KEY) {
        setTrades(loadAllTrades());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const myTransactions = useMemo(
    () => buildTransactionsFromTrades(trades, currentUser.id),
    [currentUser.id, trades]
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

function buildTransactionsFromTrades(trades: TradeRecord[], userId: string): CashflowTransaction[] {
  const entries: Array<CashflowTransaction & { sortValue: number }> = trades
    .filter((trade) => trade.sellerUserId === userId || trade.buyerUserId === userId)
    .map((trade) => {
      const totals = calculateStatementTotals(trade.items, trade.taxRate ?? 0.1);
      const isSeller = trade.sellerUserId === userId;
      const rawDate =
        trade.paymentDate ??
        trade.completedAt ??
        trade.updatedAt ??
        trade.contractDate ??
        trade.createdAt ??
        new Date().toISOString();
      const dateObject = new Date(rawDate);
      const sortValue = dateObject.getTime();

      return {
        id: `${trade.id}-${isSeller ? "sell" : "buy"}`,
        date: formatDate(dateObject),
        kind: isSeller ? "入金" : "出金",
        amount: totals.total,
        sortValue,
      };
    });

  return entries
    .sort((a, b) => (Number.isNaN(b.sortValue) ? -1 : Number.isNaN(a.sortValue) ? 1 : b.sortValue - a.sortValue))
    .map(({ sortValue, ...rest }) => rest);
}

function formatDate(value: Date) {
  if (Number.isNaN(value.getTime())) return "-";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}
