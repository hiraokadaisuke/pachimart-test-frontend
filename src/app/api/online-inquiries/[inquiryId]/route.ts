import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId } from "@/lib/server/currentUser";
import { prisma } from "@/lib/server/prisma";

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

const calculateTotalAmount = (unitPriceExclTax: number | null, quantity: number) => {
  const price = unitPriceExclTax ?? 0;
  const subtotal = price * quantity;
  const tax = Math.round(subtotal * 0.1);
  return subtotal + tax;
};

const updateSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

const buildInquiryDetail = async (inquiry: {
  id: string;
  listingId: string;
  buyerUserId: string;
  sellerUserId: string;
  quantity: number;
  shippingAddress: string | null;
  contactPerson: string | null;
  desiredShipDate: string | null;
  desiredPaymentDate: string | null;
  body: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) => {
  const [listing, buyerUser, sellerUser] = await Promise.all([
    prisma.listing.findUnique({
      where: { id: inquiry.listingId },
      select: { maker: true, machineName: true, unitPriceExclTax: true },
    }),
    prisma.user.findUnique({ where: { id: inquiry.buyerUserId }, select: { companyName: true, id: true } }),
    prisma.user.findUnique({ where: { id: inquiry.sellerUserId }, select: { companyName: true, id: true } }),
  ]);

  return {
    id: inquiry.id,
    listingId: inquiry.listingId,
    buyerUserId: inquiry.buyerUserId,
    sellerUserId: inquiry.sellerUserId,
    status: inquiry.status,
    buyerCompanyName: buyerUser?.companyName ?? inquiry.buyerUserId,
    sellerCompanyName: sellerUser?.companyName ?? inquiry.sellerUserId,
    makerName: listing?.maker ?? null,
    productName: listing?.machineName ?? "商品",
    quantity: inquiry.quantity,
    unitPrice: listing?.unitPriceExclTax ?? 0,
    totalAmount: calculateTotalAmount(listing?.unitPriceExclTax ?? null, inquiry.quantity),
    shippingAddress: inquiry.shippingAddress ?? "",
    contactPerson: inquiry.contactPerson ?? "",
    desiredShipDate: inquiry.desiredShipDate ?? "",
    desiredPaymentDate: inquiry.desiredPaymentDate ?? "",
    memo: inquiry.body ?? "",
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
  const nextStatus = parsed.data.action === "accept" ? "ACCEPTED" : "REJECTED";

  try {
    const inquiry = await prisma.onlineInquiry.findUnique({ where: { id: inquiryId } });

    if (!inquiry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (inquiry.sellerUserId !== currentUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.onlineInquiry.update({
      where: { id: inquiryId },
      data: { status: nextStatus },
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
