import { ListingType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";

const querySchema = z.object({
  type: z.nativeEnum(ListingType).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    type: url.searchParams.get("type") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameter" }, { status: 400 });
  }

  const { type } = parsed.data;

  const makers = await prisma.maker.findMany({
    where: type ? { machineModels: { some: { type } } } : undefined,
    orderBy: { name: "asc" },
  });

  const machineModels = await prisma.machineModel.findMany({
    where: type ? { type } : undefined,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    makers: makers.map((maker) => ({ id: maker.id, name: maker.name })),
    machineModels: machineModels.map((model) => ({
      id: model.id,
      makerId: model.makerId,
      type: model.type,
      name: model.name,
    })),
  });
}
