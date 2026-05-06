import assert from "node:assert/strict";
import { parseMachineQr } from "./qr-code";
import { INVENTORY_ACTIVITY_TYPE_FILTERS, filterInventoryActivities, type InventoryActivity } from "./activity-feed";
import { buildScanDuplicateWarnings } from "./unit-scan";

const parsed = parseMachineQr("S-1001", "SLOT");
assert.ok(parsed);

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

const duplicateWarningsStrong = buildScanDuplicateWarnings({ displayCodeDuplicate: { id: "u1" }, rawQrDuplicate: null });
assert.equal(duplicateWarningsStrong.requiresConfirm, true);
assert.ok(duplicateWarningsStrong.strongWarning);

const duplicateWarningsSoft = buildScanDuplicateWarnings({ displayCodeDuplicate: null, rawQrDuplicate: { id: "u2" } });
assert.equal(duplicateWarningsSoft.requiresConfirm, false);
assert.ok(duplicateWarningsSoft.softWarning);
console.log("step4c cases passed");
