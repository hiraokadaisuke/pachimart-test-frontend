import { InventoryItemType, InventoryListingStatus, InventoryMovementStatus, InventoryMovementType, InventoryOwnershipType, InventoryStatus, Prisma } from "@prisma/client";
import { createHash } from "node:crypto";

export const INVENTORY_IMPORT_HEADERS = ["種別","メーカー","機種名","枠色","台数","保管場所","仕入単価","販売予定単価","ステータス","メモ"] as const;

type HeaderKey = (typeof INVENTORY_IMPORT_HEADERS)[number];
export type CsvImportRow = Record<HeaderKey,string> & { rowNumber:number };
export type CsvImportIssue = { rowNumber:number; level:"error"|"warning"; field?: HeaderKey; value?: string; message:string };

const TYPE_MAP: Record<string, InventoryItemType> = {"パチンコ":"PACHINKO","PACHINKO":"PACHINKO","パチスロ":"SLOT","SLOT":"SLOT"};
const STATUS_MAP: Record<string, InventoryStatus> = {"下書き":"DRAFT","在庫中":"IN_STOCK","商談中":"NEGOTIATING","予約":"RESERVED","出庫予定":"OUTBOUND_SCHEDULED","売却済":"SOLD","設置":"INSTALLED","非在庫":"NON_STOCK","アーカイブ":"ARCHIVED",...Object.fromEntries(Object.values(InventoryStatus).map((v)=>[v,v]))};

export function parseCsv(text: string): string[][] {
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i=0;i<input.length;i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i+1] === '"') { cell += '"'; i++; } else { inQuotes = false; }
      } else cell += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ',') { row.push(cell); cell=""; continue; }
    if (ch === '\n') { row.push(cell); if (row.some((v)=>v.trim()!=="")) rows.push(row); row=[]; cell=""; continue; }
    if (ch === '\r') continue;
    cell += ch;
  }
  row.push(cell); if (row.some((v)=>v.trim()!=="")) rows.push(row);
  return rows;
}

export function parseInventoryImportRows(text: string): { rows: CsvImportRow[]; issues: CsvImportIssue[] } {
  const table = parseCsv(text);
  if (!table.length) return { rows: [], issues: [{ rowNumber: 0, level: "error", message: "CSVが空です" }] };
  const header = table[0];
  const col = Object.fromEntries(INVENTORY_IMPORT_HEADERS.map((h)=>[h, header.indexOf(h)])) as Record<HeaderKey, number>;
  const issues: CsvImportIssue[] = [];
  for (const h of ["種別","機種名","台数"] as HeaderKey[]) if (col[h] < 0) issues.push({ rowNumber: 0, level: "error", field: h, message: `必須列がありません: ${h}` });
  const rows: CsvImportRow[] = [];
  for (let i=1;i<table.length;i++) {
    const raw = table[i];
    const rec = { rowNumber: i+1 } as CsvImportRow;
    for (const h of INVENTORY_IMPORT_HEADERS) rec[h] = col[h] >= 0 ? String(raw[col[h]] ?? "").trim() : "";
    rows.push(rec);
  }
  return { rows, issues };
}

export function validateImportRows(rows: CsvImportRow[]): CsvImportIssue[] {
  const issues: CsvImportIssue[] = [];
  for (const row of rows) {
    if (!row["種別"]) issues.push({ rowNumber: row.rowNumber, level:"error", field:"種別", value: row["種別"], message:"種別は必須です" });
    if (!row["機種名"]) issues.push({ rowNumber: row.rowNumber, level:"error", field:"機種名", value: row["機種名"], message:"機種名は必須です" });
    const qty = Number(row["台数"]);
    if (!row["台数"] || !Number.isInteger(qty) || qty < 1) issues.push({ rowNumber: row.rowNumber, level:"error", field:"台数", value: row["台数"], message:"台数は1以上で入力してください" });
    if (row["仕入単価"] && Number(row["仕入単価"]) < 0) issues.push({ rowNumber: row.rowNumber, level:"error", field:"仕入単価", value: row["仕入単価"], message:"仕入単価は0以上です" });
    if (row["販売予定単価"] && Number(row["販売予定単価"]) < 0) issues.push({ rowNumber: row.rowNumber, level:"error", field:"販売予定単価", value: row["販売予定単価"], message:"販売予定単価は0以上です" });
    if (row["種別"] && !TYPE_MAP[row["種別"]]) issues.push({ rowNumber: row.rowNumber, level:"error", field:"種別", value: row["種別"], message:"種別が不正です" });
    if (row["ステータス"] && !STATUS_MAP[row["ステータス"]]) issues.push({ rowNumber: row.rowNumber, level:"error", field:"ステータス", value: row["ステータス"], message:"ステータスが不正です" });
    if (!row["メーカー"]) issues.push({ rowNumber: row.rowNumber, level:"warning", field:"メーカー", value: row["メーカー"], message:"メーカー未設定として取り込みます" });
  }
  return issues;
}

