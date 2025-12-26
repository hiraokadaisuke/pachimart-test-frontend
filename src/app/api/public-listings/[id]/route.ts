import { ListingStatus, RemovalStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  formatStorageLocationShort,
  resolveStorageLocationSnapshot,
  type StorageLocationSnapshot,
} from "@/lib/listings/storageLocation";
import { prisma } from "@/lib/server/prisma";

const listingClient = prisma.listing;

type StorageLocationSnapshotLike = Partial<StorageLocationSnapshot> & { address?: string };

const toSnapshotFromMachineStorageLocation = (location?: {
  id: string;
  name: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
  handlingFeePerUnit: number;
  shippingFeesByRegion: unknown;
} | null): StorageLocationSnapshotLike | null =>
  location
    ? {
        id: location.id,
        name: location.name,
        postalCode: location.postalCode,
        prefecture: location.prefecture,
        city: location.city,
        addressLine: location.addressLine,
        handlingFeePerUnit: location.handlingFeePerUnit,
        shippingFeesByRegion: location.shippingFeesByRegion,
      }
    : null;

const toDto = (listing: any) => ({
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
  storageLocation: String(listing.storageLocation),
  storageLocationId: (listing.storageLocationId as string | null) ?? null,
  storageLocationSnapshot: (listing.storageLocationSnapshot as unknown | null) ?? null,
  shippingFeeCount: Number(listing.shippingFeeCount),
  handlingFeeCount: Number(listing.handlingFeeCount),
  allowPartial: Boolean(listing.allowPartial),
  note: (listing.note as string | null) ?? null,
  createdAt: new Date(listing.createdAt).toISOString(),
  updatedAt: new Date(listing.updatedAt).toISOString(),
});

export async function GET(request: Request, { params }: { params: { id?: string } }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Listing id is required" }, { status: 400 });
    }

    const listing = await listingClient.findUnique({ where: { id } });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const isPublicListing =
      listing.status === ListingStatus.PUBLISHED || listing.status === ListingStatus.SOLD;

    if (!isPublicListing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const storageLocationSnapshot =
      resolveStorageLocationSnapshot(listing.storageLocationSnapshot) ??
      (listing.storageLocationId
        ? toSnapshotFromMachineStorageLocation(
            await prisma.machineStorageLocation.findFirst({ where: { id: listing.storageLocationId } })
          )
        : null);

    const storageLocation = formatStorageLocationShort(
      storageLocationSnapshot,
      String(listing.storageLocation ?? "")
    );

    return NextResponse.json(
      toDto({
        ...listing,
        storageLocationSnapshot,
        storageLocation,
      })
    );
  } catch (error) {
    console.error("Failed to fetch public listing", error);
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}
