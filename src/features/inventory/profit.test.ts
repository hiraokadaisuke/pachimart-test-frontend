import assert from "node:assert/strict";

import { calculateProjectedProfit, type ProfitMissingReason } from "./profit";

type Case = {
  name: string;
  input: {
    purchaseUnitPrice: number | null | undefined;
    plannedSaleUnitPrice: number | null | undefined;
    quantity: number;
  };
  expected: {
    missingReason: ProfitMissingReason;
    canCalculate: boolean;
    projectedRevenue: number | null;
    projectedCost: number | null;
    projectedProfit: number | null;
    projectedProfitRate: number | null;
  };
};

const cases: Case[] = [
  { name: "原価未入力", input: { purchaseUnitPrice: null, plannedSaleUnitPrice: 12000, quantity: 2 }, expected: { missingReason: "MISSING_PURCHASE_PRICE", canCalculate: false, projectedRevenue: 24000, projectedCost: null, projectedProfit: null, projectedProfitRate: null } },
  { name: "販売予定価格未入力", input: { purchaseUnitPrice: 8000, plannedSaleUnitPrice: undefined, quantity: 2 }, expected: { missingReason: "MISSING_PLANNED_SALE_PRICE", canCalculate: false, projectedRevenue: null, projectedCost: 16000, projectedProfit: null, projectedProfitRate: null } },
  { name: "両方未入力", input: { purchaseUnitPrice: null, plannedSaleUnitPrice: undefined, quantity: 2 }, expected: { missingReason: "MISSING_BOTH_PRICES", canCalculate: false, projectedRevenue: null, projectedCost: null, projectedProfit: null, projectedProfitRate: null } },
  { name: "数量0", input: { purchaseUnitPrice: 8000, plannedSaleUnitPrice: 12000, quantity: 0 }, expected: { missingReason: "NO_QUANTITY", canCalculate: false, projectedRevenue: 0, projectedCost: 0, projectedProfit: null, projectedProfitRate: null } },
  { name: "販売予定価格0", input: { purchaseUnitPrice: 8000, plannedSaleUnitPrice: 0, quantity: 2 }, expected: { missingReason: "NO_REVENUE", canCalculate: true, projectedRevenue: 0, projectedCost: 16000, projectedProfit: -16000, projectedProfitRate: null } },
  { name: "価格入力済み（通常）", input: { purchaseUnitPrice: 8000, plannedSaleUnitPrice: 12000, quantity: 2 }, expected: { missingReason: "NONE", canCalculate: true, projectedRevenue: 24000, projectedCost: 16000, projectedProfit: 8000, projectedProfitRate: 33.3 } },
  { name: "粗利マイナス", input: { purchaseUnitPrice: 12000, plannedSaleUnitPrice: 10000, quantity: 2 }, expected: { missingReason: "NONE", canCalculate: true, projectedRevenue: 20000, projectedCost: 24000, projectedProfit: -4000, projectedProfitRate: -20 } },
  { name: "粗利率0%", input: { purchaseUnitPrice: 10000, plannedSaleUnitPrice: 10000, quantity: 2 }, expected: { missingReason: "NONE", canCalculate: true, projectedRevenue: 20000, projectedCost: 20000, projectedProfit: 0, projectedProfitRate: 0 } },
  { name: "粗利率100%に近いケース", input: { purchaseUnitPrice: 1, plannedSaleUnitPrice: 10000, quantity: 1 }, expected: { missingReason: "NONE", canCalculate: true, projectedRevenue: 10000, projectedCost: 1, projectedProfit: 9999, projectedProfitRate: 100 } },
];

for (const c of cases) {
  const actual = calculateProjectedProfit(c.input);
  assert.equal(actual.missingReason, c.expected.missingReason, `${c.name}: missingReason`);
  assert.equal(actual.canCalculate, c.expected.canCalculate, `${c.name}: canCalculate`);
  assert.equal(actual.projectedRevenue, c.expected.projectedRevenue, `${c.name}: projectedRevenue`);
  assert.equal(actual.projectedCost, c.expected.projectedCost, `${c.name}: projectedCost`);
  assert.equal(actual.projectedProfit, c.expected.projectedProfit, `${c.name}: projectedProfit`);
  assert.equal(actual.projectedProfitRate, c.expected.projectedProfitRate, `${c.name}: projectedProfitRate`);
}

console.log(`calculateProjectedProfit cases passed: ${cases.length}`);
