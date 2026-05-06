import assert from "node:assert/strict";
import { buildDisplayCodeCandidate, parseMachineQr } from "./qr-code";
import { INVENTORY_ACTIVITY_TYPE_FILTERS, filterInventoryActivities, type InventoryActivity } from "./activity-feed";

const parsed = parseMachineQr("S-1001", "SLOT");
assert.ok(parsed.parsedQr);
assert.equal(buildDisplayCodeCandidate("S-1001", parsed.parsedQr), "S-1001");

const provisionalAllowed = { displayCode: null, status: "PROVISIONAL" as const };
assert.equal(provisionalAllowed.displayCode, null);
assert.equal(provisionalAllowed.status, "PROVISIONAL");

const types = INVENTORY_ACTIVITY_TYPE_FILTERS.map((x) => x.value);
assert.ok(types.includes("INVENTORY_UNIT_LINKED_INBOUND"));
assert.ok(types.includes("INVENTORY_UNIT_LINKED_OUTBOUND"));

const activities: InventoryActivity[] = [
  { id: "1", occurredAt: new Date(), type: "INVENTORY_UNIT_LINKED_INBOUND", title: "a", description: "a", badgeLabel: "a", href: "/" },
];
const filtered = filterInventoryActivities({ activities, typeFilter: "INVENTORY_UNIT_LINKED_INBOUND", rangeFilter: "ALL", now: new Date() });
assert.equal(filtered.length, 1);
console.log("step4c cases passed");
