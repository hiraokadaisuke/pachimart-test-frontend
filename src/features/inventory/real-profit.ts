export type RealProfitInput = {
  totalSales: number;
  totalCost: number;
  salesSideFees: number;
  purchaseSideCosts: number;
};

export type RealProfitResult = RealProfitInput & {
  realGrossProfit: number;
  profitRate: number | null;
};

export function calculateRealGrossProfit(input: RealProfitInput): RealProfitResult {
  const realGrossProfit = input.totalSales - input.totalCost - input.salesSideFees - input.purchaseSideCosts;
  const profitRate = input.totalSales > 0 ? Math.round((realGrossProfit / input.totalSales) * 1000) / 10 : null;
  return { ...input, realGrossProfit, profitRate };
}
