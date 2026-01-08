import { ExhibitStatus, Prisma, PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/server/currentUser";
import { prisma, type InMemoryPrismaClient } from "@/lib/server/prisma";
import { calculateOnlineInquiryTotals } from "@/lib/online-inquiries/totals";
import { getUserIdCandidates, resolveUserId } from "@/lib/server/users";

const listQuerySchema = z.object({
  role: z.enum(["buyer", "seller"]),
});

const requestSchema = z.object({
  listingId: z.string().min(1, "listingId is required"),
  quantity: z.number().int().positive("quantity must be a positive integer"),
  unitPriceExclTax: z.number().int().nonnegative("unitPriceExclTax must be zero or positive"),
  shippingFee: z.number().int().default(0),
  handlingFee: z.number().int().default(0),
  taxRate: z.number().nonnegative().default(0.1),
  makerName: z.string().optional(),
  productName: z.string().optional(),
  buyerUserId: z.string().min(1, "buyerUserId is required"),
  sellerUserId: z.string().optional(),
  buyerMemo: z.string().optional(),
  shippingAddress: z.string().optional(),
  contactPerson: z.string().optional(),
  desiredShipDate: z.string().optional(),
  desiredPaymentDate: z.string().optional(),
});

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUserIds = getUserIdCandidates(currentUser);
  const parsedQuery = listQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", detail: parsedQuery.error.format() },
      { status: 400 }
    );
  }

  const { role } = parsedQuery.data;

  try {
    const inquiries = await prisma.onlineInquiry.findMany({
      where:
        role === "buyer"
          ? { buyerUserId: { in: currentUserIds } }
          : { sellerUserId: { in: currentUserIds } },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    const listingIds = [...new Set(inquiries.map((inquiry) => inquiry.listingId))];
    const userIds = [
      ...new Set(inquiries.flatMap((inquiry) => [inquiry.buyerUserId, inquiry.sellerUserId])),
    ];

    const [exhibits, users] = await Promise.all([
      listingIds.length > 0
        ? prisma.exhibit.findMany({
            where: { id: { in: listingIds } },
            select: {
              id: true,
              maker: true,
              machineName: true,
              quantity: true,
              unitPriceExclTax: true,
            },
          })
        : Promise.resolve([]),
      userIds.length > 0
        ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, companyName: true } })
        : Promise.resolve([]),
    ]);

    const exhibitMap = new Map(exhibits.map((exhibit) => [exhibit.id, exhibit]));
    const userMap = new Map(users.map((user) => [user.id, user.companyName]));

    const payload = inquiries.map((inquiry) => {
      const exhibit = exhibitMap.get(inquiry.listingId);
      const makerName = inquiry.makerName ?? exhibit?.maker ?? null;
      const productName = inquiry.productName ?? exhibit?.machineName ?? "商品";
      const buyerCompanyName = userMap.get(inquiry.buyerUserId) ?? null;
      const sellerCompanyName = userMap.get(inquiry.sellerUserId) ?? null;
      const partnerName =
        role === "buyer"
          ? sellerCompanyName ?? inquiry.sellerUserId
          : buyerCompanyName ?? inquiry.buyerUserId;

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
        createdAt: inquiry.createdAt,
        updatedAt: inquiry.updatedAt,
        makerName,
        productName,
        machineName: productName,
        quantity: inquiry.quantity,
        unitPriceExclTax: inquiry.unitPriceExclTax,
        shippingFee: inquiry.shippingFee,
        handlingFee: inquiry.handlingFee,
        taxRate: inquiry.taxRate,
        totalAmount: totals.total,
        partnerName,
        buyerCompanyName,
        sellerCompanyName,
      };
    });

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Failed to list online inquiries", error);
    return NextResponse.json(
      { error: "Failed to fetch online inquiries", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUserIds = getUserIdCandidates(currentUser);
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
    unitPriceExclTax,
    shippingFee,
    handlingFee,
    taxRate,
    makerName,
    productName,
    buyerMemo,
    buyerUserId,
    sellerUserId,
    shippingAddress,
    contactPerson,
    desiredShipDate,
    desiredPaymentDate,
  } = parsed.data;

  if (!currentUserIds.includes(buyerUserId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const exhibit = await prisma.exhibit.findUnique({ where: { id: listingId } });

    if (!exhibit) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const resolvedBuyerUserId = await resolveUserId(buyerUserId);
    const resolvedSellerUserId = await resolveUserId(exhibit.sellerUserId);

    if (resolvedSellerUserId === resolvedBuyerUserId) {
      return NextResponse.json(
        { error: "出品者は自分の出品に問い合わせできません" },
        { status: 403 }
      );
    }

    if (sellerUserId) {
      const resolvedIncomingSellerUserId = await resolveUserId(sellerUserId);
      if (resolvedIncomingSellerUserId !== resolvedSellerUserId) {
        return NextResponse.json(
          { error: "出品者が一致しません。最新の情報を確認してください。" },
          { status: 400 }
        );
      }
    }

    if (exhibit.status === ExhibitStatus.SOLD) {
      return NextResponse.json(
        { error: "成約済みのためオンライン問い合わせは利用できません" },
        { status: 400 }
      );
    }

    const normalizedBody = (buyerMemo ?? "").toString().trim() || "問い合わせが送信されました。";
    const normalizedMaker = makerName ?? exhibit.maker ?? null;
    const normalizedProduct = productName ?? exhibit.machineName ?? null;
    const normalizedTaxRate = Number.isFinite(taxRate) ? taxRate : 0.1;
    const normalizedShippingFee = Number.isFinite(shippingFee) ? shippingFee : 0;
    const normalizedHandlingFee = Number.isFinite(handlingFee) ? handlingFee : 0;
    const normalizedUnitPrice = Number.isFinite(unitPriceExclTax) ? unitPriceExclTax : 0;

    const createInquiry = async (tx: Prisma.TransactionClient | InMemoryPrismaClient) =>
      tx.onlineInquiry.create({
        data: {
          listingId: exhibit.id,
          buyerUserId: resolvedBuyerUserId,
          sellerUserId: resolvedSellerUserId,
          body: normalizedBody,
          buyerMemo: normalizedBody,
          makerName: normalizedMaker,
          productName: normalizedProduct,
          unitPriceExclTax: normalizedUnitPrice,
          quantity,
          taxRate: normalizedTaxRate,
          shippingFee: normalizedShippingFee,
          handlingFee: normalizedHandlingFee,
          shippingAddress: shippingAddress ?? null,
          contactPerson: contactPerson ?? null,
          desiredShipDate: desiredShipDate ?? null,
          desiredPaymentDate: desiredPaymentDate ?? null,
          status: "INQUIRY_RESPONSE_REQUIRED",
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
