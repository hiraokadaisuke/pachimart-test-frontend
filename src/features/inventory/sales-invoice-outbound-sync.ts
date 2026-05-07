import { OutboundScheduleSourceType, OutboundStatus, InventoryShippingMethod, InventoryUnitStatus, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import type { SalesInvoiceItem } from "@/types/salesInvoices";

export type SalesInvoiceOutboundSyncInput = {
  ownerUserId: string;
  salesInvoiceId: string;
  salesInvoiceType: "vendor" | "hall";
  customerName?: string | null;
  destinationName?: string | null;
  destinationAddress?: string | null;
  destinationPhone?: string | null;
  machineShipDate?: string | Date | null;
  carrierName?: string | null;
  shippingMethod?: string | null;
  memo?: string | null;
  items: SalesInvoiceItem[];
};

export type SalesInvoiceOutboundSyncResult = { createdCount: number; skippedCount: number; warnings: string[]; schedules: Array<{ outboundScheduleId: string; inventoryItemId: string | null; inventoryUnitId: string | null; machineName: string; quantity: number; }>; };

const toShippingMethod = (v?: string | null): InventoryShippingMethod => (v?.includes("着払") ? "COLLECT" : "PREPAID");
const prismaClient = prisma as PrismaClient;

export async function syncSalesInvoiceToOutboundSchedules(input: SalesInvoiceOutboundSyncInput): Promise<SalesInvoiceOutboundSyncResult> {
  const warnings: string[] = [];
  let createdCount = 0;
  let skippedCount = 0;
  const schedules: SalesInvoiceOutboundSyncResult["schedules"] = [];

  for (const [index, item] of input.items.entries()) {
    if (!item.inventoryUnitId && !item.inventoryItemId) {
      skippedCount += 1;
      warnings.push(`明細${index + 1}: Unit/在庫紐付けが無いためスキップ`);
      continue;
    }

    const dedupeKey = `sales-invoice-outbound:${input.salesInvoiceId}:${item.itemId ?? index}:${item.inventoryUnitId ?? item.inventoryItemId ?? "none"}`;
    const exists = await prismaClient.outboundSchedule.findUnique({ where: { dedupeKey } });
    if (exists) {
      skippedCount += 1;
      warnings.push(`明細${index + 1}: 既に作成済み`);
      schedules.push({ outboundScheduleId: exists.id, inventoryItemId: exists.inventoryItemId, inventoryUnitId: item.inventoryUnitId ?? null, machineName: exists.modelNameSnapshot, quantity: exists.quantity });
      continue;
    }

    const unit = item.inventoryUnitId
      ? await prismaClient.inventoryUnit.findFirst({ where: { id: item.inventoryUnitId, ownerUserId: input.ownerUserId }, include: { inventoryItem: true } })
      : null;
    if (item.inventoryUnitId && !unit) {
      skippedCount += 1;
      warnings.push(`明細${index + 1}: Unitが見つからないかスコープ外`);
      continue;
    }
    if (unit && ["SHIPPED", "CANCELED"].includes(unit.status)) {
      skippedCount += 1;
      warnings.push(`明細${index + 1}: 出荷済み/取消済みUnitは対象外`);
      continue;
    }

    const inventoryItemId = unit?.inventoryItemId ?? item.inventoryItemId ?? null;
    const inventoryItem = inventoryItemId
      ? await prismaClient.inventoryItem.findFirst({ where: { id: inventoryItemId, ownerUserId: input.ownerUserId } })
      : null;
    if (!inventoryItem) {
      skippedCount += 1;
      warnings.push(`明細${index + 1}: 在庫が見つからないためスキップ`);
      continue;
    }

    const created = await prismaClient.outboundSchedule.create({
      data: {
        ownerUserId: input.ownerUserId,
        inventoryItemId: inventoryItem.id,
        expectedDate: input.machineShipDate ? new Date(input.machineShipDate) : new Date(),
        buyerName: input.customerName ?? input.destinationName ?? null,
        itemType: inventoryItem.itemType,
        makerNameSnapshot: inventoryItem.makerNameSnapshot,
        modelNameSnapshot: item.productName ?? inventoryItem.modelNameSnapshot,
        quantity: Math.max(1, item.quantity || 1),
        originLocationId: inventoryItem.storageLocationId,
        shippingMethod: toShippingMethod(input.shippingMethod ?? input.carrierName),
        status: OutboundStatus.PLANNED,
        sourceType: OutboundScheduleSourceType.MANUAL,
        sourceId: input.salesInvoiceId,
        dedupeKey,
        note: `販売伝票連携(${input.salesInvoiceType}) ${input.memo ?? ""}`.trim(),
      },
    });
    if (unit) {
      await prismaClient.inventoryUnit.update({ where: { id: unit.id }, data: { outboundScheduleId: created.id, status: unit.status === InventoryUnitStatus.IN_STOCK ? InventoryUnitStatus.RESERVED : unit.status } });
    }
    createdCount += 1;
    schedules.push({ outboundScheduleId: created.id, inventoryItemId: created.inventoryItemId, inventoryUnitId: unit?.id ?? item.inventoryUnitId ?? null, machineName: created.modelNameSnapshot, quantity: created.quantity });
  }

  return { createdCount, skippedCount, warnings, schedules };
}
