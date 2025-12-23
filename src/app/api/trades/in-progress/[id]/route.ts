import { NextResponse } from "next/server";

import { prisma } from "@/lib/server/prisma";

type TradeRecord = {
  id: number;
  status: string;
  sellerUserId: string;
  buyerUserId: string | null;
  naviId: number;
  createdAt: Date;
  updatedAt: Date;
  navi: {
    id: number;
    status: string;
    payload: unknown;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

type TradeDetailDto = {
  trade: {
    id: number;
    status: string;
    sellerUserId: string;
    buyerUserId: string | null;
    createdAt: string;
    updatedAt: string;
    naviId: number;
  };
  navi?: {
    id: number;
    status: string;
    payload: unknown;
    createdAt: string;
    updatedAt: string;
  };
};

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

const parseId = (id: string) => {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const toDto = (trade: TradeRecord): TradeDetailDto => ({
  trade: {
    id: trade.id,
    status: trade.status,
    sellerUserId: trade.sellerUserId,
    buyerUserId: trade.buyerUserId,
    createdAt: trade.createdAt.toISOString(),
    updatedAt: trade.updatedAt.toISOString(),
    naviId: trade.naviId,
  },
  navi: trade.navi
    ? {
        id: trade.navi.id,
        status: trade.navi.status,
        payload: trade.navi.payload,
        createdAt: trade.navi.createdAt.toISOString(),
        updatedAt: trade.navi.updatedAt.toISOString(),
      }
    : undefined,
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

  const toOptionalString = (value: unknown) =>
    value === null || value === undefined ? null : String(value);

  return {
    id: Number(candidate.id),
    status: String(candidate.status),
    sellerUserId: String(candidate.sellerUserId),
    buyerUserId: toOptionalString(candidate.buyerUserId),
    naviId: Number(candidate.naviId ?? 0),
    createdAt: toDate(candidate.createdAt),
    updatedAt: toDate(candidate.updatedAt, toDate(candidate.createdAt)),
    navi: naviCandidate
      ? {
          id: Number(naviCandidate.id),
          status: String(naviCandidate.status),
          payload: naviCandidate.payload,
          createdAt: toDate(naviCandidate.createdAt),
          updatedAt: toDate(naviCandidate.updatedAt, toDate(naviCandidate.createdAt)),
        }
      : null,
  };
};

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = parseId(params.id);

  if (!id) {
    return NextResponse.json({ error: "Invalid id parameter" }, { status: 400 });
  }

  try {
    const trade = await prisma.trade.findUnique({
      where: { id } as any,
      include: { navi: true } as any,
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    return NextResponse.json(toDto(toRecord(trade)));
  } catch (error) {
    console.error("Failed to fetch in-progress trade", error);
    return NextResponse.json(
      { error: "Failed to fetch trade", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
