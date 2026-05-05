import { formatCurrency } from "@/features/inventory/labels";
import type { ProjectedProfitResult } from "@/features/inventory/profit";

type InventoryProfitProps = {
  purchaseUnitPrice: number | null;
  plannedSaleUnitPrice: number | null;
  projected: ProjectedProfitResult;
};

export function InventoryProfitSummary({
  purchaseUnitPrice,
  plannedSaleUnitPrice,
  projected,
}: InventoryProfitProps) {
  return (
    <div className="grid gap-3 text-sm sm:grid-cols-2">
      <div>
        <p className="text-slate-500">仕入単価（税抜）</p>
        <p className="text-lg font-semibold">{purchaseUnitPrice != null ? formatCurrency(purchaseUnitPrice) : "原価未入力"}</p>
      </div>
      <div>
        <p className="text-slate-500">販売予定単価（税抜）</p>
        <p className="text-lg font-semibold">{plannedSaleUnitPrice != null ? formatCurrency(plannedSaleUnitPrice) : "販売予定価格未入力"}</p>
      </div>
      <div>
        <p className="text-slate-500">見込み売上</p>
        <p className="text-lg font-semibold">{projected.projectedRevenue != null ? formatCurrency(projected.projectedRevenue) : "販売予定価格未入力"}</p>
      </div>
      <div>
        <p className="text-slate-500">見込み原価</p>
        <p className="text-lg font-semibold">{projected.projectedCost != null ? formatCurrency(projected.projectedCost) : "原価未入力"}</p>
      </div>
      <div>
        <p className="text-slate-500">見込み粗利</p>
        <p className="text-xl font-bold">{projected.projectedProfit != null ? formatCurrency(projected.projectedProfit) : "価格入力で表示"}</p>
      </div>
      <div>
        <p className="text-slate-500">見込み粗利率</p>
        <p className="text-xl font-bold">{projected.projectedProfitRate != null ? `${projected.projectedProfitRate}%` : "-"}</p>
      </div>
    </div>
  );
}

export function InventoryProfitMini({ projected }: { projected: ProjectedProfitResult }) {
  return <>{projected.projectedProfit != null ? formatCurrency(projected.projectedProfit) : "-"}</>;
}
