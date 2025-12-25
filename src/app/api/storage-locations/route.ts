import { NextResponse } from "next/server";

import { prisma } from "@/lib/server/prisma";
import { getCurrentUserId } from "@/lib/server/currentUser";

const storageLocationClient = prisma.storageLocation;

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

export async function GET(request: Request) {
  const ownerUserId = getCurrentUserId(request);

  if (!ownerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const locations = await storageLocationClient.findMany({
      where: { ownerUserId },
      orderBy: { updatedAt: "desc" },
    });

    const response = locations.map((location: any) => ({
      id: String(location.id),
      ownerUserId: String(location.ownerUserId),
      name: String(location.name),
      address: String(location.address),
      prefecture: (location.prefecture as string | null) ?? null,
      city: (location.city as string | null) ?? null,
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
