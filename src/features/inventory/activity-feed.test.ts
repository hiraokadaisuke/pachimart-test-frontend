import assert from "node:assert/strict";
import { INVENTORY_ACTIVITY_RANGE_FILTERS, filterInventoryActivities, type InventoryActivity } from "./activity-feed";

for (const range of INVENTORY_ACTIVITY_RANGE_FILTERS) {
  assert.ok("days" in range, "range filter must have days");
}

const activities: InventoryActivity[] = [
  { id: "a", occurredAt: new Date("2026-05-06T00:00:00Z"), type: "PURCHASE_RECORDED", title: "", description: "", badgeLabel: "", href: "" },
  { id: "b", occurredAt: new Date("2026-01-01T00:00:00Z"), type: "SALES_RECORDED", title: "", description: "", badgeLabel: "", href: "" },
];

const filtered = filterInventoryActivities({ activities, typeFilter: "PURCHASE_RECORDED", rangeFilter: "7D", now: new Date("2026-05-06T12:00:00Z") });
assert.equal(filtered.length, 1);
assert.equal(filtered[0]?.id, "a");

console.log("activity-feed cases passed");
