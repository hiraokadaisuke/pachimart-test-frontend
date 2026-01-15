import { Prisma, NaviType, DealingStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/server/prisma";
import { getCurrentUserId } from "@/lib/server/currentUser";
import { validateTradeLedgerConsistency } from "@/lib/server/ledger";

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

const buildPrismaErrorResponse = (error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return NextResponse.json(
      { error: "PrismaKnownError", code: error.code, meta: error.meta ?? null },
      { status: 500 }
    );
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      { error: "PrismaValidationError", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "InternalServerError", message: handleUnknownError(error) },
    { status: 500 }
  );
};

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

const toRecord = (dealing: unknown) => {
  if (!dealing || typeof dealing !== "object") {
    throw new Error("Dealing result was not an object");
  }

  const candidate = dealing as Record<string, unknown>;
  const naviCandidate = candidate.navi as Record<string, unknown> | null;
  const sellerCandidate = candidate.sellerUser as Record<string, unknown> | null;
  const buyerCandidate = candidate.buyerUser as Record<string, unknown> | null;

  return {
    id: Number(candidate.id),
    sellerUserId: String(candidate.sellerUserId),
    buyerUserId: String(candidate.buyerUserId),
    status: candidate.status as DealingStatus,
    paymentAt: (candidate.paymentAt as Date | null) ?? null,
    completedAt: (candidate.completedAt as Date | null) ?? null,
    canceledAt: (candidate.canceledAt as Date | null) ?? null,
    payload: (candidate.payload as Prisma.JsonValue | null) ?? null,
    naviId: (candidate.naviId as number | null) ?? null,
    createdAt: toDate(candidate.createdAt),
    updatedAt: toDate(candidate.updatedAt, toDate(candidate.createdAt)),
    navi: naviCandidate
      ? {
          id: Number(naviCandidate.id),
          ownerUserId: String(naviCandidate.ownerUserId),
          buyerUserId: (naviCandidate.buyerUserId as string | null) ?? null,
          payload: (naviCandidate.payload as Prisma.JsonValue | null) ?? null,
          listingSnapshot: (naviCandidate.listingSnapshot as Prisma.JsonValue | null) ?? null,
          naviType: (naviCandidate.naviType as NaviType | null) ?? null,
          createdAt: toDate(naviCandidate.createdAt),
          updatedAt: toDate(naviCandidate.updatedAt, toDate(naviCandidate.createdAt)),
        }
      : null,
    sellerUser: sellerCandidate
      ? { id: String(sellerCandidate.id), companyName: String(sellerCandidate.companyName) }
      : null,
    buyerUser: buyerCandidate
      ? { id: String(buyerCandidate.id), companyName: String(buyerCandidate.companyName) }
      : null,
  };
};

const toDto = (dealing: ReturnType<typeof toRecord>) => ({
  id: dealing.id,
  sellerUserId: dealing.sellerUserId,
  buyerUserId: dealing.buyerUserId,
  status: dealing.status,
  paymentAt: dealing.paymentAt ? dealing.paymentAt.toISOString() : null,
  completedAt: dealing.completedAt ? dealing.completedAt.toISOString() : null,
  canceledAt: dealing.canceledAt ? dealing.canceledAt.toISOString() : null,
  payload: (dealing.payload as Prisma.JsonValue | null) ?? null,
  naviId: dealing.naviId,
  createdAt: dealing.createdAt.toISOString(),
  updatedAt: dealing.updatedAt.toISOString(),
    navi: dealing.navi
      ? {
          id: dealing.navi.id,
          ownerUserId: dealing.navi.ownerUserId,
          buyerUserId: dealing.navi.buyerUserId,
          payload: (dealing.navi.payload as Prisma.JsonValue | null) ?? null,
          listingSnapshot: (dealing.navi.listingSnapshot as Prisma.JsonValue | null) ?? null,
          naviType: dealing.navi.naviType,
          createdAt: dealing.navi.createdAt.toISOString(),
          updatedAt: dealing.navi.updatedAt.toISOString(),
        }
      : null,
  sellerUser: dealing.sellerUser,
  buyerUser: dealing.buyerUser,
});

export async function GET(request: Request) {
  const currentDevUserId = getCurrentUserId(request);

  if (!currentDevUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { devUserId: currentDevUserId },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dealings = await prisma.dealing.findMany({
      where: {
        OR: [{ sellerUserId: currentUser.id }, { buyerUserId: currentUser.id }],
      },
      // Cast to any to sidestep missing generated Prisma types in CI while keeping runtime sort order
      orderBy: { createdAt: "desc" } as any,
      select: {
        id: true,
        sellerUserId: true,
        buyerUserId: true,
        status: true,
        paymentAt: true,
        completedAt: true,
        canceledAt: true,
        payload: true,
        naviId: true,
        createdAt: true,
        updatedAt: true,
        navi: {
          select: {
            id: true,
            ownerUserId: true,
            buyerUserId: true,
            payload: true,
            listingSnapshot: true,
            naviType: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        sellerUser: { select: { id: true, companyName: true } },
        buyerUser: { select: { id: true, companyName: true } },
      } as any,
    });

    const warnings = (
      await Promise.all(dealings.map((dealing) => validateTradeLedgerConsistency(Number((dealing as any).id))))
    ).flat();

    const response = NextResponse.json(dealings.map((dealing: unknown) => toDto(toRecord(dealing))));

    if (warnings.length) {
      response.headers.set("x-ledger-warnings", encodeURIComponent(JSON.stringify(warnings)));
    }

    return response;
  } catch (error) {
    console.error("Failed to fetch trades", error);
    return buildPrismaErrorResponse(error);
  }
}
