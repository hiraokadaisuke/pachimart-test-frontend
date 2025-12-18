"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { NaviTable, type NaviTableColumn } from "@/components/transactions/NaviTable";
import { StatusBadge } from "@/components/transactions/StatusBadge";
import { type TradeStatusKey } from "@/components/transactions/status";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { TRADE_STORAGE_KEY, loadAllTrades } from "@/lib/trade/storage";
import { calculateStatementTotals } from "@/lib/trade/calcTotals";
import { TradeRecord } from "@/lib/trade/types";

const currencyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
});

type CompletedTradeRow = {
  id: string;
  contractDate: string;
  partner: string;
  itemName: string;
  amount: number;
  role: "buy" | "sell";
  status: TradeStatusKey;
  settledAt?: string;
};

export function CompletedTabContent() {
  const currentUser = useCurrentDevUser();
  const [trades, setTrades] = useState<TradeRecord[]>([]);

  const refreshTrades = useCallback(() => {
    setTrades(loadAllTrades());
  }, []);

  useEffect(() => {
    refreshTrades();
  }, [refreshTrades]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === TRADE_STORAGE_KEY) {
        refreshTrades();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [refreshTrades]);

  const completedTrades = useMemo(
    () =>
      trades
        .filter((trade) => trade.sellerUserId === currentUser.id || trade.buyerUserId === currentUser.id)
        .map((trade) => buildCompletedRow(trade, currentUser.id))
        .filter((row): row is CompletedTradeRow => row.status === "completed" || row.status === "payment_confirmed"),
    [currentUser.id, trades]
  );

  const columns: NaviTableColumn[] = useMemo(
    () => [
      {
        key: "status",
        label: "状況",
        width: "110px",
        render: (row: CompletedTradeRow) => (
          <StatusBadge statusKey={row.status} context="history" />
        ),
      },
      { key: "contractDate", label: "成約日", width: "120px" },
      {
        key: "role",
        label: "区分",
        width: "90px",
        render: (row: CompletedTradeRow) => (row.role === "buy" ? "購入" : "売却"),
      },
      { key: "partner", label: "取引先", width: "18%" },
      { key: "itemName", label: "機種名", width: "26%" },
      {
        key: "amount",
        label: "合計金額（税込）",
        width: "150px",
        render: (row: CompletedTradeRow) => currencyFormatter.format(row.amount),
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

function buildCompletedRow(trade: TradeRecord, viewerId: string): CompletedTradeRow {
  const totals = calculateStatementTotals(trade.items, trade.taxRate ?? 0.1);
  const isSeller = trade.sellerUserId === viewerId;
  const status = mapTradeStatus(trade.status);

  return {
    id: trade.id,
    contractDate: formatDate(trade.contractDate ?? trade.createdAt ?? ""),
    partner: isSeller ? trade.buyerName ?? trade.buyer.companyName ?? "" : trade.sellerName ?? trade.seller.companyName ?? "",
    itemName: trade.items[0]?.itemName ?? trade.itemName ?? "商品",
    amount: totals.total,
    role: isSeller ? "sell" : "buy",
    status,
    settledAt: formatDate(trade.completedAt ?? trade.paymentDate ?? trade.updatedAt ?? ""),
  };
}

function mapTradeStatus(status: TradeRecord["status"]): TradeStatusKey {
  switch (status) {
    case "APPROVAL_REQUIRED":
      return "requesting";
    case "PAYMENT_REQUIRED":
      return "waiting_payment";
    case "CONFIRM_REQUIRED":
      return "payment_confirmed";
    case "COMPLETED":
      return "completed";
    case "CANCELED":
      return "canceled";
  }
  const exhaustiveCheck: never = status;
  return exhaustiveCheck;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}
