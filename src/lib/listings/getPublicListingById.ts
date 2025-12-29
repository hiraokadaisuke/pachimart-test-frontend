import { ListingStatus, RemovalStatus } from "@prisma/client";

import {
  formatStorageLocationShort,
  resolveStorageLocationSnapshot,
  type StorageLocationSnapshot,
} from "@/lib/listings/storageLocation";
import type { Listing } from "@/lib/listings/types";
import { prisma } from "@/lib/server/prisma";

type StorageLocationSnapshotLike = Partial<StorageLocationSnapshot> & { address?: string };

const toSnapshotFromStorageLocation = (location?: {
  id: string;
  name: string;
  address?: string | null;
  postalCode?: string | null;
  prefecture?: string | null;
  city?: string | null;
  addressLine?: string | null;
  handlingFeePerUnit?: number | null;
  shippingFeesByRegion?: unknown | null;
} | null): StorageLocationSnapshotLike | null =>
  location
    ? {
        id: location.id,
        name: location.name,
        address: location.address ?? undefined,
        postalCode: location.postalCode ?? undefined,
        prefecture: location.prefecture ?? undefined,
        city: location.city ?? undefined,
        addressLine: location.addressLine ?? undefined,
        handlingFeePerUnit: location.handlingFeePerUnit ?? undefined,
        shippingFeesByRegion: location.shippingFeesByRegion ?? undefined,
      }
    : null;

const toDto = (listing: any): Listing => ({
  id: String(listing.id),
  sellerUserId: String(listing.sellerUserId),
  status: listing.status as ListingStatus,
  isVisible: Boolean(listing.isVisible),
  kind: String(listing.kind),
  maker: listing.maker as string | null,
  machineName: listing.machineName as string | null,
  quantity: Number(listing.quantity),
  unitPriceExclTax:
    listing.unitPriceExclTax === null || listing.unitPriceExclTax === undefined
      ? null
      : Number(listing.unitPriceExclTax),
  isNegotiable: Boolean(listing.isNegotiable),
  removalStatus: listing.removalStatus as RemovalStatus,
  removalDate: listing.removalDate ? new Date(listing.removalDate as string).toISOString() : null,
  hasNailSheet: Boolean(listing.hasNailSheet),
  hasManual: Boolean(listing.hasManual),
  pickupAvailable: Boolean(listing.pickupAvailable),
  storageLocation: typeof listing.storageLocation === "string" ? listing.storageLocation : null,
  storageLocationId: typeof listing.storageLocationId === "string" ? listing.storageLocationId : null,
  storageLocationSnapshot: (listing.storageLocationSnapshot as unknown | null) ?? null,
  shippingFeeCount: Number(listing.shippingFeeCount),
  handlingFeeCount: Number(listing.handlingFeeCount),
  allowPartial: Boolean(listing.allowPartial),
  note: (listing.note as string | null) ?? null,
  createdAt: new Date(listing.createdAt).toISOString(),
  updatedAt: new Date(listing.updatedAt).toISOString(),
});

export const getPublicListingById = async (listingId: string): Promise<Listing | null> => {
  const listing = await prisma.listing.findFirst({
    where: {
      id: listingId,
      status: ListingStatus.PUBLISHED,
      isVisible: true,
    },
  });

  if (!listing) {
    return null;
  }

  const storageLocationRecord = listing.storageLocationId
    ? await prisma.storageLocation.findUnique({
        where: { id: listing.storageLocationId },
      })
    : null;

  const storageLocationSnapshot =
    resolveStorageLocationSnapshot(listing.storageLocationSnapshot) ??
    toSnapshotFromStorageLocation(storageLocationRecord);

  const storageLocation = formatStorageLocationShort(
    storageLocationSnapshot,
    typeof listing.storageLocation === "string" ? listing.storageLocation : undefined
  );

  return toDto({
    ...listing,
    storageLocationSnapshot,
    storageLocation,
  });
};
