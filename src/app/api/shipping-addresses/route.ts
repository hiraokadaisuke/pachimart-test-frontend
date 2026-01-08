import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { getCurrentUser } from "@/lib/server/currentUser";
import { getUserIdCandidates } from "@/lib/server/users";

const client = prisma.buyerShippingAddress;

const addressSchema = z.object({
  label: z.string().max(100).optional(),
  companyName: z.string().max(200).optional(),
  postalCode: z.string().max(20).optional(),
  prefecture: z.string().max(100).optional(),
  city: z.string().max(200).optional(),
  addressLine: z.string().max(500).optional(),
  tel: z.string().max(50).optional(),
  contactName: z.string().max(200).optional(),
});

type BuyerShippingAddressRecord = {
  id: string;
  ownerUserId: string;
  label: string | null;
  companyName: string | null;
  postalCode: string | null;
  prefecture: string | null;
  city: string | null;
  addressLine: string | null;
  tel: string | null;
  contactName: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type BuyerShippingAddressDto = {
  id: string;
  ownerUserId: string;
  label: string | null;
  companyName: string | null;
  postalCode: string | null;
  prefecture: string | null;
  city: string | null;
  addressLine: string | null;
  tel: string | null;
  contactName: string | null;
  createdAt: string;
  updatedAt: string;
};

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

const toRecord = (address: unknown): BuyerShippingAddressRecord => {
  if (!address || typeof address !== "object") {
    throw new Error("Address result was not an object");
  }

  const candidate = address as Record<string, unknown>;

  const toDate = (value: unknown, fallback?: Date): Date => {
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return fallback instanceof Date ? fallback : new Date();
  };

  return {
    id: String(candidate.id ?? ""),
    ownerUserId: String(candidate.ownerUserId ?? ""),
    label: (candidate.label as string | null | undefined) ?? null,
    companyName: (candidate.companyName as string | null | undefined) ?? null,
    postalCode: (candidate.postalCode as string | null | undefined) ?? null,
    prefecture: (candidate.prefecture as string | null | undefined) ?? null,
    city: (candidate.city as string | null | undefined) ?? null,
    addressLine: (candidate.addressLine as string | null | undefined) ?? null,
    tel: (candidate.tel as string | null | undefined) ?? null,
    contactName: (candidate.contactName as string | null | undefined) ?? null,
    isActive: Boolean(candidate.isActive ?? true),
    createdAt: toDate(candidate.createdAt),
    updatedAt: toDate(candidate.updatedAt, toDate(candidate.createdAt)),
  };
};

const toDto = (address: BuyerShippingAddressRecord): BuyerShippingAddressDto => ({
  id: address.id,
  ownerUserId: address.ownerUserId,
  label: address.label,
  companyName: address.companyName,
  postalCode: address.postalCode,
  prefecture: address.prefecture,
  city: address.city,
  addressLine: address.addressLine,
  tel: address.tel,
  contactName: address.contactName,
  createdAt: address.createdAt.toISOString(),
  updatedAt: address.updatedAt.toISOString(),
});

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownerUserIds = getUserIdCandidates(currentUser);

  try {
    const addresses = await client.findMany({
      where: { ownerUserId: { in: ownerUserIds }, isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(addresses.map((address: unknown) => toDto(toRecord(address))));
  } catch (error) {
    console.error("Failed to fetch shipping addresses", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping addresses", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownerUserId = currentUser.id;
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON payload", detail: handleUnknownError(error) },
      { status: 400 }
    );
  }

  const parsed = addressSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", detail: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const created = await client.create({
      data: {
        ownerUserId,
        label: parsed.data.label ?? null,
        companyName: parsed.data.companyName ?? null,
        postalCode: parsed.data.postalCode ?? null,
        prefecture: parsed.data.prefecture ?? null,
        city: parsed.data.city ?? null,
        addressLine: parsed.data.addressLine ?? null,
        tel: parsed.data.tel ?? null,
        contactName: parsed.data.contactName ?? null,
        isActive: true,
      },
    });

    return NextResponse.json(toDto(toRecord(created)), { status: 201 });
  } catch (error) {
    console.error("Failed to create shipping address", error);
    return NextResponse.json(
      { error: "Failed to create shipping address", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
