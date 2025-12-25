import { NextResponse } from "next/server";

import { prisma } from "@/lib/server/prisma";
import { getCurrentUserId } from "@/lib/server/currentUser";

const machineStorageLocationClient = prisma.machineStorageLocation;

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

const parseNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return NaN;
};

export async function GET(request: Request) {
  const ownerUserId = getCurrentUserId(request);

  if (!ownerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const locations = await machineStorageLocationClient.findMany({
      where: { ownerUserId, isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(
      locations.map((location) => ({
        id: String(location.id),
        ownerUserId: String(location.ownerUserId),
        name: String(location.name),
        postalCode: String(location.postalCode),
        prefecture: String(location.prefecture),
        city: String(location.city),
        addressLine: String(location.addressLine),
        handlingFeePerUnit: Number(location.handlingFeePerUnit),
        shippingFeesByRegion: location.shippingFeesByRegion,
        isActive: Boolean(location.isActive),
        createdAt: new Date(location.createdAt).toISOString(),
        updatedAt: new Date(location.updatedAt).toISOString(),
      }))
    );
  } catch (error) {
    console.error("Failed to fetch machine storage locations", error);
    return NextResponse.json(
      {
        error: "Failed to fetch machine storage locations",
        detail: handleUnknownError(error),
      },
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

    const created = await machineStorageLocationClient.create({
      data: {
        ownerUserId,
        name: String(body.name),
        postalCode: String(body.postalCode),
        prefecture: String(body.prefecture),
        city: String(body.city),
        addressLine: String(body.addressLine),
        handlingFeePerUnit,
        shippingFeesByRegion: body.shippingFeesByRegion,
        isActive: true,
      },
    });

    return NextResponse.json({
      id: String(created.id),
      ownerUserId: String(created.ownerUserId),
      name: String(created.name),
      postalCode: String(created.postalCode),
      prefecture: String(created.prefecture),
      city: String(created.city),
      addressLine: String(created.addressLine),
      handlingFeePerUnit: Number(created.handlingFeePerUnit),
      shippingFeesByRegion: created.shippingFeesByRegion,
      isActive: Boolean(created.isActive),
      createdAt: new Date(created.createdAt).toISOString(),
      updatedAt: new Date(created.updatedAt).toISOString(),
    });
  } catch (error) {
    console.error("Failed to create machine storage location", error);
    return NextResponse.json(
      {
        error: "Failed to create machine storage location",
        detail: handleUnknownError(error),
      },
      { status: 500 }
    );
  }
}
