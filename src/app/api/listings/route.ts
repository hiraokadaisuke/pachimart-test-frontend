import { ListingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";

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
  storageLocation: string;
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
  storageLocation: string;
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
    storageLocation: z.string().min(1, "storageLocation is required"),
    shippingFeeCount: z.number().int().nonnegative(),
    handlingFeeCount: z.number().int().nonnegative(),
    allowPartial: z.boolean(),
    note: z.string().optional().nullable(),
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
    storageLocation: String(candidate.storageLocation),
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
  storageLocation: listing.storageLocation,
  shippingFeeCount: listing.shippingFeeCount,
  handlingFeeCount: listing.handlingFeeCount,
  allowPartial: listing.allowPartial,
  note: listing.note,
  createdAt: listing.createdAt.toISOString(),
  updatedAt: listing.updatedAt.toISOString(),
});

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

const parseVisibleOnly = (value: string | null): boolean | undefined => {
  if (value === null) return undefined;
  if (value.toLowerCase() === "false") return false;
  if (value.toLowerCase() === "true") return true;
  return undefined;
};

const parseListingStatus = (value: string | null): ListingStatus | undefined => {
  if (!value) return undefined;
  return Object.values(ListingStatus).includes(value as ListingStatus)
    ? (value as ListingStatus)
    : undefined;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sellerUserId = url.searchParams.get("sellerUserId") ?? undefined;
    const statusParam = url.searchParams.get("status");
    const status = parseListingStatus(statusParam);
    const visibleOnly = parseVisibleOnly(url.searchParams.get("visibleOnly"));

    if (statusParam && !status) {
      return NextResponse.json(
        { error: "Invalid status parameter" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {};

    if (sellerUserId) {
      where.sellerUserId = sellerUserId;
    }

    if (status) {
      where.status = status;
    }

    if (visibleOnly !== undefined) {
      if (visibleOnly) {
        where.isVisible = true;
      }
    } else if (!sellerUserId) {
      where.isVisible = true;
    }

    if (!status && !sellerUserId) {
      where.status = ListingStatus.PUBLISHED;
    }

    const listings = await listingClient.findMany({
      where: where as any,
      orderBy: { updatedAt: "desc" } as any,
    });

    return NextResponse.json(listings.map(toRecord).map(toDto));
  } catch (error) {
    console.error("Failed to fetch listings", error);
    return NextResponse.json(
      { error: "Failed to fetch listings", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const sellerUserId = request.headers.get("x-dev-user-id");

  if (!sellerUserId) {
    return NextResponse.json({ error: "Missing seller user id" }, { status: 400 });
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
    const created = await listingClient.create({
      data: {
        sellerUserId,
        status: data.status ?? ListingStatus.DRAFT,
        isVisible: data.isVisible ?? true,
        kind: data.kind,
        maker: data.maker ?? null,
        machineName: data.machineName ?? null,
        quantity: data.quantity,
        unitPriceExclTax: data.unitPriceExclTax ?? null,
        isNegotiable: data.isNegotiable,
        storageLocation: data.storageLocation,
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
