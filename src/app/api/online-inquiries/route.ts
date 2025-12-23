import { Prisma, TradeNaviStatus, TradeNaviType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { type TradeNaviDraft } from "@/lib/navi/types";

const requestSchema = z.object({
  listingId: z.string().min(1, "listingId is required"),
  quantity: z.number().int().positive("quantity must be a positive integer"),
  buyerUserId: z.string().min(1, "buyerUserId is required"),
  buyerMemo: z.string().optional(),
  shippingAddress: z.string().optional(),
  contactPerson: z.string().optional(),
  desiredShipDate: z.string().optional(),
  desiredPaymentDate: z.string().optional(),
});

type ListingSnapshot = {
  id: string;
  sellerUserId: string;
  status: string;
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

const toListingSnapshot = (listing: Record<string, unknown>): ListingSnapshot => ({
  id: String(listing.id ?? ""),
  sellerUserId: String(listing.sellerUserId ?? ""),
  status: String(listing.status ?? ""),
  isVisible: Boolean(listing.isVisible),
  kind: String(listing.kind ?? ""),
  maker: (listing.maker as string | null) ?? null,
  machineName: (listing.machineName as string | null) ?? null,
  quantity: Number(listing.quantity ?? 0),
  unitPriceExclTax:
    listing.unitPriceExclTax === null || listing.unitPriceExclTax === undefined
      ? null
      : Number(listing.unitPriceExclTax),
  isNegotiable: Boolean(listing.isNegotiable),
  storageLocation: String(listing.storageLocation ?? ""),
  shippingFeeCount: Number(listing.shippingFeeCount ?? 0),
  handlingFeeCount: Number(listing.handlingFeeCount ?? 0),
  allowPartial: Boolean(listing.allowPartial),
  note: (listing.note as string | null) ?? null,
  createdAt: new Date(listing.createdAt as string | number | Date).toISOString(),
  updatedAt: new Date(listing.updatedAt as string | number | Date).toISOString(),
});

const toRecord = (trade: unknown) => {
  if (!trade || typeof trade !== "object") {
    throw new Error("Trade result was not an object");
  }

  const candidate = trade as Record<string, unknown>;
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
    status: candidate.status as TradeNaviStatus,
    naviType: candidate.naviType as TradeNaviType,
    ownerUserId: String(candidate.ownerUserId),
    buyerUserId: (candidate.buyerUserId as string | null) ?? null,
    listingId: (candidate.listingId as string | null) ?? null,
    listingSnapshot: (candidate.listingSnapshot as Prisma.JsonValue | null) ?? null,
    payload: (candidate.payload as Prisma.JsonValue | null) ?? null,
    createdAt: toDate(candidate.createdAt),
    updatedAt: toDate(candidate.updatedAt, toDate(candidate.createdAt)),
  };
};

const toDto = (trade: ReturnType<typeof toRecord>) => ({
  id: trade.id,
  status: trade.status,
  naviType: trade.naviType,
  ownerUserId: trade.ownerUserId,
  buyerUserId: trade.buyerUserId,
  listingId: trade.listingId,
  listingSnapshot: (trade.listingSnapshot as Prisma.JsonValue | null) ?? null,
  payload: (trade.payload as Prisma.JsonValue | null) ?? null,
  createdAt: trade.createdAt.toISOString(),
  updatedAt: trade.updatedAt.toISOString(),
});

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

const buildInquiryPayload = (
  listing: ListingSnapshot,
  request: z.infer<typeof requestSchema>
): TradeNaviDraft & { inquiryType: "ONLINE_INQUIRY" } => {
  const now = new Date().toISOString();
  return {
    inquiryType: "ONLINE_INQUIRY",
    id: listing.id,
    ownerUserId: listing.sellerUserId,
    status: "sent_to_buyer",
    productId: listing.id,
    buyerId: request.buyerUserId,
    buyerCompanyName: null,
    buyerContactName: request.contactPerson ?? null,
    buyerAddress: request.shippingAddress ?? null,
    buyerPending: false,
    conditions: {
      quantity: request.quantity,
      unitPrice: listing.unitPriceExclTax ?? 0,
      shippingFee: 0,
      handlingFee: 0,
      taxRate: 0.1,
      memo: request.buyerMemo ?? null,
      productName: listing.machineName ?? undefined,
      makerName: listing.maker ?? undefined,
      location: listing.storageLocation ?? undefined,
    },
    desiredShipDate: request.desiredShipDate ?? undefined,
    desiredPaymentDate: request.desiredPaymentDate ?? undefined,
    createdAt: now,
    updatedAt: now,
  };
};

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON payload", detail: handleUnknownError(error) },
      { status: 400 }
    );
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", detail: parsed.error.format() },
      { status: 400 }
    );
  }

  const { listingId, quantity, buyerMemo, buyerUserId } = parsed.data;

  try {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const canUseInquiry =
      !listing.isNegotiable &&
      listing.unitPriceExclTax !== null &&
      Boolean(listing.storageLocation) &&
      listing.shippingFeeCount !== undefined;

    if (!canUseInquiry) {
      const reason = listing.isNegotiable || listing.unitPriceExclTax === null
        ? "応相談のためオンライン問い合わせは利用できません"
        : "必要な情報が不足しているためオンライン問い合わせは利用できません";
      return NextResponse.json({ error: reason }, { status: 400 });
    }

    const snapshot = toListingSnapshot(listing as Record<string, unknown>);
    const payload = buildInquiryPayload(snapshot, parsed.data);

    const created = await prisma.tradeNavi.create({
      data: {
        ownerUserId: listing.sellerUserId,
        buyerUserId,
        listingId: listing.id,
        listingSnapshot: snapshot as any,
        status: TradeNaviStatus.SENT,
        naviType: TradeNaviType.ONLINE_INQUIRY,
        payload: { ...payload, buyerMemo },
      },
    });

    return NextResponse.json(toDto(toRecord(created)), { status: 201 });
  } catch (error) {
    console.error("Failed to create online inquiry", error);
    return NextResponse.json(
      { error: "Failed to create online inquiry", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
