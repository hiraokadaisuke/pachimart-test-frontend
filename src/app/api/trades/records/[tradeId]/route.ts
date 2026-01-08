import { Prisma, DealingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { getCurrentUser } from "@/lib/server/currentUser";
import {
  buildStatusUpdate,
  findStatusTransition,
  resolveActorRole,
} from "@/lib/dealings/statusMachine";
import { recordLedgerForStatus, validateTradeLedgerConsistency } from "@/lib/server/ledger";
import { getUserIdCandidates } from "@/lib/server/users";

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

const toRecord = (dealing: unknown) => {
  if (!dealing || typeof dealing !== "object") {
    throw new Error("Dealing result was not an object");
  }

  const candidate = dealing as Record<string, unknown>;
  const naviCandidate = candidate.navi as Record<string, unknown> | null;
  const sellerCandidate = candidate.sellerUser as Record<string, unknown> | null;
  const buyerCandidate = candidate.buyerUser as Record<string, unknown> | null;

  return {
    id: Number(candidate.id),
    sellerUserId: String(candidate.sellerUserId),
    buyerUserId: String(candidate.buyerUserId),
    status: candidate.status as DealingStatus,
    paymentAt: (candidate.paymentAt as Date | null) ?? null,
    completedAt: (candidate.completedAt as Date | null) ?? null,
    canceledAt: (candidate.canceledAt as Date | null) ?? null,
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
          listingSnapshot: (naviCandidate.listingSnapshot as Prisma.JsonValue | null) ?? null,
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

const toDto = (dealing: ReturnType<typeof toRecord>) => ({
  id: dealing.id,
  sellerUserId: dealing.sellerUserId,
  buyerUserId: dealing.buyerUserId,
  status: dealing.status,
  paymentAt: dealing.paymentAt ? dealing.paymentAt.toISOString() : null,
  completedAt: dealing.completedAt ? dealing.completedAt.toISOString() : null,
  canceledAt: dealing.canceledAt ? dealing.canceledAt.toISOString() : null,
  payload: (dealing.payload as Prisma.JsonValue | null) ?? null,
  naviId: dealing.naviId,
  createdAt: dealing.createdAt.toISOString(),
  updatedAt: dealing.updatedAt.toISOString(),
  navi: dealing.navi
    ? {
        id: dealing.navi.id,
        ownerUserId: dealing.navi.ownerUserId,
        buyerUserId: dealing.navi.buyerUserId,
        payload: (dealing.navi.payload as Prisma.JsonValue | null) ?? null,
        listingSnapshot: (dealing.navi.listingSnapshot as Prisma.JsonValue | null) ?? null,
        createdAt: dealing.navi.createdAt.toISOString(),
        updatedAt: dealing.navi.updatedAt.toISOString(),
      }
    : null,
  sellerUser: dealing.sellerUser,
  buyerUser: dealing.buyerUser,
});

const updateDealingSchema = z.object({
  status: z.nativeEnum(DealingStatus, {
    errorMap: () => ({ message: "status must be a valid DealingStatus" }),
  }),
});

const parseId = (raw: string) => {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

export async function PATCH(request: Request, { params }: { params: { tradeId: string } }) {
  const tradeId = parseId(params.tradeId);
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentUserIds = getUserIdCandidates(currentUser);

  if (!tradeId) {
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

  const parsed = updateDealingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", detail: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.dealing.findUnique({
      where: { id: tradeId } as any,
      include: { navi: true, sellerUser: true, buyerUser: true } as any,
    });

    if (!existing) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const record = toRecord(existing);

    if (!currentUserIds.includes(record.sellerUserId) && !currentUserIds.includes(record.buyerUserId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetStatus = parsed.data.status;
    const now = new Date();

    if (record.status === targetStatus) {
      return NextResponse.json(toDto(record));
    }

    const actorUserId = currentUserIds.includes(record.buyerUserId)
      ? record.buyerUserId
      : record.sellerUserId;
    const actorRole = resolveActorRole(record.buyerUserId, record.sellerUserId, actorUserId);
    const transition = findStatusTransition(record.status, targetStatus);

    if (!transition) {
      return NextResponse.json(
        { error: "Invalid status transition" },
        { status: 409 }
      );
    }

    if (transition.actor !== "any" && transition.actor !== actorRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const update = buildStatusUpdate(
      record.status,
      transition,
      { paymentAt: record.paymentAt, completedAt: record.completedAt },
      now
    ) as Prisma.DealingUpdateInput;

    const updated = await prisma.dealing.update({
      where: { id: tradeId } as any,
      data: update,
      include: { navi: true, sellerUser: true, buyerUser: true } as any,
    });

    const updatedRecord = toRecord(updated);
    await recordLedgerForStatus(record.status, targetStatus, updatedRecord, currentUser.id);
    const warnings = await validateTradeLedgerConsistency(updatedRecord.id);

    const response = NextResponse.json(toDto(updatedRecord));
    if (warnings.length) {
      response.headers.set("x-ledger-warnings", encodeURIComponent(JSON.stringify(warnings)));
    }

    return response;
  } catch (error) {
    console.error("Failed to update trade", error);
    return NextResponse.json(
      { error: "Failed to update trade", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
