import { Prisma } from "@prisma/client";

import {
  formatStorageLocationAddress,
  resolveStorageLocationSnapshot,
} from "@/lib/listings/storageLocation";

export type TradeStorageLocationSnapshot = Prisma.JsonObject & {
  name: string;
  address: string;
  handlingFee: number;
  shippingFeesByRegion: Prisma.JsonValue | null;
  id?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  addressLine?: string;
  handlingFeePerUnit?: number;
};

export type ListingSnapshot = Prisma.JsonObject & {
  listingId: string;
  status: string | null;
  isVisible: boolean;
  kind: string;
  maker: string | null;
  machineName: string | null;
  title: string;
  description: string | null;
  unitPriceExclTax: number | null;
  quantity: number;
  isNegotiable: boolean;
  removalStatus: string | null;
  removalDate: string | null;
  hasNailSheet: boolean;
  hasManual: boolean;
  pickupAvailable: boolean;
  storageLocation: string | null;
  storageLocationId: string | null;
  allowPartialSale: boolean;
  allowPartial: boolean;
  storageLocationSnapshot: TradeStorageLocationSnapshot | null;
  shippingCount: number;
  shippingFeeCount: number;
  handlingFeeCount: number;
  flags: Prisma.JsonObject & {
    hasKugiSheet: boolean;
    hasManual: boolean;
    pickupAvailable: boolean;
  };
  createdAt: string;
  updatedAt: string;
  note?: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value : undefined;

const readNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const readBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const readNullableString = (value: unknown): string | null | undefined =>
  value === null ? null : readString(value);

const toIsoString = (value: unknown): string => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return new Date().toISOString();
};

const toIsoStringOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  return toIsoString(value);
};

const resolveTradeStorageLocationSnapshot = (
  snapshot: unknown,
  fallbackName?: string
): TradeStorageLocationSnapshot | null => {
  if (!isRecord(snapshot)) {
    if (fallbackName) {
      return {
        name: fallbackName,
        address: fallbackName,
        handlingFee: 0,
        shippingFeesByRegion: null,
      };
    }
    return null;
  }

  const legacy = resolveStorageLocationSnapshot(snapshot);
  const name =
    readString(snapshot.name) ?? legacy?.name ?? (fallbackName ? fallbackName : undefined);
  const address =
    readString(snapshot.address) ??
    (legacy ? formatStorageLocationAddress(snapshot, "") : undefined) ??
    (fallbackName ? fallbackName : undefined);
  const handlingFee =
    readNumber(snapshot.handlingFee) ??
    (legacy?.handlingFeePerUnit !== undefined ? legacy.handlingFeePerUnit : undefined) ??
    0;
  const shippingFeesByRegion =
    (snapshot.shippingFeesByRegion as Prisma.JsonValue | undefined) ??
    (legacy?.shippingFeesByRegion as Prisma.JsonValue | undefined) ??
    null;

  if (!name && !address) return null;

  const resolved: TradeStorageLocationSnapshot = {
    name: name ?? address ?? "",
    address: address ?? name ?? "",
    handlingFee,
    shippingFeesByRegion,
  };

  if (readString(snapshot.id)) resolved.id = readString(snapshot.id);
  if (readString(snapshot.postalCode)) resolved.postalCode = readString(snapshot.postalCode);
  if (readString(snapshot.prefecture)) resolved.prefecture = readString(snapshot.prefecture);
  if (readString(snapshot.city)) resolved.city = readString(snapshot.city);
  if (readString(snapshot.addressLine)) resolved.addressLine = readString(snapshot.addressLine);
  if (readNumber(snapshot.handlingFeePerUnit) !== undefined) {
    resolved.handlingFeePerUnit = readNumber(snapshot.handlingFeePerUnit);
  }

  return resolved;
};

