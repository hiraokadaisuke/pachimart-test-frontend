import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/server/prisma";

type DealingRecord = {
  id: number;
  status: string;
  sellerUserId: string;
  buyerUserId: string | null;
  payload: Prisma.JsonValue | null;
  naviId: number;
  createdAt: Date;
  updatedAt: Date;
  navi: {
    id: number;
    ownerUserId: string;
    buyerUserId: string | null;
    payload: Prisma.JsonValue | null;
    listingSnapshot: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  sellerUser: { id: string; companyName: string } | null;
  buyerUser: { id: string; companyName: string } | null;
};

type DealingDetailDto = {
  id: number;
  status: string;
  sellerUserId: string;
  buyerUserId: string | null;
  payload: Prisma.JsonValue | null;
  naviId: number;
  createdAt: string;
  updatedAt: string;
  navi?: {
    id: number;
    ownerUserId: string;
    buyerUserId: string | null;
    payload: Prisma.JsonValue | null;
    listingSnapshot: Prisma.JsonValue | null;
    createdAt: string;
    updatedAt: string;
  };
  sellerUser?: { id: string; companyName: string } | null;
  buyerUser?: { id: string; companyName: string } | null;
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

const toDto = (dealing: DealingRecord): DealingDetailDto => ({
  id: dealing.id,
  status: dealing.status,
  sellerUserId: dealing.sellerUserId,
  buyerUserId: dealing.buyerUserId,
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
    : undefined,
  sellerUser: dealing.sellerUser,
  buyerUser: dealing.buyerUser,
});

const toRecord = (dealing: unknown): DealingRecord => {
  if (!dealing || typeof dealing !== "object") {
    throw new Error("Dealing result was not an object");
  }

  const candidate = dealing as Record<string, unknown>;

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
  const sellerCandidate = candidate.sellerUser as Record<string, unknown> | null;
  const buyerCandidate = candidate.buyerUser as Record<string, unknown> | null;

  const toOptionalString = (value: unknown) =>
    value === null || value === undefined ? null : String(value);

  return {
    id: Number(candidate.id),
    status: String(candidate.status),
    sellerUserId: String(candidate.sellerUserId),
    buyerUserId: toOptionalString(candidate.buyerUserId),
    payload: (candidate.payload as Prisma.JsonValue | null) ?? null,
    naviId: Number(candidate.naviId ?? 0),
    createdAt: toDate(candidate.createdAt),
    updatedAt: toDate(candidate.updatedAt, toDate(candidate.createdAt)),
    navi: naviCandidate
      ? {
          id: Number(naviCandidate.id),
          ownerUserId: String(naviCandidate.ownerUserId),
          buyerUserId: toOptionalString(naviCandidate.buyerUserId),
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

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = parseId(params.id);

  if (!id) {
    return NextResponse.json({ error: "Invalid id parameter" }, { status: 400 });
  }

  try {
    const dealing = await prisma.trade.findUnique({
      where: { id } as any,
      include: { navi: true, sellerUser: true, buyerUser: true } as any,
    });

    if (!dealing) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    return NextResponse.json(toDto(toRecord(dealing)));
  } catch (error) {
    console.error("Failed to fetch in-progress trade", error);
    return NextResponse.json(
      { error: "Failed to fetch trade", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
