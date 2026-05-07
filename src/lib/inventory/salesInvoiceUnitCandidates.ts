import type { InventoryRecord } from "@/lib/demo-data/demoInventory";

export type SalesInvoiceUnitCandidate = {
  inventoryUnitId: string;
  inventoryItemId: string;
  displayCode: string;
  rawQr: string | null;
  codeType: string;
  status: "IN_STOCK" | "RESERVED";
  makerName: string;
  machineName: string;
  itemType: string;
  frameColor: string | null;
  storageLocationName: string | null;
  purchaseUnitPrice: number | null;
  estimatedSalesUnitPrice: number | null;
  memo: string | null;
  inboundScheduleId: string | null;
  outboundScheduleId: string | null;
};

export const buildSalesInvoiceUnitCandidates = (records: InventoryRecord[]): SalesInvoiceUnitCandidate[] =>
  records.map((record: InventoryRecord) => ({
    inventoryUnitId: `${record.id}-unit-1`,
    inventoryItemId: record.id,
    displayCode: record.id,
    rawQr: null,
    codeType: "UNKNOWN",
    status: "IN_STOCK",
    makerName: record.maker ?? "",
    machineName: record.model ?? record.machineName ?? "",
    itemType: record.type ?? record.deviceType ?? "",
    frameColor: null,
    storageLocationName: record.storageLocation ?? null,
    purchaseUnitPrice: record.unitPrice ?? null,
    estimatedSalesUnitPrice: record.saleUnitPrice ?? record.unitPrice ?? null,
    memo: record.note ?? record.notes ?? null,
    inboundScheduleId: null,
    outboundScheduleId: null,
  }));
