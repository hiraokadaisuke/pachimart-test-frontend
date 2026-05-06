import assert from "node:assert/strict";
import { calculateRealGrossProfit } from "./real-profit";

const actual = calculateRealGrossProfit({ totalSales: 100000, totalCost: 60000, salesSideFees: 5000, purchaseSideCosts: 2000 });
assert.equal(actual.realGrossProfit, 33000);
assert.equal(actual.profitRate, 33);

const zero = calculateRealGrossProfit({ totalSales: 0, totalCost: 1000, salesSideFees: 0, purchaseSideCosts: 0 });
assert.equal(zero.profitRate, null);

console.log("calculateRealGrossProfit cases passed: 2");
