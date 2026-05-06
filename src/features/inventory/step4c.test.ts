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
assert.ok(types.includes("INVENTORY_UNIT_SCANNED"));

const now = new Date("2026-05-06T00:00:00.000Z");
const activities: InventoryActivity[] = [
  { id: "1", occurredAt: new Date("2026-05-05T00:00:00.000Z"), type: "INVENTORY_UNIT_LINKED_INBOUND", title: "a", description: "a", badgeLabel: "a", href: "/" },
  { id: "2", occurredAt: new Date("2026-01-01T00:00:00.000Z"), type: "INVENTORY_UNIT_LINKED_OUTBOUND", title: "b", description: "b", badgeLabel: "b", href: "/" },
];
const filtered = filterInventoryActivities({ activities, typeFilter: "INVENTORY_UNIT_LINKED_INBOUND", rangeFilter: "ALL", now });
assert.equal(filtered.length, 1);
const rangeFiltered = filterInventoryActivities({ activities, typeFilter: "ALL", rangeFilter: "7D", now });
assert.equal(rangeFiltered.length, 1);

const duplicateWarningsStrong = buildScanDuplicateWarnings({ displayCodeDuplicate: { id: "u1" }, rawQrDuplicate: null });
assert.equal(duplicateWarningsStrong.requiresConfirm, true);
assert.ok(duplicateWarningsStrong.strongWarning);

const duplicateWarningsSoft = buildScanDuplicateWarnings({ displayCodeDuplicate: null, rawQrDuplicate: { id: "u2" } });
assert.equal(duplicateWarningsSoft.requiresConfirm, false);
assert.ok(duplicateWarningsSoft.softWarning);
console.log("step4c cases passed");
