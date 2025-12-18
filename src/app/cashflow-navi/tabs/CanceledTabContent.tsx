"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { NaviTable, type NaviTableColumn } from "@/components/transactions/NaviTable";
import { StatusBadge } from "@/components/transactions/StatusBadge";
import type { TradeStatusKey } from "@/components/transactions/status";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { TRADE_STORAGE_KEY, loadAllTrades } from "@/lib/trade/storage";
import { calculateStatementTotals } from "@/lib/trade/calcTotals";
import { TradeRecord } from "@/lib/trade/types";

type CanceledTradeRow = {
  id: string;
  canceledAt: string;
  partner: string;
  itemName: string;
  amount: number;
  reason?: string;
  status: TradeStatusKey;
};

export function CanceledTabContent() {
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

  const canceledTrades = useMemo(
    () =>
      trades
        .filter((trade) => trade.sellerUserId === currentUser.id || trade.buyerUserId === currentUser.id)
        .map((trade) => buildCanceledRow(trade, currentUser.id))
        .filter((row): row is CanceledTradeRow => row.status === "canceled"),
    [currentUser.id, trades]
  );

  const columns: NaviTableColumn[] = useMemo(
    () => [
      {
        key: "status",
        label: "状況",
        width: "110px",
        render: (row: CanceledTradeRow) => <StatusBadge statusKey={row.status} context="history" />,
      },
      { key: "canceledAt", label: "キャンセル日", width: "140px" },
      { key: "partner", label: "取引先", width: "22%" },
      { key: "itemName", label: "機種名", width: "30%" },
      {
        key: "amount",
        label: "予定金額",
        width: "140px",
        render: (row: CanceledTradeRow) => `${row.amount.toLocaleString()} 円`,
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

function buildCanceledRow(trade: TradeRecord, viewerId: string): CanceledTradeRow {
  const totals = calculateStatementTotals(trade.items, trade.taxRate ?? 0.1);
  const isSeller = trade.sellerUserId === viewerId;

  return {
    id: trade.id,
    canceledAt: formatDate(trade.canceledAt ?? trade.updatedAt ?? trade.contractDate ?? ""),
    partner: isSeller ? trade.buyerName ?? trade.buyer.companyName ?? "" : trade.sellerName ?? trade.seller.companyName ?? "",
    itemName: trade.items[0]?.itemName ?? trade.itemName ?? "商品",
    amount: totals.total,
    reason: trade.remarks,
    status: mapTradeStatus(trade.status),
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
