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

const exhibitClient = prisma.listing;

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

const toDto = (exhibit: any) => ({
  id: String(exhibit.id),
  sellerUserId: String(exhibit.sellerUserId),
  status: exhibit.status as ListingStatus,
  isVisible: Boolean(exhibit.isVisible),
  type: String(exhibit.type),
  kind: String(exhibit.kind),
  maker: exhibit.maker as string | null,
  machineName: exhibit.machineName as string | null,
  quantity: Number(exhibit.quantity),
  unitPriceExclTax:
    exhibit.unitPriceExclTax === null || exhibit.unitPriceExclTax === undefined
      ? null
      : Number(exhibit.unitPriceExclTax),
  isNegotiable: Boolean(exhibit.isNegotiable),
  removalStatus: exhibit.removalStatus as RemovalStatus,
  removalDate: exhibit.removalDate ? new Date(exhibit.removalDate as string).toISOString() : null,
  hasNailSheet: Boolean(exhibit.hasNailSheet),
  hasManual: Boolean(exhibit.hasManual),
  pickupAvailable: Boolean(exhibit.pickupAvailable),
  storageLocation:
    typeof exhibit.storageLocation === "string" ? exhibit.storageLocation : null,
  storageLocationId:
    typeof exhibit.storageLocationId === "string" ? exhibit.storageLocationId : null,
  storageLocationSnapshot: (exhibit.storageLocationSnapshot as unknown | null) ?? null,
  shippingFeeCount: Number(exhibit.shippingFeeCount),
  handlingFeeCount: Number(exhibit.handlingFeeCount),
  allowPartial: Boolean(exhibit.allowPartial),
  note: (exhibit.note as string | null) ?? null,
  createdAt: new Date(exhibit.createdAt).toISOString(),
  updatedAt: new Date(exhibit.updatedAt).toISOString(),
});

export async function GET(request: Request, { params }: { params: { id?: string } }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Listing id is required" }, { status: 400 });
    }

    const exhibit = await exhibitClient.findUnique({
      where: { id },
      include: { storageLocationRecord: true },
    });

    if (!exhibit) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const storageLocationSnapshot =
      resolveStorageLocationSnapshot(exhibit.storageLocationSnapshot) ??
      toSnapshotFromStorageLocation(exhibit.storageLocationRecord);

    const storageLocation = formatStorageLocationShort(
      storageLocationSnapshot,
      typeof exhibit.storageLocation === "string" ? exhibit.storageLocation : undefined
    );

    return NextResponse.json(
      toDto({
        ...exhibit,
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
    const exhibit = await exhibitClient.findUnique({ where: { id } });
    if (!exhibit) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (String(exhibit.sellerUserId) !== sellerUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await exhibitClient.update({
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
