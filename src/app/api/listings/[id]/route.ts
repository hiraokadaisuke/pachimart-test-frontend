import { ListingStatus, RemovalStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { getCurrentUserId } from "@/lib/server/currentUser";
import {
  formatStorageLocationShort,
  resolveStorageLocationSnapshot,
  type StorageLocationSnapshot,
} from "@/lib/listings/storageLocation";

const listingClient = prisma.listing;

const updateListingSchema = z.object({
  status: z.nativeEnum(ListingStatus).optional(),
  isVisible: z.boolean().optional(),
  note: z.string().optional().nullable(),
});

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
  type: String(listing.type),
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
  storageLocation:
    typeof listing.storageLocation === "string" ? listing.storageLocation : null,
  storageLocationId:
    typeof listing.storageLocationId === "string" ? listing.storageLocationId : null,
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
      typeof listing.storageLocation === "string" ? listing.storageLocation : undefined
    );

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

  const sellerUserId = getCurrentUserId(request);
  if (!sellerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
