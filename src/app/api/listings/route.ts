import { ExhibitStatus, ExhibitType, Prisma, RemovalStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { getCurrentUser } from "@/lib/server/currentUser";
import { getUserIdCandidates } from "@/lib/server/users";
import {
  buildStorageLocationSnapshot,
  formatStorageLocationShort,
  resolveStorageLocationSnapshot,
  type StorageLocationSnapshot,
} from "@/lib/exhibits/storageLocation";

type ExhibitRecord = {
  id: string;
  sellerUserId: string;
  status: ExhibitStatus;
  isVisible: boolean;
  type: ExhibitType;
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
  storageLocationId: string;
  storageLocationSnapshot: unknown | null;
  shippingFeeCount: number;
  handlingFeeCount: number;
  allowPartial: boolean;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ExhibitDto = {
  id: string;
  sellerUserId: string;
  status: ExhibitStatus;
  isVisible: boolean;
  type: ExhibitType;
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
  storageLocationId: string;
  storageLocationSnapshot: unknown | null;
  shippingFeeCount: number;
  handlingFeeCount: number;
  allowPartial: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

const exhibitClient = prisma.exhibit;

const createListingSchema = z
  .object({
    type: z.nativeEnum(ExhibitType),
    kind: z.string().min(1, "kind is required"),
    maker: z.string().trim().min(1).optional().nullable(),
    machineName: z.string().trim().min(1).optional().nullable(),
    quantity: z.number().int().positive("quantity must be a positive integer"),
    unitPriceExclTax: z.number().int().nonnegative().optional().nullable(),
    isNegotiable: z.boolean().default(false),
    storageLocation: z.string().optional().nullable(),
    storageLocationId: z.string().min(1, "storageLocationId is required"),
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
    status: z.nativeEnum(ExhibitStatus).optional(),
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

const toRecord = (exhibit: unknown): ExhibitRecord => {
  if (!exhibit || typeof exhibit !== "object") {
    throw new Error("Listing result was not an object");
  }

  const candidate = exhibit as Record<string, unknown>;
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
    status: candidate.status as ExhibitStatus,
    isVisible: Boolean(candidate.isVisible),
    type: candidate.type as ExhibitType,
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
    storageLocationId: String(candidate.storageLocationId ?? ""),
    storageLocationSnapshot: (candidate.storageLocationSnapshot as unknown | null) ?? null,
    shippingFeeCount: Number(candidate.shippingFeeCount),
    handlingFeeCount: Number(candidate.handlingFeeCount),
    allowPartial: Boolean(candidate.allowPartial),
    note: (candidate.note as string | null) ?? null,
    createdAt: toDate(candidate.createdAt),
    updatedAt: toDate(candidate.updatedAt, toDate(candidate.createdAt)),
  };
};

const toDto = (exhibit: ExhibitRecord): ExhibitDto => ({
  id: exhibit.id,
  sellerUserId: exhibit.sellerUserId,
  status: exhibit.status,
  isVisible: exhibit.isVisible,
  type: exhibit.type,
  kind: exhibit.kind,
  maker: exhibit.maker,
  machineName: exhibit.machineName,
  quantity: exhibit.quantity,
  unitPriceExclTax: exhibit.unitPriceExclTax,
  isNegotiable: exhibit.isNegotiable,
  removalStatus: exhibit.removalStatus,
  removalDate: exhibit.removalDate ? exhibit.removalDate.toISOString() : null,
  hasNailSheet: exhibit.hasNailSheet,
  hasManual: exhibit.hasManual,
  pickupAvailable: exhibit.pickupAvailable,
  storageLocation: exhibit.storageLocation,
  storageLocationId: exhibit.storageLocationId,
  storageLocationSnapshot: exhibit.storageLocationSnapshot,
  shippingFeeCount: exhibit.shippingFeeCount,
  handlingFeeCount: exhibit.handlingFeeCount,
  allowPartial: exhibit.allowPartial,
  note: exhibit.note,
  createdAt: exhibit.createdAt.toISOString(),
  updatedAt: exhibit.updatedAt.toISOString(),
});

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

const parseExhibitStatus = (value: string | null): ExhibitStatus | undefined => {
  if (!value) return undefined;
  return Object.values(ExhibitStatus).includes(value as ExhibitStatus)
    ? (value as ExhibitStatus)
    : undefined;
};

const publicListingStatuses = [ExhibitStatus.PUBLISHED, ExhibitStatus.SOLD];

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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sellerUserIdParam = url.searchParams.get("sellerUserId") ?? undefined;
    const statusParam = url.searchParams.get("status");
    const status = parseExhibitStatus(statusParam);
    const currentUser = await getCurrentUser(request);
    const currentUserIds = currentUser ? getUserIdCandidates(currentUser) : [];

    if (statusParam && !status) {
      return NextResponse.json(
        { error: "Invalid status parameter" },
        { status: 400 }
      );
    }

    type ExhibitVisibilityWhere = {
      sellerUserId?: string | { in: string[] };
      status?: ExhibitStatus | { in: ExhibitStatus[] };
    };

    const accessibleScopes: ExhibitVisibilityWhere[] = [
      { status: { in: publicListingStatuses } },
    ];

    if (currentUserIds.length) {
      accessibleScopes.push({ sellerUserId: { in: currentUserIds } });
    }

    const andConditions: ExhibitVisibilityWhere[] = [];

    if (sellerUserIdParam) {
      if (!currentUserIds.length) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (!currentUserIds.includes(sellerUserIdParam)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      andConditions.push({ sellerUserId: { in: currentUserIds } });
    }

    if (status) {
      andConditions.push({ status });
    }

    const where = {
      OR: accessibleScopes,
      ...(andConditions.length ? { AND: andConditions } : {}),
    } satisfies Prisma.ExhibitWhereInput & {
      sellerUserId?: string;
      status?: ExhibitStatus | { in: ExhibitStatus[] };
    };

    const exhibits = await exhibitClient.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    const records = exhibits.map(toRecord);
    const storageLocationIds = records
      .map((exhibit) => exhibit.storageLocationId)
      .filter((id): id is string => Boolean(id));

    const storageLocations = await prisma.storageLocation.findMany({
      where: { id: { in: storageLocationIds } },
    });

    const storageLocationMap = new Map(
      storageLocations.map((location) => [location.id, location])
    );

    const enriched = records.map((exhibit) => {
      const snapshot =
        resolveStorageLocationSnapshot(exhibit.storageLocationSnapshot) ??
        toSnapshotFromStorageLocation(storageLocationMap.get(exhibit.storageLocationId));

      return {
        ...exhibit,
        storageLocationSnapshot: snapshot,
        storageLocation: formatStorageLocationShort(snapshot, exhibit.storageLocation),
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
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellerUserId = currentUser.id;
  const sellerUserIds = getUserIdCandidates(currentUser);

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
      where: { id: data.storageLocationId, ownerUserId: { in: sellerUserIds }, isActive: true },
    });

    if (!storageLocation) {
      return NextResponse.json(
        { error: "保管場所が見つかりません。倉庫設定を確認してください。" },
        { status: 400 }
      );
    }

    const storageLocationSnapshot = buildStorageLocationSnapshot({
      id: String(storageLocation.id),
      name: String(storageLocation.name),
      address: storageLocation.addressLine ?? undefined,
      postalCode: storageLocation.postalCode ?? undefined,
      prefecture: storageLocation.prefecture ?? undefined,
      city: storageLocation.city ?? undefined,
      addressLine: storageLocation.addressLine ?? undefined,
      handlingFeePerUnit:
        storageLocation.handlingFeePerUnit !== null && storageLocation.handlingFeePerUnit !== undefined
          ? Number(storageLocation.handlingFeePerUnit)
          : undefined,
      shippingFeesByRegion: storageLocation.shippingFeesByRegion ?? undefined,
    });
    const storageLocationLabel = formatStorageLocationShort(
      storageLocationSnapshot,
      data.storageLocation ?? storageLocation.addressLine ?? ""
    );

    const created = await exhibitClient.create({
      data: {
        sellerUserId,
        status: data.status ?? ExhibitStatus.DRAFT,
        isVisible: data.isVisible ?? true,
        type: data.type,
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
