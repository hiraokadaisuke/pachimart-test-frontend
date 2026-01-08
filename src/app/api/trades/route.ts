import { Prisma, NaviStatus, NaviType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { getCurrentUserId } from "@/lib/server/currentUser";
import { buildListingSnapshot } from "@/lib/dealings/listingSnapshot";
import { resolveUserIdForWrite, resolveUserLookupIds } from "@/lib/server/users";

const naviClient = prisma.navi;
const exhibitClient = prisma.exhibit;

type NaviDto = {
  id: number;
  status: NaviStatus;
  naviType: NaviType;
  ownerUserId: string;
  buyerUserId: string | null;
  listingId: string | null;
  listingSnapshot: Prisma.JsonValue | null;
  payload: Prisma.JsonValue | null;
  createdAt: string;
  updatedAt: string;
};

type NaviRecord = {
  id: number;
  status: NaviStatus;
  naviType: NaviType;
  ownerUserId: string;
  buyerUserId: string | null;
  listingId: string | null;
  listingSnapshot: Prisma.JsonValue | null;
  payload: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

const jsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ])
);

const createDealingSchema = z.object({
  ownerUserId: z.string().min(1, "ownerUserId is required"),
  buyerUserId: z.string().min(1).optional(),
  status: z.nativeEnum(NaviStatus).optional(),
  naviType: z.nativeEnum(NaviType).optional(),
  payload: jsonValueSchema.optional(),
  listingId: z.string().min(1).optional(),
});

const toDto = (dealing: NaviRecord): NaviDto => ({
  id: dealing.id,
  status: dealing.status,
  naviType: dealing.naviType,
  ownerUserId: dealing.ownerUserId,
  buyerUserId: dealing.buyerUserId,
  listingId: dealing.listingId,
  listingSnapshot: (dealing.listingSnapshot as Prisma.JsonValue | null) ?? null,
  payload: (dealing.payload as Prisma.JsonValue | null) ?? null,
  createdAt: dealing.createdAt.toISOString(),
  updatedAt: dealing.updatedAt.toISOString(),
});

const toRecord = (dealing: unknown): NaviRecord => {
  if (!dealing || typeof dealing !== "object") {
    throw new Error("Dealing result was not an object");
  }

  const candidate = dealing as Record<string, unknown>;
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
    id: Number(candidate.id),
    status: candidate.status as NaviStatus,
    naviType: (candidate.naviType as NaviType | undefined) ?? NaviType.PHONE_AGREEMENT,
    ownerUserId: String(candidate.ownerUserId),
    buyerUserId: (candidate.buyerUserId as string | null) ?? null,
    listingId: (candidate.listingId as string | null) ?? null,
    listingSnapshot: (candidate.listingSnapshot as Prisma.JsonValue | null) ?? null,
    payload: (candidate.payload as Prisma.JsonValue | null) ?? null,
    createdAt: toDate(candidate.createdAt),
    updatedAt: toDate(candidate.updatedAt, toDate(candidate.createdAt)),
  };
};

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

export async function GET(request: Request) {
  const currentUserId = getCurrentUserId(request);

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const lookupIds = await resolveUserLookupIds(currentUserId);
    const dealings = await naviClient.findMany({
      where: {
        OR: [{ ownerUserId: { in: lookupIds } }, { buyerUserId: { in: lookupIds } }],
      },
      // Cast to any to sidestep missing generated Prisma types in CI while keeping runtime sort order
      orderBy: { createdAt: "desc" } as any,
    });

    return NextResponse.json(dealings.map(toRecord).map(toDto));
  } catch (error) {
    console.error("Failed to fetch trades", error);
    return NextResponse.json(
      { error: "Failed to fetch trades", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const currentUserId = getCurrentUserId(request);

  if (!currentUserId) {
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

  const parsed = createDealingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", detail: parsed.error.format() },
      { status: 400 }
    );
  }

  const { ownerUserId, buyerUserId, status, payload, listingId, naviType } = parsed.data;

  if (ownerUserId !== currentUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ownerLookupIds = await resolveUserLookupIds(currentUserId);
  const resolvedOwnerId = await resolveUserIdForWrite(ownerUserId);
  const resolvedBuyerId = buyerUserId ? await resolveUserIdForWrite(buyerUserId) : null;

  let exhibitSnapshot: Prisma.JsonValue | null = null;

  if (listingId) {
    const exhibit = await exhibitClient.findUnique({
      where: { id: listingId, sellerUserId: { in: ownerLookupIds } } as any,
    });

    if (!exhibit) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    exhibitSnapshot = buildListingSnapshot(exhibit as Record<string, unknown>);
  }

  const listingSnapshotInput = exhibitSnapshot ?? undefined;

  try {
    const created = await naviClient.create({
      data: {
        ownerUserId: resolvedOwnerId,
        buyerUserId: resolvedBuyerId ?? null,
        listingId: listingId ?? null,
        listingSnapshot: listingSnapshotInput as any,
        status: status ?? NaviStatus.DRAFT,
        naviType: naviType ?? NaviType.PHONE_AGREEMENT,
        payload: (payload ?? null) as any,
      },
    });

    return NextResponse.json(toDto(toRecord(created)), { status: 201 });
  } catch (error) {
    console.error("Failed to create trade", error);
    return NextResponse.json(
      { error: "Failed to create trade", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
