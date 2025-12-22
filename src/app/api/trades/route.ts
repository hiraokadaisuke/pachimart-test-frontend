import { Prisma, TradeNaviStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";

type TradeNaviDto = {
  id: number;
  status: TradeNaviStatus;
  ownerUserId: string;
  buyerUserId: string | null;
  payload: Prisma.JsonValue | null;
  createdAt: string;
  updatedAt: string;
};

type TradeNaviRecord = {
  id: number;
  status: TradeNaviStatus;
  ownerUserId: string;
  buyerUserId: string | null;
  payload: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

const jsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ])
);

const createTradeSchema = z.object({
  ownerUserId: z.string().min(1, "ownerUserId is required"),
  buyerUserId: z.string().min(1).optional(),
  status: z.nativeEnum(TradeNaviStatus).optional(),
  payload: jsonValueSchema.optional(),
});

const toDto = (trade: TradeNaviRecord): TradeNaviDto => ({
  id: trade.id,
  status: trade.status,
  ownerUserId: trade.ownerUserId,
  buyerUserId: trade.buyerUserId,
  payload: (trade.payload as Prisma.JsonValue | null) ?? null,
  createdAt: trade.createdAt.toISOString(),
  updatedAt: trade.updatedAt.toISOString(),
});

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

export async function GET() {
  try {
    const trades = await prisma.tradeNavi.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(trades.map(toDto));
  } catch (error) {
    console.error("Failed to fetch trades", error);
    return NextResponse.json(
      { error: "Failed to fetch trades", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON payload", detail: handleUnknownError(error) },
      { status: 400 }
    );
  }

  const parsed = createTradeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", detail: parsed.error.format() },
      { status: 400 }
    );
  }

  const { ownerUserId, buyerUserId, status, payload } = parsed.data;

  try {
    const created = await prisma.tradeNavi.create({
      data: {
        ownerUserId,
        buyerUserId: buyerUserId ?? null,
        status: status ?? TradeNaviStatus.DRAFT,
        payload: payload ?? undefined,
      },
    });

    return NextResponse.json(toDto(created), { status: 201 });
  } catch (error) {
    console.error("Failed to create trade", error);
    return NextResponse.json(
      { error: "Failed to create trade", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
