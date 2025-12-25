import { ListingStatus, RemovalStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import {
  buildStorageLocationSnapshot,
  formatStorageLocationShort,
  type StorageLocationSnapshot,
} from "@/lib/listings/storageLocation";

const listingClient = prisma.listing;

const updateListingSchema = z.object({
  status: z.nativeEnum(ListingStatus).optional(),
  isVisible: z.boolean().optional(),
  note: z.string().optional().nullable(),
});

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

export async function GET(_request: Request, { params }: { params: { id?: string } }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Listing id is required" }, { status: 400 });
    }

    const listing = await listingClient.findUnique({ where: { id } });

    const isPublicListing =
      listing?.status === ListingStatus.PUBLISHED || listing?.status === ListingStatus.SOLD;

    if (!listing || !isPublicListing || !listing.isVisible) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    let storageLocationSnapshot = listing.storageLocationSnapshot as StorageLocationSnapshot | null;
    let storageLocation = String(listing.storageLocation ?? "");

    if (!storageLocationSnapshot && listing.storageLocationId) {
      const location = await prisma.machineStorageLocation.findUnique({
        where: { id: String(listing.storageLocationId) },
      });

      if (location) {
        storageLocationSnapshot = buildStorageLocationSnapshot({
          id: String(location.id),
          name: String(location.name),
          postalCode: String(location.postalCode),
          prefecture: String(location.prefecture),
          city: String(location.city),
          addressLine: String(location.addressLine),
          handlingFeePerUnit: Number(location.handlingFeePerUnit),
          shippingFeesByRegion: location.shippingFeesByRegion,
        });
      }
    }

    storageLocation = formatStorageLocationShort(storageLocationSnapshot, storageLocation);

    return NextResponse.json(
      toDto({
        ...listing,
        storageLocationSnapshot,
        storageLocation,
      })
    );
  } catch (error) {
    console.error("Failed to fetch listing", error);
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id?: string } }) {
  const id = params?.id;

  if (!id) {
    return NextResponse.json({ error: "Listing id is required" }, { status: 400 });
  }

  const sellerUserId = request.headers.get("x-dev-user-id");
  if (!sellerUserId) {
    return NextResponse.json({ error: "Missing seller user id" }, { status: 400 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = updateListingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", detail: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const listing = await listingClient.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (String(listing.sellerUserId) !== sellerUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await listingClient.update({
      where: { id },
      data: {
        status: parsed.data.status,
        isVisible: parsed.data.isVisible,
        note: parsed.data.note ?? undefined,
      } as any,
    });

    return NextResponse.json(toDto(updated));
  } catch (error) {
    console.error("Failed to update listing", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}
