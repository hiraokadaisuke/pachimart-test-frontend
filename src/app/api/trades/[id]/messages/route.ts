import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";

const messageSchema = z.object({
  senderUserId: z.string(),
  receiverUserId: z.string(),
  body: z.string(),
  naviId: z.number(),
  id: z.number(),
  createdAt: z.date(),
});

type MessageRecord = z.infer<typeof messageSchema>;

const messageDto = z.object({
  id: z.number(),
  naviId: z.number(),
  senderUserId: z.string(),
  receiverUserId: z.string(),
  body: z.string(),
  createdAt: z.string(),
});

type MessageDto = z.infer<typeof messageDto>;

const createMessageInput = z.object({
  senderUserId: z.string().min(1),
  receiverUserId: z.string().min(1),
  body: z.string().min(1).max(2000),
});

const parseNaviId = (naviId: string) => {
  const parsed = Number(naviId);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const normalizeMessage = (message: unknown): MessageRecord => {
  if (!message || typeof message !== "object") {
    throw new Error("Message must be an object");
  }

  const candidate = message as Record<string, unknown>;

  const toDate = (value: unknown) => {
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  };

  const parsed = messageSchema.safeParse({
    id: Number(candidate.id),
    naviId: Number(candidate.naviId),
    senderUserId: String(candidate.senderUserId ?? ""),
    receiverUserId: String(candidate.receiverUserId ?? ""),
    body: String(candidate.body ?? ""),
    createdAt: toDate(candidate.createdAt),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return parsed.data;
};

const toDto = (message: MessageRecord): MessageDto => ({
  id: message.id,
  naviId: message.naviId,
  senderUserId: message.senderUserId,
  receiverUserId: message.receiverUserId,
  body: message.body,
  createdAt: message.createdAt.toISOString(),
});

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const naviId = parseNaviId(params.id);

  if (!naviId) {
    return NextResponse.json({ error: "Invalid naviId parameter" }, { status: 400 });
  }

  try {
    const results = await prisma.message.findMany({
      where: { naviId } as any,
      orderBy: { createdAt: "asc" },
    });

    const normalized = results.map(normalizeMessage).map(toDto);

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Failed to fetch messages", error);
    return NextResponse.json(
      { error: "Failed to fetch messages", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const naviId = parseNaviId(params.id);

  if (!naviId) {
    return NextResponse.json({ error: "Invalid naviId parameter" }, { status: 400 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createMessageInput.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    const created = await prisma.message.create({
      data: {
        naviId,
        senderUserId: parsed.data.senderUserId,
        receiverUserId: parsed.data.receiverUserId,
        body: parsed.data.body,
      } as any,
    });

    const dto = toDto(normalizeMessage(created));

    return NextResponse.json(dto, { status: 201 });
  } catch (error) {
    console.error("Failed to create message", error);
    return NextResponse.json(
      { error: "Failed to create message", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
