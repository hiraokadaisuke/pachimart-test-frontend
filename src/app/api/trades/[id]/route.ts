import { Prisma, TradeNaviStatus, TradeStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";

const updateTradeSchema = z.object({
  status: z.nativeEnum(TradeNaviStatus, {
    errorMap: () => ({ message: "status must be a valid TradeNaviStatus" }),
  }),
});

type TradeNaviRecord = {
  id: number;
  status: TradeNaviStatus;
  ownerUserId: string;
  buyerUserId: string | null;
  payload: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

const toDto = (trade: TradeNaviRecord, tradeId?: number) => ({
  id: trade.id,
  status: trade.status,
  ownerUserId: trade.ownerUserId,
  buyerUserId: trade.buyerUserId,
  payload: (trade.payload as Prisma.JsonValue | null) ?? null,
  createdAt: trade.createdAt.toISOString(),
  updatedAt: trade.updatedAt.toISOString(),
  tradeId,
});

const toRecord = (trade: unknown): TradeNaviRecord => {
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
    status: candidate.status as TradeNaviStatus,
    ownerUserId: String(candidate.ownerUserId),
    buyerUserId: (candidate.buyerUserId as string | null) ?? null,
    payload: (candidate.payload as Prisma.JsonValue | null) ?? null,
    createdAt: toDate(candidate.createdAt),
    updatedAt: toDate(candidate.updatedAt, toDate(candidate.createdAt)),
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

class BuyerRequiredError extends Error {
  constructor() {
    super("buyerUserId is required to approve");
  }
}

class TradeNotFoundError extends Error {}

const resolveBuyerUserId = (trade: TradeNaviRecord): string | null => {
  if (trade.buyerUserId) return trade.buyerUserId;

  if (
    trade.payload &&
    typeof trade.payload === "object" &&
    !Array.isArray(trade.payload)
  ) {
    const buyerId = (trade.payload as Record<string, unknown>).buyerId;
    if (typeof buyerId === "string" && buyerId.trim().length > 0) {
      return buyerId;
    }
  }

  return null;
};

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = parseId(params.id);

  if (!id) {
    return NextResponse.json({ error: "Invalid id parameter" }, { status: 400 });
  }

  try {
    // Cast to any to sidestep missing generated Prisma types in CI while keeping runtime numeric id
    const trade = await prisma.tradeNavi.findUnique({ where: { id } as any });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    return NextResponse.json(toDto(toRecord(trade)));
  } catch (error) {
    console.error("Failed to fetch trade", error);
    return NextResponse.json(
      { error: "Failed to fetch trade", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const id = parseId(params.id);

  if (!id) {
    return NextResponse.json({ error: "Invalid id parameter" }, { status: 400 });
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

  const parsed = updateTradeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", detail: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const { updated, trade } = await prisma.$transaction(async (tx) => {
      // Cast to any to sidestep missing generated Prisma types in CI while keeping runtime numeric id
      const existing = await tx.tradeNavi.findUnique({ where: { id } as any });

      if (!existing) {
        throw new TradeNotFoundError();
      }

      const updatedNavi = await tx.tradeNavi.update({
        where: { id } as any,
        data: { status: parsed.data.status },
      });

      let createdTrade: Prisma.TradeGetPayload<{ select: { id: true } }> | null =
        null;

      if (
        parsed.data.status === TradeNaviStatus.APPROVED &&
        existing.status !== TradeNaviStatus.APPROVED
      ) {
        const buyerUserId = resolveBuyerUserId(toRecord(updatedNavi));

        if (!buyerUserId) {
          throw new BuyerRequiredError();
        }

        createdTrade = await tx.trade.upsert({
          where: { naviId: updatedNavi.id } as any,
          create: {
            sellerUserId: updatedNavi.ownerUserId,
            buyerUserId,
            status: TradeStatus.IN_PROGRESS,
            payload: updatedNavi.payload ?? Prisma.JsonNull,
            naviId: updatedNavi.id,
          },
          update: {},
          select: { id: true },
        });
      }

      return { updated: toRecord(updatedNavi), trade: createdTrade };
    });

    const tradeId = trade ? Number(trade.id) : undefined;

    return NextResponse.json(toDto(updated, tradeId));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2025" || error.code === "P2015")
    ) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    if (error instanceof TradeNotFoundError) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    if (error instanceof BuyerRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Failed to update trade", error);
    return NextResponse.json(
      { error: "Failed to update trade", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
