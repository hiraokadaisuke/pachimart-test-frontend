import {
  ListingStatus,
  MessageSenderRole,
  Prisma,
  PrismaClient,
  NaviStatus,
  NaviType,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma, type InMemoryPrismaClient } from "@/lib/server/prisma";
import { type NaviDraft } from "@/lib/navi/types";
import {
  buildListingSnapshot,
  formatListingStorageLocation,
  type ListingSnapshot,
} from "@/lib/trade/listingSnapshot";
import { getCurrentUserId } from "@/lib/server/currentUser";

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
    status: candidate.status as NaviStatus,
    naviType: candidate.naviType as NaviType,
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
  ownerUserId: string,
  request: z.infer<typeof requestSchema>
): NaviDraft & { inquiryType: "ONLINE_INQUIRY" } => {
  const now = new Date().toISOString();
  const location = formatListingStorageLocation(listing) ?? "";
  return {
    inquiryType: "ONLINE_INQUIRY",
    id: listing.listingId,
    ownerUserId,
    status: "sent_to_buyer",
    productId: listing.listingId,
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
      productName: listing.machineName ?? listing.title ?? undefined,
      makerName: listing.maker ?? undefined,
      location: location || undefined,
      machineShipmentDate: request.desiredShipDate ?? undefined,
      paymentDue: request.desiredPaymentDate ?? undefined,
    },
    createdAt: now,
    updatedAt: now,
  };
};

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

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", detail: parsed.error.format() },
      { status: 400 }
    );
  }

  const { listingId, quantity, buyerMemo, buyerUserId } = parsed.data;

  if (buyerUserId !== currentUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.sellerUserId === buyerUserId) {
      return NextResponse.json(
        { error: "出品者は自分の出品に問い合わせできません" },
        { status: 403 }
      );
    }

    if (listing.status === ListingStatus.SOLD) {
      return NextResponse.json(
        { error: "成約済みのためオンライン問い合わせは利用できません" },
        { status: 400 }
      );
    }

    const snapshot = buildListingSnapshot(listing as Record<string, unknown>);
    const payload = buildInquiryPayload(snapshot, listing.sellerUserId, parsed.data);

    const createInquiry = async (tx: Prisma.TransactionClient | InMemoryPrismaClient) => {
      const navi = await tx.navi.create({
        data: {
          ownerUserId: listing.sellerUserId,
          buyerUserId,
          listingId: listing.id,
          listingSnapshot: snapshot as any,
          status: NaviStatus.SENT,
          naviType: NaviType.ONLINE_INQUIRY,
          payload: { ...payload, buyerMemo },
        },
      });

      const normalizedBody = (buyerMemo ?? "").toString().trim() || "問い合わせが送信されました。";

      await tx.message.create({
        data: {
          naviId: navi.id,
          senderUserId: buyerUserId,
          senderRole: MessageSenderRole.buyer,
          body: normalizedBody,
        },
      });

      return navi;
    };

    const created = await (prisma instanceof PrismaClient
      ? prisma.$transaction((tx) => createInquiry(tx))
      : prisma.$transaction((tx) => createInquiry(tx as InMemoryPrismaClient)));

    return NextResponse.json(toDto(toRecord(created)), { status: 201 });
  } catch (error) {
    console.error("Failed to create online inquiry", error);
    return NextResponse.json(
      { error: "Failed to create online inquiry", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
