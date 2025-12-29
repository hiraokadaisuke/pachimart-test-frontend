import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeMessageRecord, toMessageDto } from "@/lib/messages/transform";
import { prisma } from "@/lib/server/prisma";
import { getCurrentUserId } from "@/lib/server/currentUser";

const messageInputSchema = z.object({
  naviId: z.number().int().positive(),
  body: z.string().trim().min(1).max(2000),
});

const parseNaviId = (value: string | number | null | undefined) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const normalizeNaviRecord = (navi: unknown) => {
  if (!navi || typeof navi !== "object") return null;

  const candidate = navi as Record<string, unknown>;
  const id = parseNaviId(candidate.id as string | number | null | undefined);
  if (!id) return null;

  const ownerUserId = typeof candidate.ownerUserId === "string" ? candidate.ownerUserId : null;
  const buyerUserId = typeof candidate.buyerUserId === "string" ? candidate.buyerUserId : null;

  return { id, ownerUserId, buyerUserId };
};

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

const authorizeNaviAccess = async (naviId: number, currentUserId: string) => {
  const navi = await prisma.navi.findUnique({ where: { id: naviId } });
  const normalized = normalizeNaviRecord(navi);

  if (!normalized) {
    return { error: NextResponse.json({ error: "Navi not found" }, { status: 404 }) } as const;
  }

  if (normalized.ownerUserId !== currentUserId && normalized.buyerUserId !== currentUserId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  }

  const senderRole = normalized.ownerUserId === currentUserId ? "seller" : "buyer";
  return { senderRole } as const;
};

export async function handleGetMessages(request: Request, naviIdOverride?: string | number | null) {
  const currentUserId = getCurrentUserId(request);

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const naviId = parseNaviId(
    naviIdOverride ?? searchParams.get("naviId") ?? searchParams.get("tradeNaviId")
  );

  if (!naviId) {
    return NextResponse.json({ error: "Invalid naviId parameter" }, { status: 400 });
  }

  const authorization = await authorizeNaviAccess(naviId, currentUserId);
  if ("error" in authorization) return authorization.error;

  try {
    const results = await prisma.message.findMany({
      where: { naviId },
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

export async function handlePostMessage(request: Request, naviIdOverride?: string | number | null) {
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

  const base = typeof payload === "object" && payload !== null ? payload : {};
  const parsed = messageInputSchema.safeParse({
    ...(base as Record<string, unknown>),
    naviId: naviIdOverride ?? (base as any)?.naviId ?? (base as any)?.tradeNaviId,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const authorization = await authorizeNaviAccess(parsed.data.naviId, currentUserId);
  if ("error" in authorization) return authorization.error;

  try {
    const created = await prisma.message.create({
      data: {
        naviId: parsed.data.naviId,
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
