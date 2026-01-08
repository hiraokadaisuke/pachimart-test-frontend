import { Prisma, NaviStatus, NaviType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { getCurrentUserId } from "@/lib/server/currentUser";
import { resolveUserLookupIds } from "@/lib/server/users";

const shippingInfoSchema = z.object({
  companyName: z.string().optional(),
  zip: z.string().optional(),
  address: z.string().optional(),
  tel: z.string().optional(),
  personName: z.string().optional(),
});

const contactSchema = z.object({
  contactId: z.string(),
  name: z.string(),
});

const updateShippingSchema = z.object({
  shipping: shippingInfoSchema,
  contacts: z.array(contactSchema).optional(),
});

type NaviRecord = {
  id: number;
  status: NaviStatus;
  naviType: NaviType;
  ownerUserId: string;
  buyerUserId: string | null;
  listingId: string | null;
  listingSnapshot: Prisma.JsonValue | null;
  payload: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

const parseNaviId = (value: string) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const toRecord = (dealing: unknown): NaviRecord => {
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

  return {
    id: Number(candidate.id),
    status: candidate.status as NaviStatus,
    naviType: (candidate.naviType as NaviType | undefined) ?? NaviType.PHONE_AGREEMENT,
    ownerUserId: String(candidate.ownerUserId),
    buyerUserId: (candidate.buyerUserId as string | null) ?? null,
    listingId: (candidate.listingId as string | null) ?? null,
    listingSnapshot: (candidate.listingSnapshot as Prisma.JsonValue | null) ?? null,
    payload: (candidate.payload as Prisma.JsonValue | null) ?? null,
    createdAt: toDate(candidate.createdAt),
    updatedAt: toDate(candidate.updatedAt, toDate(candidate.createdAt)),
  };
};

const resolveBuyerUserId = (dealing: NaviRecord): string | null => {
  if (dealing.buyerUserId) return dealing.buyerUserId;

  if (dealing.payload && typeof dealing.payload === "object" && !Array.isArray(dealing.payload)) {
    const buyerId = (dealing.payload as Record<string, unknown>).buyerId;
    if (typeof buyerId === "string" && buyerId.trim().length > 0) {
      return buyerId;
    }
  }

  return null;
};

export async function PATCH(request: Request, { params }: { params: { naviId: string } }) {
  const naviId = parseNaviId(params.naviId);
  const actorUserId = getCurrentUserId(request);

  if (!naviId) {
    return NextResponse.json({ error: "Invalid id parameter" }, { status: 400 });
  }

  if (!actorUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const parsed = updateShippingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", detail: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const lookupIds = await resolveUserLookupIds(actorUserId);
    const result = await (prisma as any).$transaction(async (tx: any) => {
      const existing = await tx.navi.findUnique({ where: { id: naviId } as any });

      if (!existing) {
        return { updated: null };
      }

      const dealing = toRecord(existing);
      const buyerUserId = resolveBuyerUserId(dealing);

      if (!buyerUserId || !lookupIds.includes(buyerUserId)) {
        return { updated: null, status: 403 as const };
      }

      const payload = dealing.payload && typeof dealing.payload === "object" && !Array.isArray(dealing.payload)
        ? { ...(dealing.payload as Record<string, unknown>) }
        : {};

      const shipping = parsed.data.shipping;
      const contacts = parsed.data.contacts;

      const updatedPayload = {
        ...payload,
        buyerShippingAddress: shipping,
        shipping,
        buyerContactName: shipping.personName ?? (payload as Record<string, unknown>).buyerContactName,
        buyerContacts: contacts ?? (payload as Record<string, unknown>).buyerContacts,
      } satisfies Record<string, unknown>;

      const updatedNavi = await tx.navi.update({
        where: { id: naviId } as any,
        data: { payload: updatedPayload as Prisma.JsonValue, updatedAt: new Date() },
      });

      await tx.trade
        .updateMany({
          where: { naviId },
          data: { payload: updatedPayload as Prisma.JsonValue },
        })
        .catch((error: unknown) => {
          console.warn("Failed to sync shipping info to trade payload", { error, naviId });
        });

      return { updated: toRecord(updatedNavi) };
    });

    if (!result.updated) {
      return NextResponse.json({ error: "Trade not found or unauthorized" }, { status: result.status ?? 404 });
    }

    return NextResponse.json({
      shipping: parsed.data.shipping,
      contacts: parsed.data.contacts ?? null,
      updatedAt: result.updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to update shipping info", error);
    return NextResponse.json(
      { error: "Failed to update shipping info", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
