import {
  DealingStatus,
  ExhibitStatus,
  ExhibitType,
  NaviStatus,
  RemovalStatus,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { getCurrentUserId } from "@/lib/server/currentUser";
import {
  buildStorageLocationSnapshot,
  formatStorageLocationShort,
  resolveStorageLocationSnapshot,
  type StorageLocationSnapshot,
} from "@/lib/exhibits/storageLocation";

const exhibitClient = prisma.exhibit;
const confirmedTradeStatuses = new Set<DealingStatus>([
  DealingStatus.PAYMENT_REQUIRED,
  DealingStatus.CONFIRM_REQUIRED,
  DealingStatus.COMPLETED,
]);

const hasRemovalUpdate = (payload: unknown) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  return (
    Object.prototype.hasOwnProperty.call(payload, "removalDate") ||
    Object.prototype.hasOwnProperty.call(payload, "removalStatus")
  );
};

const updateListingSchema = z
  .object({
    status: z.nativeEnum(ExhibitStatus).optional(),
    isVisible: z.boolean().optional(),
    type: z.nativeEnum(ExhibitType).optional(),
    kind: z.string().min(1, "kind is required").optional(),
    maker: z.string().trim().min(1).optional().nullable(),
    machineName: z.string().trim().min(1).optional().nullable(),
    quantity: z.number().int().positive("quantity must be a positive integer").optional(),
    unitPriceExclTax: z.number().int().nonnegative().optional().nullable(),
    isNegotiable: z.boolean().optional(),
    storageLocationId: z.string().min(1, "storageLocationId is required").optional(),
    shippingFeeCount: z.number().int().nonnegative().optional(),
    handlingFeeCount: z.number().int().nonnegative().optional(),
    allowPartial: z.boolean().optional(),
    note: z.string().optional().nullable(),
    removalStatus: z.nativeEnum(RemovalStatus).optional(),
    removalDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "removalDate must be in YYYY-MM-DD format")
      .optional()
      .nullable(),
    hasNailSheet: z.boolean().optional(),
    hasManual: z.boolean().optional(),
    pickupAvailable: z.boolean().optional(),
  })
  .superRefine((data, context) => {
    if (data.isNegotiable === false && data.unitPriceExclTax === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "unitPriceExclTax is required when not negotiable",
        path: ["unitPriceExclTax"],
      });
    }
    if (data.removalStatus === RemovalStatus.SCHEDULED && data.removalDate === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "removalDate is required when removalStatus is scheduled",
        path: ["removalDate"],
      });
    }
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
  status: exhibit.status as ExhibitStatus,
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

    if (hasRemovalUpdate(body)) {
      const navi = await prisma.navi.findFirst({
        where: { listingId: id, status: { not: NaviStatus.DRAFT } },
        select: { id: true, status: true },
      });
      const dealing = await prisma.dealing.findFirst({
        where: {
          status: { in: Array.from(confirmedTradeStatuses) },
          navi: { listingId: id },
        },
        select: { id: true, status: true },
      });

      if (navi || dealing) {
        console.warn("Blocked removal update for confirmed trade/listing", {
          listingId: id,
          sellerUserId,
          naviStatus: navi?.status ?? null,
          dealingStatus: dealing?.status ?? null,
        });
        return NextResponse.json(
          { error: "取引確定後は撤去日の変更はできません" },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      status: parsed.data.status,
      isVisible: parsed.data.isVisible,
      type: parsed.data.type,
      kind: parsed.data.kind,
      maker: parsed.data.maker ?? undefined,
      machineName: parsed.data.machineName ?? undefined,
      quantity: parsed.data.quantity,
      unitPriceExclTax: parsed.data.isNegotiable
        ? null
        : parsed.data.unitPriceExclTax ?? undefined,
      isNegotiable: parsed.data.isNegotiable,
      shippingFeeCount: parsed.data.shippingFeeCount,
      handlingFeeCount: parsed.data.handlingFeeCount,
      allowPartial: parsed.data.allowPartial,
      note: parsed.data.note ?? undefined,
      removalStatus: parsed.data.removalStatus,
      removalDate:
        parsed.data.removalStatus === RemovalStatus.SCHEDULED && parsed.data.removalDate
          ? new Date(parsed.data.removalDate)
          : parsed.data.removalStatus === RemovalStatus.REMOVED
            ? null
            : parsed.data.removalDate === null
              ? null
              : undefined,
      hasNailSheet: parsed.data.hasNailSheet,
      hasManual: parsed.data.hasManual,
      pickupAvailable: parsed.data.pickupAvailable,
    };

    if (parsed.data.storageLocationId) {
      const storageLocation = await prisma.storageLocation.findFirst({
        where: { id: parsed.data.storageLocationId, ownerUserId: sellerUserId, isActive: true },
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
        storageLocation.addressLine ?? ""
      );

      updateData.storageLocationId = storageLocationSnapshot.id;
      updateData.storageLocationSnapshot = storageLocationSnapshot;
      updateData.storageLocation = storageLocationLabel;
    }

    const updated = await exhibitClient.update({
      where: { id },
      data: updateData as any,
    });

    return NextResponse.json(toDto(updated));
  } catch (error) {
    console.error("Failed to update listing", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id?: string } }) {
  const id = params?.id;

  if (!id) {
    return NextResponse.json({ error: "Listing id is required" }, { status: 400 });
  }

  const sellerUserId = getCurrentUserId(request);
  if (!sellerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const exhibit = await exhibitClient.findUnique({ where: { id } });
    if (!exhibit) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (String(exhibit.sellerUserId) !== sellerUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await exhibitClient.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete listing", error);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}
