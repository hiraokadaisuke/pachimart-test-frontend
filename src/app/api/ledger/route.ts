import { LedgerEntryCategory, LedgerEntryKind } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId } from "@/lib/server/currentUser";
import { addLedgerEntry } from "@/lib/server/ledger";
import { prisma } from "@/lib/server/prisma";

const entrySchema = z.object({
  category: z.nativeEnum(LedgerEntryCategory),
  kind: z.nativeEnum(LedgerEntryKind).optional(),
  amountYen: z.number().int().positive(),
  tradeId: z.number().int().optional(),
  occurredAt: z.string().datetime().optional(),
  counterpartyName: z.string().optional(),
  makerName: z.string().optional(),
  itemName: z.string().optional(),
  memo: z.string().optional(),
  balanceAfterYen: z.number().int().optional(),
  breakdown: z.unknown().optional(),
});

const toDto = (entry: unknown) => {
  if (!entry || typeof entry !== "object") return null;
  const candidate = entry as Record<string, unknown>;

  const occurredAt = candidate.occurredAt as Date | string | undefined;
  const occurredAtIso = occurredAt instanceof Date ? occurredAt.toISOString() : String(occurredAt ?? "");

  return {
    id: String(candidate.id ?? ""),
    userId: String(candidate.userId ?? ""),
    tradeId: candidate.tradeId as number | null | undefined,
    category: candidate.category as LedgerEntryCategory,
    kind: (candidate.kind as LedgerEntryKind | undefined) ?? LedgerEntryKind.PLANNED,
    amountYen: Number(candidate.amountYen ?? 0),
    occurredAt: occurredAtIso,
    counterpartyName: (candidate.counterpartyName as string | null) ?? null,
    makerName: (candidate.makerName as string | null) ?? null,
    itemName: (candidate.itemName as string | null) ?? null,
    memo: (candidate.memo as string | null) ?? null,
    balanceAfterYen: (candidate.balanceAfterYen as number | null) ?? null,
    breakdown: candidate.breakdown,
  };
};

export async function GET(request: Request) {
  const currentUserId = getCurrentUserId(request);

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const entries = await prisma.ledgerEntry.findMany({
      where: { userId: currentUserId },
      orderBy: { occurredAt: "desc" },
    });

    return NextResponse.json(entries.map(toDto).filter(Boolean));
  } catch (error) {
    console.error("Failed to fetch ledger entries", error);
    return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const currentUserId = getCurrentUserId(request);

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = entrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", detail: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const created = await addLedgerEntry({
      userId: currentUserId,
      ...parsed.data,
      occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : undefined,
    });

    return NextResponse.json(toDto(created));
  } catch (error) {
    console.error("Failed to create ledger entry", error);
    return NextResponse.json({ error: "Failed to create ledger" }, { status: 500 });
  }
}
