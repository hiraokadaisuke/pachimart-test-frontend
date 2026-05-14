import { NextResponse } from "next/server";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { getCurrentUserId } from "@/lib/server/currentUser";

const schema = z.object({
  salesInvoiceIds: z.array(z.string().min(1)).max(200),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const ownerUserId = getCurrentUserId(request) ?? "dev_user_1";

  const prismaClient = prisma as PrismaClient;
  const schedules = await prismaClient.outboundSchedule.findMany({
    where: {
      ownerUserId,
      sourceId: { in: body.salesInvoiceIds },
    },
    select: { sourceId: true },
  });

  const scheduledInvoiceIds = Array.from(new Set(schedules.map((row: { sourceId: string | null }) => row.sourceId).filter((value: string | null): value is string => Boolean(value))));

  return NextResponse.json({ scheduledInvoiceIds });
}
