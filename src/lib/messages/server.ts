import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeMessageRecord, toMessageDto } from "@/lib/messages/transform";
import { prisma } from "@/lib/server/prisma";
import { getCurrentUserId } from "@/lib/server/currentUser";

const messageInputSchema = z.object({
  tradeNaviId: z.number().int().positive(),
  body: z.string().trim().min(1).max(2000),
});

const parseTradeNaviId = (value: string | number | null | undefined) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const normalizeTradeNaviRecord = (tradeNavi: unknown) => {
  if (!tradeNavi || typeof tradeNavi !== "object") return null;

  const candidate = tradeNavi as Record<string, unknown>;
  const id = parseTradeNaviId(candidate.id as string | number | null | undefined);
  if (!id) return null;

  const ownerUserId = typeof candidate.ownerUserId === "string" ? candidate.ownerUserId : null;
  const buyerUserId = typeof candidate.buyerUserId === "string" ? candidate.buyerUserId : null;

  return { id, ownerUserId, buyerUserId };
};

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

const authorizeTradeNaviAccess = async (tradeNaviId: number, currentUserId: string) => {
  const navi = await prisma.tradeNavi.findUnique({ where: { id: tradeNaviId } });
  const normalized = normalizeTradeNaviRecord(navi);

  if (!normalized) {
    return { error: NextResponse.json({ error: "TradeNavi not found" }, { status: 404 }) } as const;
  }

  if (normalized.ownerUserId !== currentUserId && normalized.buyerUserId !== currentUserId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  }

  const senderRole = normalized.ownerUserId === currentUserId ? "seller" : "buyer";
  return { senderRole } as const;
};

export async function handleGetMessages(request: Request, tradeNaviIdOverride?: string | number | null) {
  const currentUserId = getCurrentUserId(request);

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const tradeNaviId = parseTradeNaviId(tradeNaviIdOverride ?? searchParams.get("tradeNaviId"));

  if (!tradeNaviId) {
    return NextResponse.json({ error: "Invalid tradeNaviId parameter" }, { status: 400 });
  }

  const authorization = await authorizeTradeNaviAccess(tradeNaviId, currentUserId);
  if ("error" in authorization) return authorization.error;

  try {
    const results = await prisma.message.findMany({
      where: { tradeNaviId },
      orderBy: { createdAt: "asc" },
    });

    const normalized = results.map(normalizeMessageRecord).map(toMessageDto);

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Failed to fetch messages", error);
    return NextResponse.json(
      { error: "Failed to fetch messages", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}

export async function handlePostMessage(request: Request, tradeNaviIdOverride?: string | number | null) {
  const currentUserId = getCurrentUserId(request);

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON payload", detail: handleUnknownError(error) },
      { status: 400 }
    );
  }

  const parsed = messageInputSchema.safeParse({ ...payload, tradeNaviId: tradeNaviIdOverride ?? (payload as any)?.tradeNaviId });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const authorization = await authorizeTradeNaviAccess(parsed.data.tradeNaviId, currentUserId);
  if ("error" in authorization) return authorization.error;

  try {
    const created = await prisma.message.create({
      data: {
        tradeNaviId: parsed.data.tradeNaviId,
        senderUserId: currentUserId,
        senderRole: authorization.senderRole,
        body: parsed.data.body,
      },
    });

    const dto = toMessageDto(normalizeMessageRecord(created));
    return NextResponse.json(dto, { status: 201 });
  } catch (error) {
    console.error("Failed to create message", error);
    return NextResponse.json(
      { error: "Failed to create message", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
