"use client";

import { useCallback, useEffect, useState } from "react";
import { NaviType } from "@prisma/client";

import { calculateStatementTotals } from "@/lib/trade/calcTotals";
import { loadAllTradesWithApi } from "@/lib/trade/dataSources";
import { loadAcceptedOnlineInquiryTrades } from "@/lib/trade/onlineInquiryTrades";
import { resolveCurrentTodoKind } from "@/lib/trade/todo";
import { TradeRecord } from "@/lib/trade/types";

type PlannedAmounts = {
  plannedPurchase: number;
  plannedSales: number;
};

const TRADE_REFRESH_EVENTS = ["trade_records_updated", "online_inquiry_updated"] as const;

const getTradeTotal = (trade: TradeRecord): number =>
  trade.totalAmount ?? calculateStatementTotals(trade.items, trade.taxRate ?? 0.1).total;

const isPaymentCompleted = (trade: TradeRecord, todoKind: string): boolean => {
  if (trade.paymentDate) return true;
  return todoKind === "payment_confirmed" || todoKind === "trade_completed";
};

const calculatePlannedAmounts = (trades: TradeRecord[], currentUserId: string): PlannedAmounts => {
  return trades.reduce<PlannedAmounts>(
    (totals, trade) => {
      const todoKind = resolveCurrentTodoKind(trade);
      if (todoKind === "trade_canceled") return totals;

      const totalAmount = getTradeTotal(trade);

      if (trade.naviType === NaviType.ONLINE_INQUIRY) {
        if (trade.buyerUserId === currentUserId) {
          totals.plannedPurchase += totalAmount;
        }
        if (trade.sellerUserId === currentUserId) {
          totals.plannedSales += totalAmount;
        }
        return totals;
      }

      if (isPaymentCompleted(trade, todoKind)) return totals;

      if (trade.buyerUserId === currentUserId && todoKind === "application_approved") {
        totals.plannedPurchase += totalAmount;
      }

      if (
        trade.sellerUserId === currentUserId &&
        (todoKind === "application_sent" || todoKind === "application_approved")
      ) {
        totals.plannedSales += totalAmount;
      }

      return totals;
    },
    { plannedPurchase: 0, plannedSales: 0 }
  );
};

export function usePlannedAmounts(currentUserId: string) {
  const [plannedAmounts, setPlannedAmounts] = useState<PlannedAmounts>({
    plannedPurchase: 0,
    plannedSales: 0,
  });

  const refreshPlannedAmounts = useCallback(async () => {
    if (!currentUserId) {
      setPlannedAmounts({ plannedPurchase: 0, plannedSales: 0 });
      return;
    }

    try {
      const [trades, inquiries] = await Promise.all([
        loadAllTradesWithApi(),
        loadAcceptedOnlineInquiryTrades(),
      ]);
      const totals = calculatePlannedAmounts([...trades, ...inquiries], currentUserId);
      setPlannedAmounts(totals);
    } catch (error) {
      console.error("Failed to load planned balances", error);
      setPlannedAmounts({ plannedPurchase: 0, plannedSales: 0 });
    }
  }, [currentUserId]);

  useEffect(() => {
    void refreshPlannedAmounts();
  }, [refreshPlannedAmounts]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleRefresh = () => {
      void refreshPlannedAmounts();
    };

    TRADE_REFRESH_EVENTS.forEach((eventName) => window.addEventListener(eventName, handleRefresh));

    return () => {
      TRADE_REFRESH_EVENTS.forEach((eventName) => window.removeEventListener(eventName, handleRefresh));
    };
  }, [refreshPlannedAmounts]);

  return plannedAmounts;
}
