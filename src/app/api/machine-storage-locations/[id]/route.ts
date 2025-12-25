import { NextResponse } from "next/server";

import { prisma } from "@/lib/server/prisma";

const machineStorageLocationClient = prisma.machineStorageLocation;

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

const parseNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return NaN;
};

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const ownerUserId = request.headers.get("x-dev-user-id");
  const { id } = context.params;

  if (!ownerUserId) {
    return NextResponse.json({ error: "Missing owner user id" }, { status: 400 });
  }

  try {
    const existing = await machineStorageLocationClient.findUnique({ where: { id } });

    if (!existing || !existing.isActive) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing.ownerUserId !== ownerUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    const updated = await machineStorageLocationClient.update({
      where: { id },
      data: {
        name: String(body.name),
        postalCode: String(body.postalCode),
        prefecture: String(body.prefecture),
        city: String(body.city),
        addressLine: String(body.addressLine),
        handlingFeePerUnit,
        shippingFeesByRegion: body.shippingFeesByRegion,
      },
    });

    return NextResponse.json({
      id: String(updated.id),
      ownerUserId: String(updated.ownerUserId),
      name: String(updated.name),
      postalCode: String(updated.postalCode),
      prefecture: String(updated.prefecture),
      city: String(updated.city),
      addressLine: String(updated.addressLine),
      handlingFeePerUnit: Number(updated.handlingFeePerUnit),
      shippingFeesByRegion: updated.shippingFeesByRegion,
      isActive: Boolean(updated.isActive),
      createdAt: new Date(updated.createdAt).toISOString(),
      updatedAt: new Date(updated.updatedAt).toISOString(),
    });
  } catch (error) {
    console.error("Failed to update machine storage location", error);
    return NextResponse.json(
      {
        error: "Failed to update machine storage location",
        detail: handleUnknownError(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  const ownerUserId = request.headers.get("x-dev-user-id");
  const { id } = context.params;

  if (!ownerUserId) {
    return NextResponse.json({ error: "Missing owner user id" }, { status: 400 });
  }

  try {
    const existing = await machineStorageLocationClient.findUnique({ where: { id } });

    if (!existing || !existing.isActive) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing.ownerUserId !== ownerUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await machineStorageLocationClient.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      id: String(updated.id),
      isActive: Boolean(updated.isActive),
    });
  } catch (error) {
    console.error("Failed to delete machine storage location", error);
    return NextResponse.json(
      {
        error: "Failed to delete machine storage location",
        detail: handleUnknownError(error),
      },
      { status: 500 }
    );
  }
}
