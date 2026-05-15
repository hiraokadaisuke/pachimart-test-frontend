import { NextResponse } from "next/server";
import { z } from "zod";
import { linkInventoryToOutboundSchedule } from "@/features/inventory/server";

const bodySchema = z.object({
  inventoryItemId: z.string().min(1),
  inventoryUnitId: z.string().min(1).nullable().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = bodySchema.parse(await request.json());
    await linkInventoryToOutboundSchedule({ outboundScheduleId: id, inventoryItemId: body.inventoryItemId, inventoryUnitId: body.inventoryUnitId ?? null });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "紐付けに失敗しました。";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
