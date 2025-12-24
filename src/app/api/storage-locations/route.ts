import { NextResponse } from "next/server";

import { prisma } from "@/lib/server/prisma";

const storageLocationClient = prisma.storageLocation;

const handleUnknownError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

export async function GET(request: Request) {
  const ownerUserId = request.headers.get("x-dev-user-id");

  if (!ownerUserId) {
    return NextResponse.json({ error: "Missing owner user id" }, { status: 400 });
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