export function buildTemplateCsv(): string {
  return `\uFEFF${INVENTORY_IMPORT_HEADERS.join(",")}\nパチンコ,SANKYO,eフィーバー〇〇,赤枠,3,本社倉庫,100000,150000,IN_STOCK,CSVインポートサンプル\n`;
}
export const computeCsvFileHash = (text: string): string => createHash("sha256").update(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text).digest("hex");

export async function importInventoryCsv(tx: Prisma.TransactionClient, params: { ownerUserId:string; rows: CsvImportRow[]; importBatchId:string; defaultStorageLocationId?: string | null;}) {
  let successRows = 0;
  let errorRows = 0;
  for (const row of params.rows) {
    try {
      const maker = row["メーカー"] ? await tx.maker.findFirst({ where: { name: row["メーカー"] } }) : null;
      const model = row["機種名"] ? await tx.machineModel.findFirst({ where: { name: row["機種名"] } }) : null;
      const location = row["保管場所"] ? await tx.storageLocation.findFirst({ where: { ownerUserId: params.ownerUserId, name: row["保管場所"], isActive: true } }) : null;
      const qty = Number(row["台数"]);
      const item = await tx.inventoryItem.create({ data: { ownerUserId: params.ownerUserId, makerId: maker?.id ?? null, machineModelId: model?.id ?? null, makerNameSnapshot: row["メーカー"] || null, modelNameSnapshot: row["機種名"], itemType: TYPE_MAP[row["種別"]], frameColor: row["枠色"] || null, ownershipType: InventoryOwnershipType.STOCK, inventoryStatus: STATUS_MAP[row["ステータス"]] ?? InventoryStatus.IN_STOCK, quantityOnHand: qty, storageLocationId: location?.id ?? params.defaultStorageLocationId ?? null, purchaseUnitPrice: row["仕入単価"] ? Number(row["仕入単価"]) : null, plannedSaleUnitPrice: row["販売予定単価"] ? Number(row["販売予定単価"]) : null, listingStatus: InventoryListingStatus.NOT_LISTED, note: row["メモ"] || null } });
      const dedupeKey = `csv-import-${params.importBatchId}-${row.rowNumber}`;
      await tx.inventoryMovement.upsert({ where: { dedupeKey }, update: {}, create: { ownerUserId: params.ownerUserId, inventoryItemId: item.id, movementType: InventoryMovementType.ADJUSTMENT, status: InventoryMovementStatus.COMMITTED, quantityDelta: qty, sourceType: "MANUAL", dedupeKey, note: "CSVインポート初期在庫", committedAt: new Date(), createdByUserId: params.ownerUserId } });
      await tx.inventoryImportRow.create({ data: { batchId: params.importBatchId, rowNumber: row.rowNumber, status: "IMPORTED", rawData: row, inventoryItemId: item.id } });
      successRows += 1;
    } catch (error) {
      await tx.inventoryImportRow.create({ data: { batchId: params.importBatchId, rowNumber: row.rowNumber, status: "FAILED", rawData: row, errorMessage: error instanceof Error ? error.message : "unknown error" } });
      errorRows += 1;
    }
  }
  return { successRows, errorRows };
}
