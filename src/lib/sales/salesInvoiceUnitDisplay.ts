import type { SalesInvoiceItem } from "@/types/salesInvoices";

export type SalesInvoiceUnitDisplay = {
  primaryCode: string | null;
  rawQrLabel: string | null;
  statusLabel: string | null;
  storageLocationLabel: string | null;
  memoLabel: string | null;
  warningLabel: string | null;
};

const toClean = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const getUnitPrimaryCode = (item: SalesInvoiceItem): string | null => {
  return toClean(item.unitDisplayCode) ?? toClean(item.inventoryUnitId) ?? null;
};

export const buildSalesInvoiceUnitDisplay = (item: SalesInvoiceItem): SalesInvoiceUnitDisplay => {
  const primaryCode = getUnitPrimaryCode(item);
  const rawQr = toClean(item.unitRawQr);
  const status = toClean(item.unitStatus);
  const storage = toClean(item.storageLocationName);
  const memo = toClean(item.unitMemo);

  return {
    primaryCode,
    rawQrLabel: rawQr ? `QR: ${rawQr}` : null,
    statusLabel: status ? `状態: ${status}` : null,
    storageLocationLabel: storage ? `保管先: ${storage}` : null,
    memoLabel: memo ? `Unitメモ: ${memo}` : null,
    warningLabel: !primaryCode && rawQr ? "番号未選択（QRのみ）" : null,
  };
};

export const formatSalesInvoiceUnitSummary = (item: SalesInvoiceItem): string => {
  const display = buildSalesInvoiceUnitDisplay(item);
  const labels = [
    display.primaryCode ? `Unit: ${display.primaryCode}` : null,
    display.rawQrLabel,
    display.storageLocationLabel,
    display.statusLabel,
    display.memoLabel,
  ].filter((value): value is string => Boolean(value));

  return labels.join(" / ");
};

export const buildSalesInvoiceSupplementNote = (item: SalesInvoiceItem): string => {
  const baseNote = toClean(item.note);
  const display = buildSalesInvoiceUnitDisplay(item);
  const unitLines = [display.rawQrLabel, display.storageLocationLabel, display.statusLabel, display.memoLabel].filter(
    (value): value is string => Boolean(value),
  );
  if (unitLines.length === 0) return baseNote ?? "";
  if (!baseNote) return unitLines.join(" / ");
  return `${baseNote} / ${unitLines.join(" / ")}`;
};
