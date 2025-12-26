import { ListingStatus, Prisma, RemovalStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { getCurrentUserId } from "@/lib/server/currentUser";
import {
  formatStorageLocationShort,
  resolveStorageLocationSnapshot,
  type StorageLocationSnapshot,
} from "@/lib/listings/storageLocation";

type ListingRecord = {
  id: string;
  sellerUserId: string;
  status: ListingStatus;
  isVisible: boolean;
  kind: string;
  maker: string | null;
  machineName: string | null;
  quantity: number;
  unitPriceExclTax: number | null;
  isNegotiable: boolean;
  removalStatus: RemovalStatus;
  removalDate: Date | null;
  hasNailSheet: boolean;
  hasManual: boolean;
  pickupAvailable: boolean;
  storageLocation: string;
  storageLocationId: string | null;
  storageLocationSnapshot: unknown | null;
  shippingFeeCount: number;
  handlingFeeCount: number;
  allowPartial: boolean;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ListingDto = {
  id: string;
  sellerUserId: string;
  status: ListingStatus;
  isVisible: boolean;
  kind: string;
  maker: string | null;
  machineName: string | null;
  quantity: number;
  unitPriceExclTax: number | null;
  isNegotiable: boolean;
  removalStatus: RemovalStatus;
  removalDate: string | null;
  hasNailSheet: boolean;
  hasManual: boolean;
  pickupAvailable: boolean;
  storageLocation: string;
  storageLocationId: string | null;
  storageLocationSnapshot: unknown | null;
  shippingFeeCount: number;
  handlingFeeCount: number;
  allowPartial: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

const listingClient = prisma.listing;

const createListingSchema = z
  .object({
    kind: z.string().min(1, "kind is required"),
    maker: z.string().trim().min(1).optional().nullable(),
    machineName: z.string().trim().min(1).optional().nullable(),
    quantity: z.number().int().positive("quantity must be a positive integer"),
    unitPriceExclTax: z.number().int().nonnegative().optional().nullable(),
    isNegotiable: z.boolean().default(false),
    storageLocation: z.string().optional().nullable(),
    storageLocationId: z.string().min(1, "storageLocationId is required"),
    storageLocationSnapshot: z.unknown().optional().nullable(),
    shippingFeeCount: z.number().int().nonnegative(),
    handlingFeeCount: z.number().int().nonnegative(),
    allowPartial: z.boolean(),
    note: z.string().optional().nullable(),
    removalStatus: z.nativeEnum(RemovalStatus).optional().default(RemovalStatus.SCHEDULED),
    removalDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "removalDate must be in YYYY-MM-DD format")
      .optional()
      .nullable(),
    hasNailSheet: z.boolean().optional(),
    hasManual: z.boolean().optional(),
    pickupAvailable: z.boolean().optional(),
    status: z.nativeEnum(ListingStatus).optional(),
    isVisible: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.isNegotiable ||
      (data.unitPriceExclTax !== undefined && data.unitPriceExclTax !== null),
    {
      message: "unitPriceExclTax is required when not negotiable",
      path: ["unitPriceExclTax"],
    }
  )
  .refine(
    (data) =>
      (data.removalStatus ?? RemovalStatus.SCHEDULED) === RemovalStatus.REMOVED ||
      Boolean(data.removalDate),
    {
      message: "removalDate is required when removalStatus is scheduled",
      path: ["removalDate"],
    }
  );

const toRecord = (listing: unknown): ListingRecord => {
  if (!listing || typeof listing !== "object") {
    throw new Error("Listing result was not an object");
  }

  const candidate = listing as Record<string, unknown>;
  const toDate = (value: unknown, fallback?: Date): Date => {
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    if (fallback instanceof Date) return fallback;
    return new Date();
  };

  return {
    id: String(candidate.id),
    sellerUserId: String(candidate.sellerUserId),
    status: candidate.status as ListingStatus,
    isVisible: Boolean(candidate.isVisible),
    kind: String(candidate.kind),
    maker: (candidate.maker as string | null) ?? null,
    machineName: (candidate.machineName as string | null) ?? null,
    quantity: Number(candidate.quantity),
    unitPriceExclTax:
      candidate.unitPriceExclTax === null || candidate.unitPriceExclTax === undefined
        ? null
        : Number(candidate.unitPriceExclTax),
    isNegotiable: Boolean(candidate.isNegotiable),
    removalStatus: (candidate.removalStatus as RemovalStatus) ?? RemovalStatus.SCHEDULED,
    removalDate: candidate.removalDate ? toDate(candidate.removalDate) : null,
    hasNailSheet: Boolean(candidate.hasNailSheet),
    hasManual: Boolean(candidate.hasManual),
    pickupAvailable: Boolean(candidate.pickupAvailable),
    storageLocation:
      typeof candidate.storageLocation === "string" ? candidate.storageLocation : "",
    storageLocationId: (candidate.storageLocationId as string | null) ?? null,
    storageLocationSnapshot: (candidate.storageLocationSnapshot as unknown | null) ?? null,
    shippingFeeCount: Number(candidate.shippingFeeCount),
    handlingFeeCount: Number(candidate.handlingFeeCount),
    allowPartial: Boolean(candidate.allowPartial),
    note: (candidate.note as string | null) ?? null,
    createdAt: toDate(candidate.createdAt),
    updatedAt: toDate(candidate.updatedAt, toDate(candidate.createdAt)),
  };
};

const toDto = (listing: ListingRecord): ListingDto => ({
  id: listing.id,
  sellerUserId: listing.sellerUserId,
  status: listing.status,
  isVisible: listing.isVisible,
  kind: listing.kind,
  maker: listing.maker,
  machineName: listing.machineName,
  quantity: listing.quantity,
  unitPriceExclTax: listing.unitPriceExclTax,
  isNegotiable: listing.isNegotiable,
  removalStatus: listing.removalStatus,
  removalDate: listing.removalDate ? listing.removalDate.toISOString() : null,
  hasNailSheet: listing.hasNailSheet,
  hasManual: listing.hasManual,
  pickupAvailable: listing.pickupAvailable,
  storageLocation: listing.storageLocation,
  storageLocationId: listing.storageLocationId,
  storageLocationSnapshot: listing.storageLocationSnapshot,
  shippingFeeCount: listing.shippingFeeCount,
  handlingFeeCount: listing.handlingFeeCount,
  allowPartial: listing.allowPartial,
  note: listing.note,
  createdAt: listing.createdAt.toISOString(),
  updatedAt: listing.updatedAt.toISOString(),
});

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

const parseListingStatus = (value: string | null): ListingStatus | undefined => {
  if (!value) return undefined;
  return Object.values(ListingStatus).includes(value as ListingStatus)
    ? (value as ListingStatus)
    : undefined;
};

const publicListingStatuses = [ListingStatus.PUBLISHED, ListingStatus.SOLD];

const toSnapshotFromStorageLocation = (location?: {
  name: string;
  address: string | null;
  prefecture: string | null;
  city: string | null;
}): Partial<StorageLocationSnapshot> | null =>
  location
    ? {
        name: location.name,
        address: location.address ?? undefined,
        prefecture: location.prefecture ?? undefined,
        city: location.city ?? undefined,
      }
    : null;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sellerUserIdParam = url.searchParams.get("sellerUserId") ?? undefined;
    const statusParam = url.searchParams.get("status");
    const status = parseListingStatus(statusParam);
    const currentUserId = getCurrentUserId(request);

    if (statusParam && !status) {
      return NextResponse.json(
        { error: "Invalid status parameter" },
        { status: 400 }
      );
    }

    type ListingVisibilityWhere = {
      sellerUserId?: string;
      status?: ListingStatus | { in: ListingStatus[] };
    };

    const accessibleScopes: ListingVisibilityWhere[] = [
      { status: { in: publicListingStatuses } },
    ];

    if (currentUserId) {
      accessibleScopes.push({ sellerUserId: currentUserId });
    }

    const andConditions: ListingVisibilityWhere[] = [];

    if (sellerUserIdParam) {
      if (!currentUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (sellerUserIdParam !== currentUserId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      andConditions.push({ sellerUserId: currentUserId });
    }

    if (status) {
      andConditions.push({ status });
    }

    const where = {
      OR: accessibleScopes,
      ...(andConditions.length ? { AND: andConditions } : {}),
    } satisfies Prisma.ListingWhereInput & {
      sellerUserId?: string;
      status?: ListingStatus | { in: ListingStatus[] };
    };

    const listings = await listingClient.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    const records = listings.map(toRecord);
    const storageLocationIds = records
      .map((listing) => listing.storageLocationId)
      .filter((id): id is string => Boolean(id));

    const storageLocations = await prisma.storageLocation.findMany({
      where: { id: { in: storageLocationIds } },
    });

    const storageLocationMap = new Map(
      storageLocations.map((location) => [location.id, location])
    );

    const enriched = records.map((listing) => {
      const snapshot =
        resolveStorageLocationSnapshot(listing.storageLocationSnapshot) ??
        toSnapshotFromStorageLocation(
          listing.storageLocationId
            ? storageLocationMap.get(listing.storageLocationId)
            : undefined
        );

      return {
        ...listing,
        storageLocationSnapshot: snapshot,
        storageLocation: formatStorageLocationShort(snapshot, listing.storageLocation),
      };
    });

    return NextResponse.json(enriched.map(toDto));
  } catch (error) {
    console.error("Failed to fetch listings", error);
    return NextResponse.json(
      { error: "Failed to fetch listings", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const sellerUserId = getCurrentUserId(request);

  if (!sellerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON payload", detail: handleUnknownError(error) },
      { status: 400 }
    );
  }

  const parsed = createListingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", detail: parsed.error.format() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const storageLocation = await prisma.storageLocation.findFirst({
      where: { id: data.storageLocationId, ownerUserId: sellerUserId },
    });

    if (!storageLocation) {
      return NextResponse.json(
        { error: "保管場所が見つかりません。倉庫設定を確認してください。" },
        { status: 400 }
      );
    }

    const storageLocationSnapshot = {
      id: String(storageLocation.id),
      name: String(storageLocation.name),
      address: String(storageLocation.address),
      prefecture: storageLocation.prefecture,
      city: storageLocation.city,
    };
    const storageLocationLabel = formatStorageLocationShort(
      storageLocationSnapshot,
      data.storageLocation ?? ""
    );

    const created = await listingClient.create({
      data: {
        sellerUserId,
        status: data.status ?? ListingStatus.DRAFT,
        isVisible: data.isVisible ?? true,
        kind: data.kind,
        maker: data.maker ?? null,
        machineName: data.machineName ?? null,
        quantity: data.quantity,
        unitPriceExclTax: data.isNegotiable ? null : (data.unitPriceExclTax ?? null),
        isNegotiable: data.isNegotiable,
        removalStatus: data.removalStatus ?? RemovalStatus.SCHEDULED,
        removalDate:
          data.removalStatus === RemovalStatus.SCHEDULED && data.removalDate
            ? new Date(data.removalDate)
            : null,
        hasNailSheet: data.hasNailSheet ?? false,
        hasManual: data.hasManual ?? false,
        pickupAvailable: data.pickupAvailable ?? false,
        storageLocation: storageLocationLabel,
        storageLocationId: storageLocationSnapshot.id,
        storageLocationSnapshot,
        shippingFeeCount: data.shippingFeeCount,
        handlingFeeCount: data.handlingFeeCount,
        allowPartial: data.allowPartial,
        note: data.note ?? null,
      } as any,
    });

    return NextResponse.json(toDto(toRecord(created)), { status: 201 });
  } catch (error) {
    console.error("Failed to create listing", error);
    return NextResponse.json(
      { error: "Failed to create listing", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
