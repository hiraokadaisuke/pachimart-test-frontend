"use client";

import { useCallback, useEffect, useState } from "react";
import { NaviType } from "@prisma/client";

import { calculateStatementTotals } from "@/lib/dealings/calcTotals";
import { loadAllTradesWithApi } from "@/lib/dealings/dataSources";
import { resolveCurrentTodoKind } from "@/lib/dealings/todo";
import { TradeRecord } from "@/lib/dealings/types";

type PlannedAmounts = {
  plannedPurchase: number;
  plannedSales: number;
};

const DEALING_REFRESH_EVENTS = ["trade_records_updated", "online_inquiry_updated"] as const;

const getDealingTotal = (dealing: TradeRecord): number =>
  dealing.totalAmount ?? calculateStatementTotals(dealing.items, dealing.taxRate ?? 0.1).total;

const isPaymentCompleted = (dealing: TradeRecord, todoKind: string): boolean => {
  if (dealing.paymentDate) return true;
  return todoKind === "payment_confirmed" || todoKind === "trade_completed";
};

const calculatePlannedAmounts = (dealings: TradeRecord[], currentUserId: string): PlannedAmounts => {
  return dealings.reduce<PlannedAmounts>(
    (totals, dealing) => {
      const todoKind = resolveCurrentTodoKind(dealing);
      if (todoKind === "trade_canceled") return totals;

      const totalAmount = getDealingTotal(dealing);

      if (dealing.naviType === NaviType.ONLINE_INQUIRY) {
        if (dealing.buyerUserId === currentUserId) {
          totals.plannedPurchase += totalAmount;
        }
        if (dealing.sellerUserId === currentUserId) {
          totals.plannedSales += totalAmount;
        }
        return totals;
      }

      if (isPaymentCompleted(dealing, todoKind)) return totals;

      if (dealing.buyerUserId === currentUserId && todoKind === "application_approved") {
        totals.plannedPurchase += totalAmount;
      }

      if (
        dealing.sellerUserId === currentUserId &&
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
      const dealings = await loadAllTradesWithApi();
      const totals = calculatePlannedAmounts(dealings, currentUserId);
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

    DEALING_REFRESH_EVENTS.forEach((eventName) => window.addEventListener(eventName, handleRefresh));

    return () => {
      DEALING_REFRESH_EVENTS.forEach((eventName) => window.removeEventListener(eventName, handleRefresh));
    };
  }, [refreshPlannedAmounts]);

  return plannedAmounts;
}
