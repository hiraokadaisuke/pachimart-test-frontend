import {
  ExhibitStatus,
  Prisma,
  NaviStatus,
  NaviType,
  DealingStatus,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { getCurrentUserId } from "@/lib/server/currentUser";
import { buildListingSnapshot } from "@/lib/dealings/listingSnapshot";
import { calculateOnlineInquiryTotals } from "@/lib/online-inquiries/totals";

const naviClient = prisma.navi;

const updateDealingSchema = z.object({
  status: z.nativeEnum(NaviStatus, {
    errorMap: () => ({ message: "status must be a valid NaviStatus" }),
  }),
});

type NaviRecord = {
  id: number;
  status: NaviStatus;
  naviType: NaviType;
  ownerUserId: string;
  buyerUserId: string | null;
  listingId: string | null;
  listingSnapshot: Prisma.JsonValue | null;
  payload: Prisma.JsonValue | null;
  paymentAt?: Date | null;
  completedAt?: Date | null;
  canceledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  trade?: { id: unknown } | null;
};

const toDto = (dealing: NaviRecord, tradeId?: number) => ({
  id: dealing.id,
  status: dealing.status,
  naviType: dealing.naviType,
  ownerUserId: dealing.ownerUserId,
  buyerUserId: dealing.buyerUserId,
  listingId: dealing.listingId,
  listingSnapshot: (dealing.listingSnapshot as Prisma.JsonValue | null) ?? null,
  payload: (dealing.payload as Prisma.JsonValue | null) ?? null,
  paymentAt: dealing.paymentAt ? dealing.paymentAt.toISOString() : null,
  completedAt: dealing.completedAt ? dealing.completedAt.toISOString() : null,
  canceledAt: dealing.canceledAt ? dealing.canceledAt.toISOString() : null,
  createdAt: dealing.createdAt.toISOString(),
  updatedAt: dealing.updatedAt.toISOString(),
  tradeId,
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
    paymentAt: (candidate as { paymentAt?: Date | null }).paymentAt ?? null,
    completedAt: (candidate as { completedAt?: Date | null }).completedAt ?? null,
    canceledAt: (candidate as { canceledAt?: Date | null }).canceledAt ?? null,
    createdAt: toDate(candidate.createdAt),
    updatedAt: toDate(candidate.updatedAt, toDate(candidate.createdAt)),
    trade: (() => {
      const tradeValue = (candidate.trade as { id?: unknown } | null) ?? null;
      return tradeValue ? { id: tradeValue.id ?? null } : null;
    })(),
  };
};

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

const parseNaviId = (id: string) => {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

class BuyerRequiredError extends Error {
  constructor() {
    super("buyerUserId is required to approve");
  }
}

class ShippingInfoMissingError extends Error {
  constructor() {
    super("Shipping destination and contact are required to approve");
  }
}

class DealingNotFoundError extends Error {}

const extractShippingInfo = (payload: Prisma.JsonValue | null) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;

  const candidate = payload as Record<string, unknown>;
  const shipping =
    candidate.buyerShippingAddress ??
    candidate.shipping ??
    (candidate.shippingInfo as unknown) ??
    (candidate.shippingInfo && typeof candidate.shippingInfo === "object"
      ? (candidate.shippingInfo as Record<string, unknown>).shipping
      : null);

  if (!shipping || typeof shipping !== "object" || Array.isArray(shipping)) return null;

  const shippingRecord = shipping as Record<string, unknown>;

  return {
    companyName: (shippingRecord.companyName as string | undefined) ?? undefined,
    address: (shippingRecord.address as string | undefined) ?? undefined,
    tel: (shippingRecord.tel as string | undefined) ?? undefined,
    personName: (shippingRecord.personName as string | undefined) ?? undefined,
  };
};

const resolveBuyerUserId = (trade: NaviRecord): string | null => {
  if (trade.buyerUserId) return trade.buyerUserId;

  if (
    trade.payload &&
    typeof trade.payload === "object" &&
    !Array.isArray(trade.payload)
  ) {
    const buyerId = (trade.payload as Record<string, unknown>).buyerId;
    if (typeof buyerId === "string" && buyerId.trim().length > 0) {
      return buyerId;
    }
  }

  return null;
};

const isJsonObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (typeof parsed === "number" && Number.isFinite(parsed)) return parsed;
  return fallback;
};

const toString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

