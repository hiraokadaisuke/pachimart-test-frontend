import { DealingStatus, ExhibitStatus, PrismaClient, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { buildListingSnapshot } from "@/lib/dealings/listingSnapshot";
import { getCurrentUserId } from "@/lib/server/currentUser";
import { prisma, type InMemoryPrismaClient } from "@/lib/server/prisma";
import { calculateOnlineInquiryTotals } from "@/lib/online-inquiries/totals";

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

const updateSchema = z.object({
  action: z.enum(["accept", "decline", "cancel"]).optional(),
  shippingAddress: z.string().optional(),
  contactPerson: z.string().optional(),
  desiredShipDate: z.string().optional(),
  desiredPaymentDate: z.string().optional(),
  buyerMemo: z.string().optional(),
});

const buildInquiryDetail = async (inquiry: {
  id: string;
  listingId: string;
  buyerUserId: string;
  sellerUserId: string;
  unitPriceExclTax: number;
  quantity: number;
  taxRate: number;
  shippingFee: number;
  handlingFee: number;
  shippingAddress: string | null;
  contactPerson: string | null;
  desiredShipDate: string | null;
  desiredPaymentDate: string | null;
  body: string;
  buyerMemo: string | null;
  makerName: string | null;
  productName: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) => {
  const [listing, buyerUser, sellerUser] = await Promise.all([
    prisma.exhibit.findUnique({
      where: { id: inquiry.listingId },
      select: { maker: true, machineName: true },
    }),
    prisma.user.findUnique({ where: { id: inquiry.buyerUserId }, select: { companyName: true, id: true } }),
    prisma.user.findUnique({ where: { id: inquiry.sellerUserId }, select: { companyName: true, id: true } }),
  ]);

  const makerName = inquiry.makerName ?? listing?.maker ?? null;
  const productName = inquiry.productName ?? listing?.machineName ?? "商品";
  const memo = inquiry.buyerMemo ?? inquiry.body ?? "";

  const { totals } = calculateOnlineInquiryTotals({
    id: inquiry.id,
    unitPriceExclTax: inquiry.unitPriceExclTax,
    quantity: inquiry.quantity,
    shippingFee: inquiry.shippingFee,
    handlingFee: inquiry.handlingFee,
    taxRate: inquiry.taxRate,
    makerName,
    productName,
  });

  return {
    id: inquiry.id,
    listingId: inquiry.listingId,
    buyerUserId: inquiry.buyerUserId,
    sellerUserId: inquiry.sellerUserId,
    status: inquiry.status,
    buyerCompanyName: buyerUser?.companyName ?? inquiry.buyerUserId,
    sellerCompanyName: sellerUser?.companyName ?? inquiry.sellerUserId,
    makerName,
    productName,
    quantity: inquiry.quantity,
    unitPriceExclTax: inquiry.unitPriceExclTax,
    shippingFee: inquiry.shippingFee,
    handlingFee: inquiry.handlingFee,
    taxRate: inquiry.taxRate,
    totalAmount: totals.total,
    shippingAddress: inquiry.shippingAddress ?? "",
    contactPerson: inquiry.contactPerson ?? "",
    desiredShipDate: inquiry.desiredShipDate ?? "",
    desiredPaymentDate: inquiry.desiredPaymentDate ?? "",
    memo,
    createdAt: inquiry.createdAt,
    updatedAt: inquiry.updatedAt,
  };
};

export async function GET(request: Request, { params }: { params: { inquiryId: string } }) {
  const currentUserId = getCurrentUserId(request);

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const inquiryId = params.inquiryId;

  try {
    const inquiry = await prisma.onlineInquiry.findUnique({ where: { id: inquiryId } });

    if (!inquiry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (![inquiry.buyerUserId, inquiry.sellerUserId].includes(currentUserId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const response = await buildInquiryDetail(inquiry);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch online inquiry detail", error);
    return NextResponse.json(
      { error: "Failed to fetch online inquiry", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: { inquiryId: string } }) {
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

  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", detail: parsed.error.format() },
      { status: 400 }
    );
  }

  const inquiryId = params.inquiryId;
  const { action, shippingAddress, contactPerson, desiredShipDate, desiredPaymentDate, buyerMemo } =
    parsed.data;

  const hasUpdates =
    action ||
    shippingAddress !== undefined ||
    contactPerson !== undefined ||
    desiredShipDate !== undefined ||
    desiredPaymentDate !== undefined ||
    buyerMemo !== undefined;

  if (!hasUpdates) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  try {
    const inquiry = await prisma.onlineInquiry.findUnique({ where: { id: inquiryId } });

    if (!inquiry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isBuyer = inquiry.buyerUserId === currentUserId;
    const isSeller = inquiry.sellerUserId === currentUserId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};

    const resolveNullable = (value: string | undefined | null) =>
      value === undefined ? undefined : value ?? null;

    let nextStatus = inquiry.status;

    if (action) {
      if ((action === "accept" || action === "decline") && !isSeller) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (action === "cancel" && !isBuyer) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      nextStatus =
        action === "accept"
          ? "ACCEPTED"
          : action === "decline"
            ? "DECLINED"
            : "CANCELED";
      updateData.status = nextStatus;
    }

    if (shippingAddress !== undefined) {
      if (!isBuyer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      updateData.shippingAddress = resolveNullable(shippingAddress);
    }

    if (contactPerson !== undefined) {
      if (!isBuyer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      updateData.contactPerson = resolveNullable(contactPerson);
    }

    if (desiredShipDate !== undefined) {
      if (!isBuyer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      updateData.desiredShipDate = resolveNullable(desiredShipDate);
    }

    if (desiredPaymentDate !== undefined) {
      if (!isBuyer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      updateData.desiredPaymentDate = resolveNullable(desiredPaymentDate);
    }

    if (buyerMemo !== undefined) {
      if (!isBuyer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      updateData.buyerMemo = resolveNullable(buyerMemo);
      updateData.body = resolveNullable(buyerMemo) ?? inquiry.body;
    }

    const processAcceptance = async (db: Prisma.TransactionClient | InMemoryPrismaClient) => {
      const updated = await db.onlineInquiry.update({
        where: { id: inquiryId },
        data: updateData,
      });

      const listing = await db.exhibit.findUnique({ where: { id: updated.listingId } });
      const [buyerUser, sellerUser] = await Promise.all([
        db.user.findUnique({ where: { id: updated.buyerUserId } }),
        db.user.findUnique({ where: { id: updated.sellerUserId } }),
      ]);

      const makerName = updated.makerName ?? listing?.maker ?? null;
      const productName = updated.productName ?? listing?.machineName ?? "商品";
      const memo = updated.buyerMemo ?? updated.body ?? "";

      const payload = {
        onlineInquiryId: updated.id,
        buyerCompanyName: buyerUser?.companyName,
        sellerCompanyName: sellerUser?.companyName,
        listingSnapshot: listing ? buildListingSnapshot(listing as Record<string, unknown>) : undefined,
        conditions: {
          unitPrice: updated.unitPriceExclTax,
          quantity: updated.quantity,
          shippingFee: updated.shippingFee,
          handlingFee: updated.handlingFee,
          taxRate: updated.taxRate,
          makerName,
          productName,
          memo,
        },
      } satisfies Record<string, unknown>;

      const trades = await db.dealing.findMany();
      const existingTrade = trades.find((trade) => {
        const candidate = (trade as { payload?: unknown }).payload;
        if (!candidate || typeof candidate !== "object") return false;
        return (candidate as { onlineInquiryId?: string }).onlineInquiryId === updated.id;
      });

      if (!existingTrade) {
        await db.dealing.create({
          data: {
            sellerUserId: updated.sellerUserId,
            buyerUserId: updated.buyerUserId,
            status: DealingStatus.IN_PROGRESS,
            payload,
          },
        });
      }

      if (listing && listing.status !== ExhibitStatus.SOLD) {
        await db.exhibit.update({ where: { id: listing.id }, data: { status: ExhibitStatus.SOLD } });
      }

      return updated;
    };

    const updated =
      nextStatus === "ACCEPTED"
        ? await (prisma instanceof PrismaClient
            ? prisma.$transaction((tx) => processAcceptance(tx))
            : prisma.$transaction((tx: InMemoryPrismaClient) => processAcceptance(tx)))
        : await prisma.onlineInquiry.update({
            where: { id: inquiryId },
            data: updateData,
          });

    const response = await buildInquiryDetail(updated);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Failed to update online inquiry", error);
    return NextResponse.json(
      { error: "Failed to update online inquiry", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
