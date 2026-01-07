import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/server/prisma";
import { getCurrentUserId } from "@/lib/server/currentUser";
import { findDevUserById } from "@/lib/dev-user/users";

const storageLocationClient = prisma.storageLocation;

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

const parseNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return NaN;
};

const ensureUserExists = async (ownerUserId: string) => {
  const devUser = findDevUserById(ownerUserId);

  const existing = await prisma.user.findUnique({
    where: { id: ownerUserId },
    select: { id: true },
  });

  if (existing) return;

  await prisma.user.create({
    data: {
      id: ownerUserId,
      companyName: devUser?.companyName ?? "開発ユーザー",
      contactName: devUser?.contactName ?? undefined,
      address: devUser?.address ?? undefined,
      tel: devUser?.tel ?? undefined,
    },
  });
};

export async function GET(request: Request) {
  const ownerUserId = getCurrentUserId(request);

  if (!ownerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const locations = await storageLocationClient.findMany({
      where: { ownerUserId, isActive: true },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        ownerUserId: true,
        name: true,
        postalCode: true,
        prefecture: true,
        city: true,
        addressLine: true,
        handlingFeePerUnit: true,
        shippingFeesByRegion: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const response = locations.map((location: any) => ({
      id: String(location.id),
      ownerUserId: String(location.ownerUserId),
      name: String(location.name),
      address: (location.addressLine as string | null) ?? null,
      postalCode: (location.postalCode as string | null) ?? null,
      prefecture: (location.prefecture as string | null) ?? null,
      city: (location.city as string | null) ?? null,
      addressLine: (location.addressLine as string | null) ?? null,
      handlingFeePerUnit: location.handlingFeePerUnit === null
        ? null
        : Number(location.handlingFeePerUnit),
      shippingFeesByRegion: location.shippingFeesByRegion ?? null,
      createdAt: new Date(location.createdAt).toISOString(),
      updatedAt: new Date(location.updatedAt).toISOString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch storage locations", error);
    return NextResponse.json(
      { error: "Failed to fetch storage locations", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const ownerUserId = getCurrentUserId(request);

  if (!ownerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const handlingFeePerUnit = parseNumber(body?.handlingFeePerUnit);

    if (
      !body?.name ||
      !body?.postalCode ||
      !body?.prefecture ||
      !body?.city ||
      !body?.addressLine ||
      Number.isNaN(handlingFeePerUnit) ||
      !body?.shippingFeesByRegion
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await ensureUserExists(ownerUserId);

    const created = await storageLocationClient.create({
      data: {
        ownerUserId,
        name: String(body.name),
        postalCode: String(body.postalCode),
        prefecture: String(body.prefecture),
        city: String(body.city),
        addressLine: String(body.addressLine ?? body.address ?? ""),
        handlingFeePerUnit,
        shippingFeesByRegion: body.shippingFeesByRegion,
        isActive: true,
      },
    });

    return NextResponse.json({
      id: String(created.id),
      ownerUserId: String(created.ownerUserId),
      name: String(created.name),
      address: (created.addressLine as string | null) ?? null,
      postalCode: (created.postalCode as string | null) ?? null,
      prefecture: (created.prefecture as string | null) ?? null,
      city: (created.city as string | null) ?? null,
      addressLine: (created.addressLine as string | null) ?? null,
      handlingFeePerUnit: created.handlingFeePerUnit === null
        ? null
        : Number(created.handlingFeePerUnit),
      shippingFeesByRegion: created.shippingFeesByRegion ?? null,
      isActive: Boolean(created.isActive),
      createdAt: new Date(created.createdAt).toISOString(),
      updatedAt: new Date(created.updatedAt).toISOString(),
    });
  } catch (error) {
    console.error("Failed to create storage location", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Conflict", detail: "StorageLocation name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create storage location", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
