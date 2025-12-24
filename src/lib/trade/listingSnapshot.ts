import {
  formatStorageLocationAddress,
  resolveStorageLocationSnapshot,
} from "@/lib/listings/storageLocation";

export type TradeStorageLocationSnapshot = {
  name: string;
  address: string;
  handlingFee: number;
  shippingFeesByRegion: unknown;
  id?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  addressLine?: string;
  handlingFeePerUnit?: number;
};

export type ListingSnapshot = {
  listingId: string;
  title: string;
  description: string | null;
  unitPriceExclTax: number | null;
  quantity: number;
  isNegotiable: boolean;
  allowPartialSale: boolean;
  storageLocationSnapshot: TradeStorageLocationSnapshot | null;
  shippingCount: number;
  handlingFeeCount: number;
  flags: {
    hasKugiSheet: boolean;
    hasManual: boolean;
    pickupAvailable: boolean;
  };
  createdAt: string;
  maker?: string | null;
  machineName?: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value : undefined;

const readNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const readBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

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
    (snapshot.shippingFeesByRegion as unknown) ?? legacy?.shippingFeesByRegion ?? null;

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

  return {
    listingId,
    title: machineName ?? listingId,
    description: note,
    unitPriceExclTax,
    quantity: Number(listing.quantity ?? 0),
    isNegotiable,
    allowPartialSale: Boolean(listing.allowPartial),
    storageLocationSnapshot,
    shippingCount: Number(listing.shippingFeeCount ?? 0),
    handlingFeeCount: Number(listing.handlingFeeCount ?? 0),
    flags: {
      hasKugiSheet: Boolean(listing.hasNailSheet),
      hasManual: Boolean(listing.hasManual),
      pickupAvailable: Boolean(listing.pickupAvailable),
    },
    createdAt: toIsoString(listing.createdAt),
    maker,
    machineName,
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

  return {
    listingId,
    title:
      readString(snapshot.title) ??
      readString(snapshot.machineName) ??
      readString(snapshot.kind) ??
      listingId,
    description: readString(snapshot.description) ?? readString(snapshot.note) ?? null,
    unitPriceExclTax:
      snapshot.unitPriceExclTax === null || snapshot.unitPriceExclTax === undefined
        ? null
        : (snapshot.unitPriceExclTax as number),
    quantity: readNumber(snapshot.quantity) ?? 0,
    isNegotiable: readBoolean(snapshot.isNegotiable) ?? false,
    allowPartialSale:
      readBoolean(snapshot.allowPartialSale) ?? readBoolean(snapshot.allowPartial) ?? false,
    storageLocationSnapshot,
    shippingCount:
      readNumber(snapshot.shippingCount) ?? readNumber(snapshot.shippingFeeCount) ?? 0,
    handlingFeeCount: readNumber(snapshot.handlingFeeCount) ?? 0,
    flags: {
      hasKugiSheet:
        readBoolean(flags.hasKugiSheet) ?? readBoolean(snapshot.hasNailSheet) ?? false,
      hasManual: readBoolean(flags.hasManual) ?? readBoolean(snapshot.hasManual) ?? false,
      pickupAvailable:
        readBoolean(flags.pickupAvailable) ?? readBoolean(snapshot.pickupAvailable) ?? false,
    },
    createdAt: readString(snapshot.createdAt) ?? "",
    maker: readString(snapshot.maker) ?? null,
    machineName: readString(snapshot.machineName) ?? null,
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
