import assert from "node:assert/strict";
import { evaluateOutboundUnitCheck } from "@/features/inventory/outbound-work";

{
  const res = evaluateOutboundUnitCheck({ unitDisplayCode: "SA-M 531245", displayCodeInput: "sam-531245" });
  assert.equal(res.result, "MATCHED");
}

{
  const res = evaluateOutboundUnitCheck({ unitDisplayCode: "SA-M 531245", unitRawQr: "QR-999", rawQrInput: "qr999" });
  assert.equal(res.result, "QR_MATCHED");
}

{
  const res = evaluateOutboundUnitCheck({ unitDisplayCode: "A-1", displayCodeInput: "B-1" });
  assert.equal(res.result, "MISMATCH");
}
