import { ListingStatus, Prisma, PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId } from "@/lib/server/currentUser";
import { prisma, type InMemoryPrismaClient } from "@/lib/server/prisma";

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

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

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

  const {
    listingId,
    quantity,
    buyerMemo,
    buyerUserId,
    shippingAddress,
    contactPerson,
    desiredShipDate,
    desiredPaymentDate,
  } = parsed.data;

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

    const normalizedBody = (buyerMemo ?? "").toString().trim() || "問い合わせが送信されました。";

    const createInquiry = async (tx: Prisma.TransactionClient | InMemoryPrismaClient) =>
      tx.onlineInquiry.create({
        data: {
          listingId: listing.id,
          buyerUserId,
          sellerUserId: listing.sellerUserId,
          body: normalizedBody,
          quantity,
          shippingAddress: shippingAddress ?? null,
          contactPerson: contactPerson ?? null,
          desiredShipDate: desiredShipDate ?? null,
          desiredPaymentDate: desiredPaymentDate ?? null,
        },
      });

    const created = await (prisma instanceof PrismaClient
      ? prisma.$transaction((tx) => createInquiry(tx))
      : prisma.$transaction((tx) => createInquiry(tx as InMemoryPrismaClient)));

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create online inquiry", error);
    return NextResponse.json(
      { error: "Failed to create online inquiry", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
