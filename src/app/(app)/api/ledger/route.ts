import { DealingStatus, LedgerEntryCategory, LedgerEntryKind, LedgerEntrySource, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId } from "@/lib/server/currentUser";
import { addLedgerEntry, validateTradeLedgerConsistency } from "@/lib/server/ledger";
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
  breakdown: z.custom<Prisma.JsonValue>().optional(),
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
    createdByUserId: String(candidate.createdByUserId ?? ""),
    source: (candidate.source as LedgerEntrySource | undefined) ?? LedgerEntrySource.TRADE_STATUS_TRANSITION,
    tradeStatusAtCreation: (candidate.tradeStatusAtCreation as string | null) ?? null,
  };
};

const safeParseDate = (value: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const stringifyCsv = (rows: Array<Array<string | number | null | undefined>>) =>
  rows
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");

export async function GET(request: Request) {
  const currentUserId = getCurrentUserId(request);

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const format = url.searchParams.get("format");
    const kind = url.searchParams.get("kind");
    const categoryParams = url.searchParams.getAll("category");
    const from = safeParseDate(url.searchParams.get("from"));
    const to = safeParseDate(url.searchParams.get("to"));
    const counterparty = url.searchParams.get("counterparty");
    const tradeIdParam = url.searchParams.get("tradeId");

    const categories = categoryParams
      .flatMap((param) => param.split(","))
      .map((value) => value.trim())
      .filter((value): value is LedgerEntryCategory =>
        Object.values(LedgerEntryCategory).includes(value as LedgerEntryCategory)
      );

    const tradeId = tradeIdParam ? Number(tradeIdParam) : null;
    const where: { userId?: string } & Prisma.LedgerEntryWhereInput = {
      userId: currentUserId,
    };

    if (from || to) {
      where.occurredAt = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      } as Prisma.DateTimeFilter;
    }

    if (kind && Object.values(LedgerEntryKind).includes(kind as LedgerEntryKind)) {
      where.kind = kind as LedgerEntryKind;
    }

    if (categories.length > 0) {
      where.category = { in: categories } as any;
    }

    if (counterparty) {
      where.counterpartyName = { contains: counterparty, mode: "insensitive" };
    }

    if (Number.isInteger(tradeId)) {
      where.tradeId = tradeId as number;
    }

    const entries = await prisma.ledgerEntry.findMany({
      where,
      orderBy: { occurredAt: "desc" },
    });

    const tradeIds = Array.from(
      new Set(entries.map((entry) => entry.tradeId).filter((id): id is number => typeof id === "number"))
    );
    const warnings = (await Promise.all(tradeIds.map((id) => validateTradeLedgerConsistency(id)))).flat();

    if (format === "csv") {
      const header = [
        "id",
        "tradeId",
        "category",
        "kind",
        "amountYen",
        "occurredAt",
        "counterpartyName",
        "makerName",
        "itemName",
        "memo",
        "source",
        "tradeStatusAtCreation",
        "createdByUserId",
      ];

      const rows = entries.map((entry) => [
        entry.id,
        entry.tradeId ?? "",
        entry.category,
        entry.kind,
        entry.amountYen,
        entry.occurredAt.toISOString(),
        entry.counterpartyName ?? "",
        entry.makerName ?? "",
        entry.itemName ?? "",
        entry.memo ?? "",
        entry.source,
        entry.tradeStatusAtCreation ?? "",
        entry.createdByUserId,
      ]);

      const csv = `\ufeff${stringifyCsv([header, ...rows])}`;

      const headers = new Headers({
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=ledger.csv",
      });

      if (warnings.length) {
        headers.set("x-ledger-warnings", encodeURIComponent(JSON.stringify(warnings)));
      }

      return new Response(csv, { headers });
    }

    const response = NextResponse.json(entries.map(toDto).filter(Boolean));
    if (warnings.length) {
      response.headers.set("x-ledger-warnings", encodeURIComponent(JSON.stringify(warnings)));
    }

    return response;
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
    let tradeStatus: DealingStatus | null = null;
    if (parsed.data.tradeId) {
      const trade = await prisma.dealing.findUnique({
        where: { id: parsed.data.tradeId } as any,
        select: { status: true } as any,
      });
      tradeStatus = trade?.status ?? null;
    }

    const created = await addLedgerEntry({
      userId: currentUserId,
      ...parsed.data,
      occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : undefined,
      createdByUserId: currentUserId,
      source: LedgerEntrySource.MANUAL_ADJUSTMENT,
      tradeStatusAtCreation: tradeStatus,
    });

    return NextResponse.json(toDto(created));
  } catch (error) {
    console.error("Failed to create ledger entry", error);
    return NextResponse.json({ error: "Failed to create ledger" }, { status: 500 });
  }
}
