import type { BalanceSummary } from "@/types/balance";
import { formatCurrency } from "@/lib/currency";

export default function BalanceSummaryBar({ summary }: { summary: BalanceSummary }) {
  const items = [
    { label: "購入予定残高", value: formatCurrency(summary.plannedPurchase) },
    { label: "売却予定残高", value: formatCurrency(summary.plannedSales) },
    { label: "利用可能残高", value: formatCurrency(summary.available) },
  ];

  return (
    <div className="grid gap-3 rounded-lg border border-sky-100 bg-white p-4 shadow-sm md:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col gap-1 rounded-md bg-sky-50 px-4 py-3 md:bg-transparent md:px-0 md:py-0"
        >
          <span className="text-xs font-semibold text-sky-700">{item.label}</span>
          <span className="text-lg font-bold text-slate-900">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
