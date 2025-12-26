import { NextResponse } from "next/server";

import { prisma } from "@/lib/server/prisma";
import { getCurrentUserId } from "@/lib/server/currentUser";

const storageLocationClient = prisma.storageLocation;

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

const parseNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return NaN;
};

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const ownerUserId = getCurrentUserId(request);
  const { id } = context.params;

  if (!ownerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await storageLocationClient.findFirst({
      where: { id, ownerUserId, isActive: true },
      select: { id: true, ownerUserId: true, isActive: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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

    const updated = await storageLocationClient.update({
      where: { id },
      data: {
        name: String(body.name),
        address: (body.address as string | undefined) ?? undefined,
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
      address: (updated.address as string | null) ?? null,
      postalCode: (updated.postalCode as string | null) ?? null,
      prefecture: (updated.prefecture as string | null) ?? null,
      city: (updated.city as string | null) ?? null,
      addressLine: (updated.addressLine as string | null) ?? null,
      handlingFeePerUnit: updated.handlingFeePerUnit === null ? null : Number(updated.handlingFeePerUnit),
      shippingFeesByRegion: updated.shippingFeesByRegion ?? null,
      isActive: Boolean(updated.isActive),
      createdAt: new Date(updated.createdAt).toISOString(),
      updatedAt: new Date(updated.updatedAt).toISOString(),
    });
  } catch (error) {
    console.error("Failed to update storage location", error);
    return NextResponse.json(
      { error: "Failed to update storage location", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  const ownerUserId = getCurrentUserId(request);
  const { id } = context.params;

  if (!ownerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await storageLocationClient.findFirst({
      where: { id, ownerUserId, isActive: true },
      select: { id: true, ownerUserId: true, isActive: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await storageLocationClient.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      id: String(updated.id),
      isActive: Boolean(updated.isActive),
    });
  } catch (error) {
    console.error("Failed to delete storage location", error);
    return NextResponse.json(
      { error: "Failed to delete storage location", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
