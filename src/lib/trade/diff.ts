import { formatYen } from "@/lib/dealings/calcTotals";
import { formatListingStorageLocation, type ListingSnapshot } from "./listingSnapshot";
import { type TradeRecord } from "./types";

export type TradeDiffNotes = {
  unitPriceNote?: string;
  quantityNote?: string;
  storageNote?: string;
  shippingCountNote?: string;
  handlingCountNote?: string;
};

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value !== "number") return null;
  return Number.isFinite(value) ? value : null;
};

const formatCountNote = (count: number) => `（出品時：${count}回）`;

const hasAmountForCategory = (items: TradeRecord["items"] | undefined, labels: string[]): boolean => {
  if (!items?.length) return false;
  return items.some((item) => {
    const normalizedLabel = item.category ?? item.itemName ?? "";
    return labels.includes(normalizedLabel) && (item.amount ?? item.unitPrice ?? 0) !== 0;
  });
};

export const buildTradeDiffNotes = (
  confirmed: TradeRecord | null,
  snapshot: ListingSnapshot | null
): TradeDiffNotes => {
  if (!snapshot) return {};

  const primaryItem = confirmed?.items?.[0];
  const confirmedUnitPrice = toNumberOrNull(primaryItem?.unitPrice);
  const confirmedQuantity =
    toNumberOrNull(confirmed?.quantity) ?? toNumberOrNull(primaryItem?.qty) ?? null;
  const confirmedLocation = confirmed?.storageLocationName?.trim();
  const confirmedShippingCount = hasAmountForCategory(confirmed?.items, ["送料"]) ? 1 : 0;
  const confirmedHandlingCount = hasAmountForCategory(confirmed?.items, ["手数料", "出庫手数料"]) ? 1 : 0;

  const notes: TradeDiffNotes = {};

  const snapshotUnitPrice = snapshot.unitPriceExclTax;
  if (snapshotUnitPrice === null) {
    if (confirmedUnitPrice !== null && confirmedUnitPrice !== undefined) {
      notes.unitPriceNote = "（出品時：応相談）";
    }
  } else if (confirmedUnitPrice === null || confirmedUnitPrice === undefined) {
    notes.unitPriceNote = `（出品時：${formatYen(snapshotUnitPrice)}）`;
  } else if (Math.round(snapshotUnitPrice) !== Math.round(confirmedUnitPrice)) {
    notes.unitPriceNote = `（出品時：${formatYen(snapshotUnitPrice)}）`;
  }

  if (snapshot.quantity && (!confirmedQuantity || snapshot.quantity !== confirmedQuantity)) {
    notes.quantityNote = `（出品時：${snapshot.quantity}台）`;
  }

  const snapshotLocation = formatListingStorageLocation(snapshot);
  if (
    snapshotLocation &&
    (!confirmedLocation || snapshotLocation.trim() !== confirmedLocation.trim())
  ) {
    notes.storageNote = `（出品時：${snapshotLocation}）`;
  }

  if (
    snapshot.shippingCount &&
    snapshot.shippingCount > 0 &&
    snapshot.shippingCount !== confirmedShippingCount
  ) {
    notes.shippingCountNote = formatCountNote(snapshot.shippingCount);
  }

  if (
    snapshot.handlingFeeCount &&
    snapshot.handlingFeeCount > 0 &&
    snapshot.handlingFeeCount !== confirmedHandlingCount
  ) {
    notes.handlingCountNote = formatCountNote(snapshot.handlingFeeCount);
  }

  return notes;
};
