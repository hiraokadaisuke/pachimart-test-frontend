import assert from "node:assert/strict";
import { buildTemplateCsv, computeCsvFileHash, parseCsv, parseInventoryImportRows, validateImportRows } from "./csv-import";
import { INVENTORY_ACTIVITY_TYPE_FILTERS } from "./activity-feed";

const bom = "\uFEFF種別,機種名,台数\nPACHINKO,AA,1";
assert.equal(parseInventoryImportRows(bom).rows.length, 1);
assert.equal(parseCsv("種別,機種名,台数\r\nPACHINKO,AA,1\r\n").length, 2);
assert.equal(parseCsv("種別,機種名,台数\n\"PACHINKO\",\"A,A\",\"1\"").length, 2);
assert.equal(parseCsv("種別,機種名,台数\nPACHINKO,\"A\nA\",1")[1][1], "A\nA");
assert.ok(parseInventoryImportRows("機種名,台数\nA,1").issues.some((i) => i.level === "error"));
assert.ok(validateImportRows([{ rowNumber: 2, 種別: "PACHINKO", メーカー: "", 機種名: "A", 枠色: "", 台数: "0", 保管場所: "", 仕入単価: "", 販売予定単価: "", ステータス: "", メモ: "" }]).some((i) => i.message.includes("台数")));
assert.ok(validateImportRows([{ rowNumber: 2, 種別: "PACHINKO", メーカー: "", 機種名: "A", 枠色: "", 台数: "1", 保管場所: "", 仕入単価: "-1", 販売予定単価: "", ステータス: "", メモ: "" }]).some((i) => i.message.includes("仕入単価")));
assert.ok(validateImportRows([{ rowNumber: 2, 種別: "PACHINKO", メーカー: "", 機種名: "A", 枠色: "", 台数: "1", 保管場所: "", 仕入単価: "", 販売予定単価: "", ステータス: "", メモ: "" }]).some((i) => i.level === "warning"));
for (const type of ["INVENTORY_CSV_IMPORTED", "INVENTORY_CSV_IMPORT_FAILED", "INVENTORY_INITIAL_STOCK_CREATED"]) assert.ok(INVENTORY_ACTIVITY_TYPE_FILTERS.some((x) => x.value === type));
const template = buildTemplateCsv();
assert.ok(template.startsWith("\uFEFF"));
assert.ok(template.includes("CSVインポートサンプル"));
assert.equal(computeCsvFileHash("a,b"), computeCsvFileHash("\uFEFFa,b"));
console.log("csv-import cases passed");
