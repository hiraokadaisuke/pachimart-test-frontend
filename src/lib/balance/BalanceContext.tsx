"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { addLedgerEntry } from "@/lib/balance/ledger";

type BalanceState = Record<string, number>;

type BalanceContextValue = {
  getBalance: (userId: string) => number;
  injectBalance: (userId: string, deltaAmount: number) => void;
  creditBalance: (userId: string, amount: number) => void;
  deductBalance: (userId: string, amount: number) => boolean;
};

const STORAGE_KEY = "dev_user_balances";

const BalanceContext = createContext<BalanceContextValue>({
  getBalance: () => 0,
  injectBalance: () => {},
  creditBalance: () => {},
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

const triggerBalanceSync = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("balance_updated"));
};

export function creditBalance(userId: string, amount: number) {
  if (typeof window === "undefined") return;
  if (!userId || !Number.isFinite(amount) || amount <= 0) return;
  const balances = parseStoredBalances(window.localStorage.getItem(STORAGE_KEY));
  balances[userId] = (balances[userId] ?? 0) + amount;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(balances));
  triggerBalanceSync();
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
        setBalances((prev) => ({
          ...prev,
          [userId]: (prev[userId] ?? 0) + deltaAmount,
        }));
        if (deltaAmount > 0) {
          addLedgerEntry(userId, { kind: "DEPOSIT", amount: deltaAmount });
        }
      },
      creditBalance: (userId: string, amount: number) => {
        if (!userId || !Number.isFinite(amount) || amount <= 0) return;
        setBalances((prev) => ({
          ...prev,
          [userId]: (prev[userId] ?? 0) + amount,
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
