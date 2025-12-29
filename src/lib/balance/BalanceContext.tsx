"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type BalanceState = Record<string, number>;

type BalanceContextValue = {
  getBalance: (userId: string) => number;
  injectBalance: (userId: string, deltaAmount: number) => void;
  deductBalance: (userId: string, amount: number) => boolean;
};

const STORAGE_KEY = "dev_user_balances";

const BalanceContext = createContext<BalanceContextValue>({
  getBalance: () => 0,
  injectBalance: () => {},
  deductBalance: () => false,
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

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const [balances, setBalances] = useState<BalanceState>(() => {
    if (typeof window === "undefined") return {};
    return parseStoredBalances(window.localStorage.getItem(STORAGE_KEY));
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(balances));
  }, [balances]);

  const value = useMemo(
    () => ({
      getBalance: (userId: string) => balances[userId] ?? 0,
      injectBalance: (userId: string, deltaAmount: number) => {
        if (!userId || Number.isNaN(deltaAmount)) return;
        setBalances((prev) => ({
          ...prev,
          [userId]: (prev[userId] ?? 0) + deltaAmount,
        }));
      },
      deductBalance: (userId: string, amount: number) => {
        if (!userId || !Number.isFinite(amount)) return false;
        if (amount <= 0) return true;
        const currentBalance = balances[userId] ?? 0;
        if (currentBalance < amount) return false;
        setBalances((prev) => ({
          ...prev,
          [userId]: (prev[userId] ?? 0) - amount,
        }));
        return true;
      },
    }),
    [balances],
  );

  return <BalanceContext.Provider value={value}>{children}</BalanceContext.Provider>;
}

export function useBalance() {
  return useContext(BalanceContext);
}
