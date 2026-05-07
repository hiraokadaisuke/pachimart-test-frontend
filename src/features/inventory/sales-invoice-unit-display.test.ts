import assert from "node:assert/strict";

import {
  buildSalesInvoiceSupplementNote,
  buildSalesInvoiceUnitDisplay,
  formatSalesInvoiceUnitSummary,
} from "@/lib/sales/salesInvoiceUnitDisplay";
import type { SalesInvoiceItem } from "@/types/salesInvoices";

const baseItem: SalesInvoiceItem = { quantity: 1, unitPrice: 100, amount: 100 };

{
  const display = buildSalesInvoiceUnitDisplay({ ...baseItem, unitDisplayCode: "SA-M 531245", unitRawQr: "QR-1" });
  assert.equal(display.primaryCode, "SA-M 531245", "unitDisplayCode should be primary");
}

{
  const display = buildSalesInvoiceUnitDisplay({ ...baseItem, unitRawQr: "P2SS170146568" });
  assert.equal(display.primaryCode, null, "rawQr-only should not be primary");
  assert.equal(display.warningLabel, "番号未選択（QRのみ）", "warning expected when only qr exists");
}

{
  assert.equal(buildSalesInvoiceSupplementNote(baseItem), "", "empty item should build empty note");
  assert.equal(formatSalesInvoiceUnitSummary(baseItem), "", "empty item should build empty summary");
}

{
  const note = buildSalesInvoiceSupplementNote({
    ...baseItem,
    note: "既存備考",
    storageLocationName: "Lab",
    unitStatus: "IN_STOCK",
    unitMemo: "脚ゴム交換済",
  });
  assert.ok(note.includes("既存備考"));
  assert.ok(note.includes("保管先: Lab"));
  assert.ok(note.includes("状態: IN_STOCK"));
  assert.ok(note.includes("Unitメモ: 脚ゴム交換済"));
}

console.log("salesInvoiceUnitDisplay cases passed");
