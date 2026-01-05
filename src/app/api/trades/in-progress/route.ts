import { Prisma, DealingStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/server/prisma";
import { getCurrentUserId } from "@/lib/server/currentUser";

type DealingRecord = {
  id: number;
  sellerUserId: string;
  buyerUserId: string;
  status: DealingStatus;
  paymentAt: Date | null;
  completedAt: Date | null;
  canceledAt: Date | null;
  payload: Prisma.JsonValue | null;
  naviId: number | null;
  createdAt: Date;
  updatedAt: Date;
  navi: {
    id: number;
    ownerUserId: string;
    buyerUserId: string | null;
    payload: Prisma.JsonValue | null;
    listingSnapshot: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  sellerUser: { id: string; companyName: string } | null;
  buyerUser: { id: string; companyName: string } | null;
};

const toDto = (dealing: DealingRecord) => ({
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
        createdAt: dealing.navi.createdAt.toISOString(),
        updatedAt: dealing.navi.updatedAt.toISOString(),
      }
    : null,
  sellerUser: dealing.sellerUser,
  buyerUser: dealing.buyerUser,
});

const toRecord = (dealing: unknown): DealingRecord => {
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

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

export async function GET(request: Request) {
  const currentUserId = getCurrentUserId(request);

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dealings = await prisma.dealing.findMany({
      where: {
        status: { notIn: [DealingStatus.COMPLETED, DealingStatus.CANCELED] },
        OR: [{ sellerUserId: currentUserId }, { buyerUserId: currentUserId }],
      },
      // Cast to any to sidestep missing generated Prisma types in CI while keeping runtime sort order
      orderBy: { createdAt: "desc" } as any,
      include: { navi: true, sellerUser: true, buyerUser: true } as any,
    });

    return NextResponse.json(dealings.map((dealing: unknown) => toDto(toRecord(dealing))));
  } catch (error) {
    console.error("Failed to fetch in-progress trades", error);
    return NextResponse.json(
      { error: "Failed to fetch trades", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
