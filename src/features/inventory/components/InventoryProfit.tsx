import { formatCurrency } from "@/features/inventory/labels";
import type { ProfitMissingReason, ProjectedProfitResult } from "@/features/inventory/profit";
import Link from "next/link";

type InventoryProfitProps = {
  itemId?: string;
  purchaseUnitPrice: number | null;
  plannedSaleUnitPrice: number | null;
  projected: ProjectedProfitResult;
};

const missingReasonMessageMap: Record<Exclude<ProfitMissingReason, "NONE">, string> = {
  MISSING_PURCHASE_PRICE: "原価を入力してください",
  MISSING_PLANNED_SALE_PRICE: "販売予定価格を入力してください",
  MISSING_BOTH_PRICES: "原価と販売予定価格を入力してください",
  NO_QUANTITY: "在庫数がないため計算できません",
  NO_REVENUE: "販売予定価格が0円のため粗利率を表示できません",
};

const missingReasonMiniLabelMap: Record<Exclude<ProfitMissingReason, "NONE">, string> = {
  MISSING_PURCHASE_PRICE: "原価未入力",
  MISSING_PLANNED_SALE_PRICE: "販売予定未入力",
  MISSING_BOTH_PRICES: "価格未入力",
  NO_QUANTITY: "数量なし",
  NO_REVENUE: "-",
};

export function InventoryProfitSummary({
  itemId,
  purchaseUnitPrice,
  plannedSaleUnitPrice,
  projected,
}: InventoryProfitProps) {
  const shouldShowGuidance = !projected.canCalculate || projected.projectedProfitRate == null;
  const missingMessage = projected.missingReason !== "NONE" ? missingReasonMessageMap[projected.missingReason] : null;

  return (
    <div className="space-y-3">
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
      {shouldShowGuidance ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          <p>{missingMessage ?? "原価と販売予定価格を入力すると、見込み粗利を表示できます。"}</p>
          {itemId ? (
            <Link href={`/inventory/items/${itemId}/edit`} className="mt-2 inline-block text-blue-600 underline">
              価格情報を編集する
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function InventoryProfitMini({ projected }: { projected: ProjectedProfitResult }) {
  if (projected.projectedProfit != null) return <>{formatCurrency(projected.projectedProfit)}</>;
  const label = projected.missingReason !== "NONE" ? missingReasonMiniLabelMap[projected.missingReason] : "-";
  const title = projected.missingReason !== "NONE" ? missingReasonMessageMap[projected.missingReason] : undefined;
  return <span title={title}>{label}</span>;
}
