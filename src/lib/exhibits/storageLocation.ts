export type StorageLocationSnapshot = {
  id: string;
  name: string;
  address?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  addressLine?: string;
  handlingFeePerUnit?: number;
  shippingFeesByRegion?: unknown;
};

type StorageLocationSnapshotLike = Partial<StorageLocationSnapshot> & {
  address?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value : undefined;

const readNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

export const resolveStorageLocationSnapshot = (
  snapshot: unknown
): StorageLocationSnapshotLike | null => {
  if (!isRecord(snapshot)) return null;

  return {
    id: readString(snapshot.id),
    name: readString(snapshot.name),
    postalCode: readString(snapshot.postalCode),
    prefecture: readString(snapshot.prefecture),
    city: readString(snapshot.city),
    addressLine: readString(snapshot.addressLine),
    address: readString(snapshot.address),
    handlingFeePerUnit: readNumber(snapshot.handlingFeePerUnit),
    shippingFeesByRegion: snapshot.shippingFeesByRegion,
  };
};

export const formatStorageLocationAddress = (
  snapshot: unknown,
  fallback = ""
): string => {
  const resolved = resolveStorageLocationSnapshot(snapshot);
  if (!resolved) return fallback;

  if (resolved.address) {
    return resolved.address;
  }

  const address = [resolved.prefecture, resolved.city, resolved.addressLine]
    .filter(Boolean)
    .join("");
  const postal = resolved.postalCode ? `〒${resolved.postalCode}` : "";
  const combined = [postal, address].filter(Boolean).join(" ");

  return combined || fallback;
};

export const formatStorageLocationShort = (
  snapshot: unknown,
  fallback = "-"
): string => {
  const resolved = resolveStorageLocationSnapshot(snapshot);
  if (!resolved) return fallback;

  const area = [resolved.prefecture, resolved.city].filter(Boolean).join("");
  if (resolved.name && area) {
    return `${resolved.name}（${area}）`;
  }
  if (resolved.name) {
    return resolved.name;
  }

  if (resolved.address) {
    return resolved.address;
  }

  const address = [resolved.prefecture, resolved.city, resolved.addressLine]
    .filter(Boolean)
    .join("");
  if (address) {
    return address;
  }

  return fallback;
};

export const formatStorageLocationFull = (
  snapshot: unknown,
  fallback = "-"
): string => {
  const resolved = resolveStorageLocationSnapshot(snapshot);
  if (!resolved) return fallback;

  const address = formatStorageLocationAddress(snapshot, "");
  if (resolved.name && address) {
    return `${resolved.name} / ${address}`;
  }
  if (address) {
    return address;
  }
  if (resolved.name) {
    return resolved.name;
  }

  return fallback;
};

export const buildStorageLocationSnapshot = (
  location: StorageLocationSnapshot
): StorageLocationSnapshot => ({
  id: location.id,
  name: location.name,
  ...(location.address ? { address: location.address } : {}),
  ...(location.postalCode ? { postalCode: location.postalCode } : {}),
  ...(location.prefecture ? { prefecture: location.prefecture } : {}),
  ...(location.city ? { city: location.city } : {}),
  ...(location.addressLine ? { addressLine: location.addressLine } : {}),
  ...(location.handlingFeePerUnit !== undefined
    ? { handlingFeePerUnit: location.handlingFeePerUnit }
    : {}),
  ...(location.shippingFeesByRegion ? { shippingFeesByRegion: location.shippingFeesByRegion } : {}),
});
