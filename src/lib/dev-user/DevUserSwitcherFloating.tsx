"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/currency";
import { useBalance } from "@/lib/balance/BalanceContext";
import { useDevUser } from "./DevUserContext";
import { DEV_USERS } from "./users";

export function DevUserSwitcherFloating() {
  const { current, setCurrent } = useDevUser();
  const [open, setOpen] = useState(false);
  const [amountInput, setAmountInput] = useState(0);
  const { getBalance, injectBalance } = useBalance();
  const currentUserId = DEV_USERS[current].id;
  const currentBalance = getBalance(currentUserId);
  const parsedAmount = useMemo(() => {
    if (!Number.isFinite(amountInput)) return 0;
    return Math.floor(amountInput);
  }, [amountInput]);

  const isProd = process.env.NEXT_PUBLIC_ENV === "production";
  if (isProd) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <div className="flex flex-col items-end gap-2">
        {open && (
          <div className="w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-lg ring-1 ring-black/5">
            <p className="mb-2 text-xs font-semibold text-gray-600">開発用ユーザー</p>
            <div className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-gray-700">
              <div className="text-[11px] text-gray-500">現在残高</div>
              <div className="text-sm font-semibold text-gray-900">
                {formatCurrency(currentBalance)}
              </div>
            </div>
            <div className="mb-3 flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={Number.isNaN(amountInput) ? "" : amountInput}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setAmountInput(Number.isNaN(nextValue) ? 0 : nextValue);
                }}
                className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                placeholder="金額"
                aria-label="残高注入金額"
              />
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => injectBalance(currentUserId, Math.abs(parsedAmount))}
                  className="rounded-md border border-amber-300 bg-amber-200 px-2 py-1 text-xs font-semibold text-gray-800 transition hover:bg-amber-100"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => injectBalance(currentUserId, -Math.abs(parsedAmount))}
                  className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  -
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {Object.values(DEV_USERS).map((user) => (
                <button
                  key={user.key}
                  type="button"
                  onClick={() => {
                    setCurrent(user.key);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-amber-50 ${
                    current === user.key ? "bg-amber-100 font-semibold" : "bg-transparent"
                  }`}
                >
                  <span role="img" aria-label={user.label}>
                    👤
                  </span>
                  {user.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-400 bg-amber-300 text-2xl shadow-md transition hover:translate-y-[-1px] hover:bg-amber-200"
          aria-label="開発用ユーザー切替"
        >
          👥
        </button>
      </div>
    </div>
  );
}