export async function GET(request: Request, { params }: { params: { naviId: string } }) {
  const id = parseNaviId(params.naviId);

  if (!id) {
    return NextResponse.json({ error: "Invalid id parameter" }, { status: 400 });
  }

  const currentUserId = getCurrentUserId(request);

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Cast to any to sidestep missing generated Prisma types in CI while keeping runtime numeric id
    const dealing = await naviClient.findUnique({ where: { id } as any });

    if (!dealing) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const dealingRecord = toRecord(dealing);
    const buyerUserId = resolveBuyerUserId(dealingRecord);

    if (dealingRecord.ownerUserId !== currentUserId && buyerUserId !== currentUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(toDto(toRecord(dealing)));
  } catch (error) {
    console.error("Failed to fetch trade", error);
    return NextResponse.json(
      { error: "Failed to fetch trade", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: { naviId: string } }) {
  const id = parseNaviId(params.naviId);

  const currentUserId = getCurrentUserId(request);

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: "Invalid id parameter" }, { status: 400 });
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

  const parsed = updateDealingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", detail: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const existing = await naviClient.findUnique({
      where: { id } as any,
      include: { trade: true } as any,
    });

    if (!existing) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const existingRecord = toRecord(existing);
    const buyerUserId = resolveBuyerUserId(existingRecord);
    const isOwner = existingRecord.ownerUserId === currentUserId;

    if (!isOwner && buyerUserId !== currentUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetStatus = parsed.data.status;

    if (targetStatus === NaviStatus.APPROVED && buyerUserId !== currentUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (targetStatus !== NaviStatus.APPROVED && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (targetStatus === NaviStatus.APPROVED) {
      const shipping = extractShippingInfo(existingRecord.payload);

      if (!shipping?.address || !shipping.personName) {
        throw new ShippingInfoMissingError();
      }
    }

    const isApproving = targetStatus === NaviStatus.APPROVED;

    if (isApproving && existingRecord.trade?.id) {
      return NextResponse.json(
        toDto(existingRecord, Number(existingRecord.trade.id) || undefined),
        { status: existingRecord.status === NaviStatus.APPROVED ? 200 : 409 }
      );
    }

    const { updated, trade } = await (prisma as any).$transaction(async (tx: any) => {
      const current = await tx.navi.findUnique({
        where: { id } as any,
        include: { trade: true, ownerUser: true, buyerUser: true },
      });

      if (!current) throw new DealingNotFoundError();

      const payload = isJsonObject(current.payload)
        ? ({ ...current.payload } as Record<string, unknown>)
        : ({} as Record<string, unknown>);

      const resolvedBuyerId = resolveBuyerUserId(toRecord(current));

      if (isApproving && !resolvedBuyerId) {
        throw new BuyerRequiredError();
      }

      const conditionsCandidate = isJsonObject(payload.conditions)
        ? (payload.conditions as Record<string, unknown>)
        : {};

      const listing = current.listingId
        ? await tx.exhibit.findUnique({ where: { id: current.listingId } as any })
        : null;

      const listingSnapshot: Prisma.InputJsonValue | null =
        (current.listingSnapshot as Prisma.InputJsonValue | null | undefined) ??
        (payload.listingSnapshot as Prisma.InputJsonValue | null | undefined) ??
        (listing
          ? (buildListingSnapshot(listing as Record<string, unknown>) as Prisma.InputJsonValue)
          : null);

      const listingSnapshotRecord = isJsonObject(listingSnapshot)
        ? (listingSnapshot as Record<string, unknown>)
        : null;

      const makerName =
        toString(
          conditionsCandidate.makerName ??
            listingSnapshotRecord?.maker ??
            (listing as { maker?: unknown } | null)?.maker ??
            ""
        ) || undefined;

      const productName =
        toString(
          conditionsCandidate.productName ??
            ((listingSnapshotRecord?.machineName ?? listingSnapshotRecord?.title) as
              | unknown
              | null) ??
            (listing as { machineName?: unknown } | null)?.machineName ??
            "商品"
        ) || "商品";

      const unitPrice = toNumber(
        conditionsCandidate.unitPrice ?? conditionsCandidate.unitPriceExclTax,
        0
      );
      const quantity = toNumber(conditionsCandidate.quantity, 1) || 1;
      const shippingFee = toNumber(conditionsCandidate.shippingFee, 0);
      const handlingFee = toNumber(conditionsCandidate.handlingFee, 0);
      const taxRate = toNumber(conditionsCandidate.taxRate, 0.1);

      const amountInput = {
        id: String(current.id),
        unitPriceExclTax: unitPrice,
        quantity,
        shippingFee,
        handlingFee,
        taxRate,
        makerName,
        productName,
      };

      const { items, totals } = calculateOnlineInquiryTotals(amountInput);
      const memo = toString(conditionsCandidate.memo ?? (payload as Record<string, unknown>).memo ?? "");

      const normalizedPayload: Prisma.InputJsonValue = {
        ...payload,
        buyerCompanyName: current.buyerUser?.companyName ?? undefined,
        sellerCompanyName: current.ownerUser?.companyName ?? undefined,
        listingSnapshot: listingSnapshot ?? null,
        conditions: {
          unitPrice,
          quantity,
          shippingFee,
          handlingFee,
          taxRate,
          makerName,
          productName,
          memo,
        },
        items,
        totals,
      };

      const updatedNavi = await tx.navi.update({
        where: { id } as any,
        data: {
          status: parsed.data.status,
          payload: normalizedPayload,
          listingSnapshot: listingSnapshot ?? null,
        },
      });

      const existingTradeId = (current.trade as { id?: unknown } | null)?.id;

      let createdTrade: { id: unknown } | null = null;

      if (isApproving && !existingTradeId) {
        // The upsert keeps trade creation idempotent per Navi approval; callers can retry safely.
        createdTrade = await tx.dealing.upsert({
          where: { naviId: updatedNavi.id } as any,
          create: {
            sellerUserId: updatedNavi.ownerUserId,
            buyerUserId: resolvedBuyerId!,
            status: DealingStatus.PAYMENT_REQUIRED,
            payload: normalizedPayload ?? Prisma.JsonNull,
            naviId: updatedNavi.id,
          },
          update: {},
          select: { id: true },
        });

        if (listing && listing.status !== ExhibitStatus.SOLD) {
          await tx.exhibit.update({ where: { id: listing.id } as any, data: { status: ExhibitStatus.SOLD } });
        }
      }

      return {
        updated: toRecord({ ...updatedNavi, trade: createdTrade ?? current.trade }),
        trade: createdTrade ?? (existingTradeId ? { id: existingTradeId } : null),
      };
    });

    const tradeId = trade ? Number(trade.id) : undefined;

    return NextResponse.json(toDto(updated, tradeId));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2025" || error.code === "P2015")
    ) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    if (error instanceof DealingNotFoundError) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    if (error instanceof BuyerRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ShippingInfoMissingError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Failed to update trade", error);
    return NextResponse.json(
      { error: "Failed to update trade", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
