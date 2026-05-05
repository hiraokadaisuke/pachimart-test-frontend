export type ProfitMissingReason = "PURCHASE_PRICE_MISSING" | "PLANNED_SALE_PRICE_MISSING" | "QUANTITY_MISSING" | null;

export type CalculateProjectedProfitParams = {
  purchaseUnitPrice: number | null | undefined;
  plannedSaleUnitPrice: number | null | undefined;
  quantity: number;
};

export type ProjectedProfitResult = {
  hasPurchasePrice: boolean;
  hasPlannedSalePrice: boolean;
  canCalculate: boolean;
  projectedRevenue: number | null;
  projectedCost: number | null;
  projectedProfit: number | null;
  projectedProfitRate: number | null;
  missingReason: ProfitMissingReason;
};

export function calculateProjectedProfit({
  purchaseUnitPrice,
  plannedSaleUnitPrice,
  quantity,
}: CalculateProjectedProfitParams): ProjectedProfitResult {
  const hasPurchasePrice = purchaseUnitPrice != null;
  const hasPlannedSalePrice = plannedSaleUnitPrice != null;
  const hasQuantity = quantity > 0;

  const missingReason: ProfitMissingReason = !hasPurchasePrice
    ? "PURCHASE_PRICE_MISSING"
    : !hasPlannedSalePrice
      ? "PLANNED_SALE_PRICE_MISSING"
      : !hasQuantity
        ? "QUANTITY_MISSING"
        : null;

  const projectedRevenue = hasPlannedSalePrice ? plannedSaleUnitPrice * quantity : null;
  const projectedCost = hasPurchasePrice ? purchaseUnitPrice * quantity : null;
  const canCalculate = hasPurchasePrice && hasPlannedSalePrice && hasQuantity;

  const projectedProfit = canCalculate && projectedRevenue != null && projectedCost != null
    ? projectedRevenue - projectedCost
    : null;

  const projectedProfitRate =
    canCalculate && projectedProfit != null && projectedRevenue != null && projectedRevenue > 0
      ? Math.round((projectedProfit / projectedRevenue) * 1000) / 10
      : null;

  return {
    hasPurchasePrice,
    hasPlannedSalePrice,
    canCalculate,
    projectedRevenue,
    projectedCost,
    projectedProfit,
    projectedProfitRate,
    missingReason,
  };
}
