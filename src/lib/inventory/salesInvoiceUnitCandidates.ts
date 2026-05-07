import type { InventoryRecord } from "@/lib/demo-data/demoInventory";

export type SalesInvoiceUnitCandidate = {
  inventoryUnitId: string | null;
  inventoryItemId: string | null;
  inventoryRecordId?: string | null;
  displayCode?: string | null;
  rawQr?: string | null;
  codeType?: string | null;
  status?: string | null;
  makerName: string;
  machineName: string;
  itemType: string;
  frameColor: string | null;
  storageLocationName: string | null;
  purchaseUnitPrice: number | null;
  estimatedSalesUnitPrice: number | null;
  memo?: string | null;
  bodySerialNumber?: string | null;
  frameSerialNumber?: string | null;
  mainBoardSerialNumber?: string | null;
  operationCheckStatus?: string | null;
  glassStatus?: string | null;
  nailSheetStatus?: string | null;
  inspectionStatus?: string | null;
  isSelectable: boolean;
  warning?: string | null;
  inboundScheduleId?: string | null;
  outboundScheduleId?: string | null;
};

const RESERVED_STATUSES = new Set(["RESERVED", "確保", "引当", "予約"]);
const UNSELECTABLE_STATUSES = new Set(["SHIPPED", "CANCELED", "売却済", "キャンセル"]);

const resolveStatus = (record: InventoryRecord): string => {
  const raw = String(record.stockStatus ?? record.status ?? "").trim();
  if (raw === "売却済") return "SHIPPED";
  if (raw === "出品中" || raw === "倉庫") return "IN_STOCK";
  return raw || "UNKNOWN";
};

export const buildSalesInvoiceUnitCandidates = (records: InventoryRecord[], ownerUserId?: string | null): SalesInvoiceUnitCandidate[] =>
  records
    .filter((record) => !ownerUserId || !record.customFields?.ownerUserId || record.customFields.ownerUserId === ownerUserId)
    .map((record: InventoryRecord) => ({
    inventoryUnitId: `${record.id}-unit-1`,
    inventoryItemId: record.id,
    inventoryRecordId: record.id,
    displayCode: record.id,
    rawQr: null,
    codeType: "DISPLAY_CODE",
    status: resolveStatus(record),
    makerName: record.maker ?? "",
    machineName: record.model ?? record.machineName ?? "",
    itemType: record.type ?? record.deviceType ?? "",
    frameColor: null,
    storageLocationName: record.storageLocation ?? null,
    purchaseUnitPrice: record.unitPrice ?? null,
    estimatedSalesUnitPrice: record.saleUnitPrice ?? record.unitPrice ?? null,
    memo: record.note ?? record.notes ?? null,
    bodySerialNumber: null,
    frameSerialNumber: null,
    mainBoardSerialNumber: null,
    operationCheckStatus: null,
    glassStatus: null,
    nailSheetStatus: null,
    inspectionStatus: null,
    isSelectable: !UNSELECTABLE_STATUSES.has(resolveStatus(record)),
    warning: RESERVED_STATUSES.has(resolveStatus(record)) ? "引当済み在庫です。重複販売に注意してください。" : null,
    inboundScheduleId: null,
    outboundScheduleId: null,
  }));
