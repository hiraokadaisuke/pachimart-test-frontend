import assert from "node:assert/strict";
import { buildDisplayCodeCandidate, parseMachineQr } from "./qr-code";

const pachinko = parseMachineQr("P2AB123456", "PACHINKO");
assert.equal(Boolean(pachinko.parsedQr), true);
assert.equal(pachinko.displayCodeCandidate, null);

const slot = parseMachineQr(" S-1001 ", "SLOT");
assert.equal(slot.displayCodeCandidate, "S-1001");
assert.equal(buildDisplayCodeCandidate("ABC", "PACHINKO"), null);

console.log("qr-code cases passed");
