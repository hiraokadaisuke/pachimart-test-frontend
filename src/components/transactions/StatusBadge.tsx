import React from "react";

import { TRADE_STATUS_DEFINITIONS, type TradeStatusKey } from "./status";

type StatusBadgeProps = {
  statusKey: TradeStatusKey;
};

export function StatusBadge({ statusKey }: StatusBadgeProps) {
  const def = TRADE_STATUS_DEFINITIONS.find((status) => status.key === statusKey);

  if (!def) return null;

  const baseClass = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold";
  const colorClass = {
    gray: "bg-slate-100 text-neutral-900",
    blue: "bg-blue-50 text-blue-700",
    yellow: "bg-yellow-50 text-yellow-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
  }[def.color];

  return <span className={`${baseClass} ${colorClass}`}>{def.label}</span>;
}
