import type { InboundSchedule, OutboundSchedule } from "@prisma/client";

const AUTO_MEMO_PREFIX = "[AUTO] dealing";

export const buildPurchaseDedupeKey = (scheduleId: string) => `purchase:inbound:${scheduleId}:received`;
export const buildSalesDedupeKey = (scheduleId: string) => `sales:outbound:${scheduleId}:shipped`;

const extractUnitPriceFromNote = (note: string | null | undefined): number | null => {
  if (!note) return null;
  const matched = note.match(/unitPrice\s*[:=]\s*(\d+)/i) ?? note.match(/price\s*[:=]\s*(\d+)/i);
  if (!matched) return null;
  const value = Number(matched[1]);
  return Number.isInteger(value) && value >= 0 ? value : null;
};

type RecordTx = any;

export async function ensurePurchaseAndPaymentOnInboundComplete(tx: RecordTx, args: { ownerUserId: string; schedule: InboundSchedule; inventoryItemId: string; quantity: number; committedAt: Date; }) {
  const dealingId = args.schedule.sourceType === "DEALING" && args.schedule.sourceId ? Number(args.schedule.sourceId) : null;
  const existing = await tx.purchaseRecord.findFirst({ where: { ownerUserId: args.ownerUserId, inventoryItemId: args.inventoryItemId, memo: AUTO_MEMO_PREFIX + ":" + buildPurchaseDedupeKey(args.schedule.id) } });
  if (existing) return;

  const inventoryItem = await tx.inventoryItem.findUnique({ where: { id: args.inventoryItemId } });
  const unitCost = extractUnitPriceFromNote(args.schedule.note) ?? inventoryItem?.purchaseUnitPrice ?? 0;
  const totalCost = unitCost * args.quantity;

  const purchase = await tx.purchaseRecord.create({
    data: {
      ownerUserId: args.ownerUserId,
      inventoryItemId: args.inventoryItemId,
      dealingId: Number.isInteger(dealingId) ? dealingId : null,
      purchaseDate: args.committedAt,
      unitCost,
      quantity: args.quantity,
      shippingCost: 0,
      otherCost: 0,
      totalCost,
      paymentStatus: "UNPAID",
      memo: `${AUTO_MEMO_PREFIX}:${buildPurchaseDedupeKey(args.schedule.id)}`,
    },
  });

  const existingPayment = await tx.paymentRecord.findFirst({ where: { ownerUserId: args.ownerUserId, sourceType: "PURCHASE_RECORD", sourceId: purchase.id } });
  if (!existingPayment) {
    await tx.paymentRecord.create({ data: { ownerUserId: args.ownerUserId, sourceType: "PURCHASE_RECORD", sourceId: purchase.id, paymentType: "OTHER", amount: totalCost, status: "PLANNED", memo: "[AUTO] 支払予定作成" } });
  }
}

export async function ensureSalesAndPaymentOnOutboundComplete(tx: RecordTx, args: { ownerUserId: string; schedule: OutboundSchedule; inventoryItemId: string; quantity: number; committedAt: Date; }) {
  const dealingId = args.schedule.sourceType === "DEALING" && args.schedule.sourceId ? Number(args.schedule.sourceId) : null;
  const existing = await tx.salesRecord.findFirst({ where: { ownerUserId: args.ownerUserId, inventoryItemId: args.inventoryItemId, memo: AUTO_MEMO_PREFIX + ":" + buildSalesDedupeKey(args.schedule.id) } });
  if (existing) return;

  const inventoryItem = await tx.inventoryItem.findUnique({ where: { id: args.inventoryItemId } });
  const unitPrice = extractUnitPriceFromNote(args.schedule.note) ?? inventoryItem?.plannedSaleUnitPrice ?? 0;
  const totalSales = unitPrice * args.quantity;

  const sales = await tx.salesRecord.create({
    data: {
      ownerUserId: args.ownerUserId,
      inventoryItemId: args.inventoryItemId,
      dealingId: Number.isInteger(dealingId) ? dealingId : null,
      salesDate: args.committedAt,
      unitPrice,
      quantity: args.quantity,
      shippingFee: 0,
      platformFee: 0,
      otherFee: 0,
      totalSales,
      paymentStatus: "UNPAID",
      memo: `${AUTO_MEMO_PREFIX}:${buildSalesDedupeKey(args.schedule.id)}`,
    },
  });

  const existingPayment = await tx.paymentRecord.findFirst({ where: { ownerUserId: args.ownerUserId, sourceType: "SALES_RECORD", sourceId: sales.id } });
  if (!existingPayment) {
    await tx.paymentRecord.create({ data: { ownerUserId: args.ownerUserId, sourceType: "SALES_RECORD", sourceId: sales.id, paymentType: "OTHER", amount: totalSales, status: "PLANNED", memo: "[AUTO] 入金予定作成" } });
  }
}

export const isAutoRecordMemo = (memo: string | null) => Boolean(memo?.startsWith(AUTO_MEMO_PREFIX));
