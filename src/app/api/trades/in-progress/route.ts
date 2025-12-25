import { Prisma, TradeStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/server/prisma";
import { getCurrentUserId } from "@/lib/server/currentUser";

type TradeRecord = {
  id: number;
  sellerUserId: string;
  buyerUserId: string;
  status: TradeStatus;
  payload: Prisma.JsonValue | null;
  naviId: number | null;
  createdAt: Date;
  updatedAt: Date;
  navi: {
    id: number;
    ownerUserId: string;
    buyerUserId: string | null;
    payload: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  sellerUser: { id: string; companyName: string } | null;
  buyerUser: { id: string; companyName: string } | null;
};

const toDto = (trade: TradeRecord) => ({
  id: trade.id,
  sellerUserId: trade.sellerUserId,
  buyerUserId: trade.buyerUserId,
  status: trade.status,
  payload: (trade.payload as Prisma.JsonValue | null) ?? null,
  naviId: trade.naviId,
  createdAt: trade.createdAt.toISOString(),
  updatedAt: trade.updatedAt.toISOString(),
  navi: trade.navi
    ? {
        id: trade.navi.id,
        ownerUserId: trade.navi.ownerUserId,
        buyerUserId: trade.navi.buyerUserId,
        payload: (trade.navi.payload as Prisma.JsonValue | null) ?? null,
        createdAt: trade.navi.createdAt.toISOString(),
        updatedAt: trade.navi.updatedAt.toISOString(),
      }
    : null,
  sellerUser: trade.sellerUser,
  buyerUser: trade.buyerUser,
});

const toRecord = (trade: unknown): TradeRecord => {
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

  const naviCandidate = candidate.navi as Record<string, unknown> | null;
  const sellerCandidate = candidate.sellerUser as Record<string, unknown> | null;
  const buyerCandidate = candidate.buyerUser as Record<string, unknown> | null;

  return {
    id: Number(candidate.id),
    sellerUserId: String(candidate.sellerUserId),
    buyerUserId: String(candidate.buyerUserId),
    status: candidate.status as TradeStatus,
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
    const trades = await prisma.trade.findMany({
      where: {
        status: TradeStatus.IN_PROGRESS,
        OR: [{ sellerUserId: currentUserId }, { buyerUserId: currentUserId }],
      },
      // Cast to any to sidestep missing generated Prisma types in CI while keeping runtime sort order
      orderBy: { createdAt: "desc" } as any,
      include: { navi: true, sellerUser: true, buyerUser: true } as any,
    });

    return NextResponse.json(trades.map((trade: unknown) => toDto(toRecord(trade))));
  } catch (error) {
    console.error("Failed to fetch in-progress trades", error);
    return NextResponse.json(
      { error: "Failed to fetch trades", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
