"use client";

import { StatementTotals, formatYen } from "@/lib/dealings/calcTotals";

type TotalsBoxProps = {
  totals: StatementTotals;
  label?: string;
};

export function TotalsBox({ totals, label = "金額サマリー" }: TotalsBoxProps) {
  return (
    <div className="rounded border border-slate-400 bg-white text-[12px] shadow-sm">
      <div className="bg-[#0f1f3c] px-3 py-2 text-[12px] font-semibold text-white">{label}</div>
      <div className="divide-y divide-slate-300">
        <div className="flex items-center justify-between px-3 py-2 text-neutral-900">
          <span>小計（税抜）</span>
          <span className="font-semibold">{formatYen(totals.totalWithoutTax)}</span>
        </div>
        <div className="flex items-center justify-between px-3 py-2 text-neutral-900">
          <span>消費税</span>
          <span className="font-semibold">{formatYen(totals.tax)}</span>
        </div>
        <div className="flex items-center justify-between px-3 py-3 text-base font-bold text-neutral-900">
          <span>総計（税込）</span>
          <span className="text-lg">{formatYen(totals.total)}</span>
        </div>
      </div>
    </div>
  );
}
