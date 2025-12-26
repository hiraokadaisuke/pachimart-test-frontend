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
  storageLocationId: String(listing.storageLocationId),
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

    const listing = await listingClient.findUnique({
      where: { id },
      include: { storageLocationRecord: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const storageLocationSnapshot =
      resolveStorageLocationSnapshot(listing.storageLocationSnapshot) ??
      toSnapshotFromStorageLocation(listing.storageLocationRecord);

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
