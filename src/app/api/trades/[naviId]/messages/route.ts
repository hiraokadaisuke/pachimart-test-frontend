import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeMessageRecord, toMessageDto } from "@/lib/messages/transform";
import { prisma } from "@/lib/server/prisma";

const messageClient = prisma.message;

const createMessageInput = z.object({
  senderUserId: z.string().min(1),
  receiverUserId: z.string().min(1),
  body: z.string().trim().min(1).max(2000),
});

const parseNaviId = (naviId: string) => {
  const parsed = Number(naviId);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

export async function GET(
  _request: Request,
  { params }: { params: { naviId: string } }
) {
  const naviId = parseNaviId(params.naviId);

  if (!naviId) {
    return NextResponse.json({ error: "Invalid naviId parameter" }, { status: 400 });
  }

  try {
    const results = await messageClient.findMany({
      where: { naviId } as any,
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

export async function POST(
  request: Request,
  { params }: { params: { naviId: string } }
) {
  const naviId = parseNaviId(params.naviId);

  if (!naviId) {
    return NextResponse.json({ error: "Invalid naviId parameter" }, { status: 400 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createMessageInput.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    const created = await messageClient.create({
      data: {
        naviId,
        senderUserId: parsed.data.senderUserId,
        receiverUserId: parsed.data.receiverUserId,
        body: parsed.data.body,
      } as any,
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
