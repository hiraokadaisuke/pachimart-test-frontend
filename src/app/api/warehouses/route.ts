import { NextResponse } from "next/server";

import { prisma } from "@/lib/server/prisma";
import { getCurrentUserId } from "@/lib/server/currentUser";

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

export async function GET(request: Request) {
  const ownerUserId = getCurrentUserId(request);

  if (!ownerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { ownerUserId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
      },
    });

    const response = warehouses.map((warehouse) => ({
      id: String(warehouse.id),
      name: String(warehouse.name),
      address: warehouse.address ?? undefined,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch warehouses", error);
    return NextResponse.json(
      { error: "Failed to fetch warehouses", detail: handleUnknownError(error) },
      { status: 500 }
    );
  }
}
