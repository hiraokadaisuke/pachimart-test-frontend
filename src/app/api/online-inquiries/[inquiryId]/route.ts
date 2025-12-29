import { NextResponse } from "next/server";

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

    const [listing, buyerUser, sellerUser] = await Promise.all([
      prisma.listing.findUnique({
        where: { id: inquiry.listingId },
        select: { maker: true, machineName: true, unitPriceExclTax: true },
      }),
      prisma.user.findUnique({ where: { id: inquiry.buyerUserId }, select: { companyName: true, id: true } }),
      prisma.user.findUnique({ where: { id: inquiry.sellerUserId }, select: { companyName: true, id: true } }),
    ]);

    const response = {
      id: inquiry.id,
      listingId: inquiry.listingId,
      buyerUserId: inquiry.buyerUserId,
      sellerUserId: inquiry.sellerUserId,
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

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch online inquiry detail", error);
    return NextResponse.json(
      { error: "Failed to fetch online inquiry", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
