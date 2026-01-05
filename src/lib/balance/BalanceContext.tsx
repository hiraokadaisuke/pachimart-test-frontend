"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { addLedgerEntry } from "@/lib/balance/ledger";

type BalanceState = Record<string, number>;

type BalanceContextValue = {
  getBalance: (userId: string) => number;
  injectBalance: (userId: string, deltaAmount: number) => void;
  creditBalance: (userId: string, amount: number) => number | null;
  deductBalance: (userId: string, amount: number) => number | null;
};

const STORAGE_KEY = "dev_user_balances";

const BalanceContext = createContext<BalanceContextValue>({
  getBalance: () => 0,
  injectBalance: () => {},
  creditBalance: () => null,
  deductBalance: () => null,
});

const parseStoredBalances = (raw: string | null): BalanceState => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as BalanceState;
    if (parsed && typeof parsed === "object") {
      return Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => [key, Number(value) || 0]),
      );
    }
  } catch {
    return {};
  }
  return {};
};

const persistBalances = (next: BalanceState) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  triggerBalanceSync();
};

const applyBalanceDelta = (
  userId: string,
  delta: number,
  { allowNegative = false }: { allowNegative?: boolean } = {}
): { state: BalanceState; nextBalance: number } | null => {
  if (typeof window === "undefined") return null;
  if (!userId || !Number.isFinite(delta)) return null;
  const balances = parseStoredBalances(window.localStorage.getItem(STORAGE_KEY));
  const currentBalance = balances[userId] ?? 0;
  const nextBalance = currentBalance + delta;
  if (!allowNegative && nextBalance < 0) return null;

  const nextState = { ...balances, [userId]: nextBalance };
  persistBalances(nextState);
  return { state: nextState, nextBalance };
};

const triggerBalanceSync = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("balance_updated"));
};

export function creditBalance(userId: string, amount: number): number | null {
  if (!userId || !Number.isFinite(amount) || amount <= 0) return null;
  const result = applyBalanceDelta(userId, amount);
  if (!result) return null;
  return result.nextBalance;
}

export function deductBalanceDirect(userId: string, amount: number): number | null {
  if (!userId || !Number.isFinite(amount) || amount <= 0) return null;
  const result = applyBalanceDelta(userId, -amount);
  if (!result) return null;
  return result.nextBalance;
}

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const [balances, setBalances] = useState<BalanceState>(() => {
    if (typeof window === "undefined") return {};
    return parseStoredBalances(window.localStorage.getItem(STORAGE_KEY));
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(balances));
  }, [balances]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncBalances = () => {
      setBalances(parseStoredBalances(window.localStorage.getItem(STORAGE_KEY)));
    };
    window.addEventListener("balance_updated", syncBalances);
    window.addEventListener("storage", syncBalances);
    return () => {
      window.removeEventListener("balance_updated", syncBalances);
      window.removeEventListener("storage", syncBalances);
    };
  }, []);

  const value = useMemo(
    () => ({
      getBalance: (userId: string) => balances[userId] ?? 0,
      injectBalance: (userId: string, deltaAmount: number) => {
        if (!userId || Number.isNaN(deltaAmount)) return;
        const result = applyBalanceDelta(userId, deltaAmount, { allowNegative: true });
        if (!result) return;
        setBalances(result.state);

        if (deltaAmount !== 0) {
          void addLedgerEntry(userId, {
            category: deltaAmount >= 0 ? "DEPOSIT" : "WITHDRAWAL",
            amountYen: Math.abs(deltaAmount),
            balanceAfterYen: result.nextBalance,
          });
        }
      },
      creditBalance: (userId: string, amount: number) => {
        if (!userId || !Number.isFinite(amount) || amount <= 0) return null;
        const result = applyBalanceDelta(userId, amount);
        if (!result) return null;
        setBalances(result.state);
        return result.nextBalance;
      },
      deductBalance: (userId: string, amount: number) => {
        if (!userId || !Number.isFinite(amount)) return null;
        if (amount <= 0) return balances[userId] ?? 0;
        const result = applyBalanceDelta(userId, -amount);
        if (!result) return null;
        setBalances(result.state);
        return result.nextBalance;
      },
    }),
    [balances],
  );

  return <BalanceContext.Provider value={value}>{children}</BalanceContext.Provider>;
}

export function useBalance() {
  return useContext(BalanceContext);
}
