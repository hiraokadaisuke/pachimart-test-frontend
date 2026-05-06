export type RealProfitInput = {
  totalSales?: number | null;
  totalCost?: number | null;
  salesSideFees?: number | null;
  purchaseSideCosts?: number | null;
};

export type RealProfitResult = {
  totalSales: number;
  totalCost: number;
  salesSideFees: number;
  purchaseSideCosts: number;
  realGrossProfit: number;
  profitRate: number | null;
};

const safeNumber = (value: number | null | undefined) => (Number.isFinite(value) ? Number(value) : 0);

export function calculateRealGrossProfit(input: RealProfitInput): RealProfitResult {
  const totalSales = safeNumber(input.totalSales);
  const totalCost = safeNumber(input.totalCost);
  const salesSideFees = safeNumber(input.salesSideFees);
  const purchaseSideCosts = safeNumber(input.purchaseSideCosts);
  const realGrossProfit = totalSales - totalCost - salesSideFees - purchaseSideCosts;
  const profitRate = totalSales > 0 ? Math.round((realGrossProfit / totalSales) * 1000) / 10 : null;
  return { totalSales, totalCost, salesSideFees, purchaseSideCosts, realGrossProfit, profitRate };
}
