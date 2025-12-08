"use client";

import { useState } from "react";
import { useDevUser } from "./DevUserContext";

export function DevUserSwitcherFloating() {
  const { current, setCurrent } = useDevUser();
  const [open, setOpen] = useState(false);

  const isProd = process.env.NEXT_PUBLIC_ENV === "production";
  if (isProd) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <div className="flex flex-col items-end gap-2">
        {open && (
          <div className="w-48 rounded-xl border border-gray-200 bg-white p-3 shadow-lg ring-1 ring-black/5">
            <p className="mb-2 text-xs font-semibold text-gray-600">開発用ユーザー</p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setCurrent("seller");
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-amber-50 ${
                  current === "seller" ? "bg-amber-100 font-semibold" : "bg-transparent"
                }`}
              >
                <span role="img" aria-label="売手ユーザー">
                  👤
                </span>
                売手ユーザー
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrent("buyer");
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-amber-50 ${
                  current === "buyer" ? "bg-amber-100 font-semibold" : "bg-transparent"
                }`}
              >
                <span role="img" aria-label="買手ユーザー">
                  👤
                </span>
                買手ユーザー
              </button>
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
