import type { InventoryRecord, ListingStatusOption } from "@/lib/demo-data/demoInventory";
import type { InventoryStatusOption } from "@/types/purchaseInvoices";

export const PUBLISH_OPTIONS: Array<{ value: ListingStatusOption; label: string }> = [
  { value: "listing", label: "中" },
  { value: "not_listing", label: "未" },
];

export const resolveListingStatus = (record: InventoryRecord): ListingStatusOption => {
  if (record.listingStatus) return record.listingStatus;
  const status = (record.status ?? record.stockStatus ?? "倉庫") as InventoryStatusOption;
  if (status === "売却済") return "sold";
  if (status === "出品中") return "listing";
  return "not_listing";
};

export const resolvePublishStatus = (record: InventoryRecord): ListingStatusOption =>
  resolveListingStatus(record) === "listing" ? "listing" : "not_listing";

export const mapListingStatusToStockStatus = (status: ListingStatusOption): InventoryStatusOption => {
  if (status === "sold") return "売却済";
  if (status === "listing") return "出品中";
  return "倉庫";
};

export const buildEditForm = (record: InventoryRecord): Partial<InventoryRecord> => ({
  maker: record.maker ?? "",
  model: record.model ?? record.machineName ?? "",
  kind: record.kind,
  type: record.type ?? record.deviceType ?? "",
  quantity: record.quantity ?? 0,
  unitPrice: record.unitPrice ?? 0,
  saleUnitPrice: record.saleUnitPrice ?? 0,
  hasRemainingDebt: record.hasRemainingDebt ?? false,
  stockInDate: record.stockInDate ?? record.arrivalDate ?? "",
  removeDate: record.removeDate ?? record.removalDate ?? "",
  warehouse: record.warehouse ?? record.storageLocation ?? "",
  supplier: record.supplier ?? "",
  staff: record.staff ?? record.buyerStaff ?? "",
  listingStatus: resolvePublishStatus(record),
  note: record.note ?? record.notes ?? "",
  isVisible: record.isVisible ?? true,
  isConsignment: record.isConsignment ?? record.consignment ?? false,
  taxType: record.taxType ?? "exclusive",
  pattern: record.pattern ?? "",
});

export const buildPayload = (form: Partial<InventoryRecord>): Partial<InventoryRecord> => ({
  maker: form.maker?.trim() || undefined,
  model: form.model?.trim() || undefined,
  machineName: form.model?.trim() || undefined,
  kind: form.kind ?? undefined,
  type: form.type ?? undefined,
  quantity: typeof form.quantity === "number" ? form.quantity : Number(form.quantity ?? 0),
  unitPrice: typeof form.unitPrice === "number" ? form.unitPrice : Number(form.unitPrice ?? 0),
  saleUnitPrice:
    typeof form.saleUnitPrice === "number" ? form.saleUnitPrice : Number(form.saleUnitPrice ?? 0),
  stockInDate: form.stockInDate || undefined,
  arrivalDate: form.stockInDate || undefined,
  removeDate: form.removeDate || undefined,
  removalDate: form.removeDate || undefined,
  pattern: form.pattern?.trim() || undefined,
  warehouse: form.warehouse?.trim() || undefined,
  storageLocation: form.warehouse?.trim() || undefined,
  supplier: form.supplier?.trim() || undefined,
  staff: form.staff?.trim() || undefined,
  buyerStaff: form.staff?.trim() || undefined,
  listingStatus: form.listingStatus,
  status: mapListingStatusToStockStatus(form.listingStatus ?? "not_listing"),
  stockStatus: mapListingStatusToStockStatus(form.listingStatus ?? "not_listing"),
  note: form.note?.trim() || undefined,
  notes: form.note?.trim() || undefined,
  isVisible: form.isVisible ?? true,
  hasRemainingDebt: form.hasRemainingDebt ?? false,
  isConsignment: form.isConsignment ?? false,
  consignment: form.isConsignment ?? false,
  taxType: form.taxType ?? "exclusive",
});
