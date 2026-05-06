import assert from "node:assert/strict";
import { calculateRealGrossProfit } from "./real-profit";
import { INVENTORY_ACTIVITY_TYPE_FILTERS, INVENTORY_ACTIVITY_RANGE_FILTERS } from "./activity-feed";

const robust = calculateRealGrossProfit({ totalSales: undefined, totalCost: null, salesSideFees: 0, purchaseSideCosts: Number.NaN });
assert.equal(robust.realGrossProfit, 0);
assert.equal(robust.profitRate, null);

const active = calculateRealGrossProfit({ totalSales: 10000, totalCost: 5000, salesSideFees: 500, purchaseSideCosts: 500 });
assert.equal(active.realGrossProfit, 4000);
assert.equal(active.profitRate, 40);

const typeValues = INVENTORY_ACTIVITY_TYPE_FILTERS.map((x) => x.value);
for (const expected of ["PURCHASE_UPDATED", "SALES_UPDATED", "PAYMENT_UPDATED", "PURCHASE_CANCELED", "SALES_CANCELED", "PAYMENT_CANCELED"]) {
  assert.ok(typeValues.includes(expected as never));
}
for (const range of INVENTORY_ACTIVITY_RANGE_FILTERS) {
  assert.ok(Object.prototype.hasOwnProperty.call(range, "days"));
}

console.log("step3c cases passed");