export const buildListingSnapshot = (listing: Record<string, unknown>): ListingSnapshot => {
  const listingId = readString(listing.id) ?? "";
  const kind = readString(listing.kind) ?? listingId;
  const machineName = (listing.machineName as string | null | undefined) ?? null;
  const maker = (listing.maker as string | null | undefined) ?? null;
  const note = (listing.note as string | null | undefined) ?? null;
  const isNegotiable = Boolean(listing.isNegotiable);
  const unitPriceRaw = listing.unitPriceExclTax as number | null | undefined;
  const unitPriceExclTax = isNegotiable
    ? null
    : unitPriceRaw === null || unitPriceRaw === undefined
      ? null
      : Number(unitPriceRaw);

  const storageLocation = readString(listing.storageLocation);
  const storageLocationSnapshot = resolveTradeStorageLocationSnapshot(
    listing.storageLocationSnapshot,
    storageLocation
  );

  const createdAt = toIsoString(listing.createdAt);
  const updatedAt = toIsoString(listing.updatedAt ?? listing.createdAt);

  return {
    listingId,
    status: readString(listing.status) ?? null,
    isVisible: Boolean(listing.isVisible),
    kind,
    maker,
    machineName,
    title: machineName ?? kind,
    description: note,
    unitPriceExclTax,
    quantity: Number(listing.quantity ?? 0),
    isNegotiable,
    removalStatus: readString(listing.removalStatus) ?? null,
    removalDate: toIsoStringOrNull(listing.removalDate),
    hasNailSheet: Boolean(listing.hasNailSheet),
    hasManual: Boolean(listing.hasManual),
    pickupAvailable: Boolean(listing.pickupAvailable),
    storageLocation: storageLocation ?? null,
    storageLocationId: readString(listing.storageLocationId) ?? null,
    allowPartialSale: Boolean(listing.allowPartial),
    allowPartial: Boolean(listing.allowPartial),
    storageLocationSnapshot,
    shippingCount: Number(listing.shippingFeeCount ?? 0),
    shippingFeeCount: Number(listing.shippingFeeCount ?? 0),
    handlingFeeCount: Number(listing.handlingFeeCount ?? 0),
    flags: {
      hasKugiSheet: Boolean(listing.hasNailSheet),
      hasManual: Boolean(listing.hasManual),
      pickupAvailable: Boolean(listing.pickupAvailable),
    },
    createdAt,
    updatedAt,
    note,
  };
};

export const resolveListingSnapshot = (snapshot: unknown): ListingSnapshot | null => {
  if (!isRecord(snapshot)) return null;

  const listingId = readString(snapshot.listingId) ?? readString(snapshot.id);
  if (!listingId) return null;

  const flags = isRecord(snapshot.flags) ? snapshot.flags : {};
  const storageLocationSnapshot = resolveTradeStorageLocationSnapshot(
    snapshot.storageLocationSnapshot,
    readString(snapshot.storageLocation)
  );

  const createdAt = readString(snapshot.createdAt) ?? "";
  const updatedAt = readString(snapshot.updatedAt) ?? createdAt;
  const shippingFeeCount =
    readNumber(snapshot.shippingFeeCount) ?? readNumber(snapshot.shippingCount) ?? 0;
  const allowPartial =
    readBoolean(snapshot.allowPartial) ?? readBoolean(snapshot.allowPartialSale) ?? false;

  return {
    listingId,
    status: readString(snapshot.status) ?? null,
    isVisible: readBoolean(snapshot.isVisible) ?? true,
    kind: readString(snapshot.kind) ?? listingId,
    maker: readString(snapshot.maker) ?? null,
    machineName: readString(snapshot.machineName) ?? null,
    title:
      readString(snapshot.title) ??
      readString(snapshot.machineName) ??
      readString(snapshot.kind) ??
      listingId,
    description: readString(snapshot.description) ?? readNullableString(snapshot.note) ?? null,
    unitPriceExclTax:
      snapshot.unitPriceExclTax === null || snapshot.unitPriceExclTax === undefined
        ? null
        : (snapshot.unitPriceExclTax as number),
    quantity: readNumber(snapshot.quantity) ?? 0,
    isNegotiable: readBoolean(snapshot.isNegotiable) ?? false,
    removalStatus: readString(snapshot.removalStatus) ?? null,
    removalDate: toIsoStringOrNull(snapshot.removalDate),
    hasNailSheet:
      readBoolean(snapshot.hasNailSheet) ?? readBoolean(flags.hasKugiSheet) ?? false,
    hasManual: readBoolean(snapshot.hasManual) ?? readBoolean(flags.hasManual) ?? false,
    pickupAvailable:
      readBoolean(snapshot.pickupAvailable) ?? readBoolean(flags.pickupAvailable) ?? false,
    storageLocation: readString(snapshot.storageLocation) ?? null,
    storageLocationId: readString(snapshot.storageLocationId) ?? null,
    allowPartialSale: allowPartial,
    allowPartial,
    storageLocationSnapshot,
    shippingCount: shippingFeeCount,
    shippingFeeCount,
    handlingFeeCount: readNumber(snapshot.handlingFeeCount) ?? 0,
    flags: {
      hasKugiSheet:
        readBoolean(flags.hasKugiSheet) ?? readBoolean(snapshot.hasNailSheet) ?? false,
      hasManual: readBoolean(flags.hasManual) ?? readBoolean(snapshot.hasManual) ?? false,
      pickupAvailable:
        readBoolean(flags.pickupAvailable) ?? readBoolean(snapshot.pickupAvailable) ?? false,
    },
    note: readNullableString(snapshot.note) ?? readNullableString(snapshot.description) ?? null,
    createdAt,
    updatedAt,
  };
};

export const formatListingStorageLocation = (snapshot: ListingSnapshot | null): string | undefined => {
  if (!snapshot?.storageLocationSnapshot) return undefined;
  const { name, address } = snapshot.storageLocationSnapshot;
  if (name && address && name !== address) {
    return `${name} ${address}`;
  }
  return name || address || undefined;
};
