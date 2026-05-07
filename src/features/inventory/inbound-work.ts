import type { InventoryUnitCodeType, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import { cookies } from 'next/headers';
import { normalizeDisplayCode, parseMachineQr } from '@/features/inventory/qr-code';

const prismaClient = prisma as PrismaClient;
const resolveUserId = async () => (await cookies()).get('dev_user_id')?.value ?? 'dev-user-a';

export type InboundProgress = {
  total: number;
  unitRegisteredCount: number;
  qrDoneCount: number;
  displayCodeDoneCount: number;
  checkDoneCount: number;
  remainingCount: number;
  isReadyToComplete: boolean;
};

const CHECK_DONE_KEYS = ['動確済', 'OK', 'DONE'];
const isCheckDone = (memo: string | null) => CHECK_DONE_KEYS.some((k) => (memo ?? '').toUpperCase().includes(k.toUpperCase()));

export const calcInboundProgress = (
  units: { rawQr: string | null; displayCode: string | null; memo: string | null }[],
  qty: number,
): InboundProgress => {
  const total = Math.max(qty, 0);
  const unitRegisteredCount = units.length;
  const qrDoneCount = units.filter((x) => Boolean((x.rawQr ?? '').trim())).length;
  const displayCodeDoneCount = units.filter((x) => Boolean((x.displayCode ?? '').trim())).length;
  const checkDoneCount = units.filter((x) => isCheckDone(x.memo)).length;
  return {
    total,
    unitRegisteredCount,
    qrDoneCount,
    displayCodeDoneCount,
    checkDoneCount,
    remainingCount: Math.max(total - unitRegisteredCount, 0),
    isReadyToComplete: displayCodeDoneCount >= total && unitRegisteredCount >= total,
  };
};

export async function listInboundMobile() {
  const ownerUserId = await resolveUserId();
  const rows = await prismaClient.inboundSchedule.findMany({
    where: { ownerUserId },
    include: { inventoryUnits: true, destinationLocation: true },
    orderBy: [{ status: 'asc' }, { expectedDate: 'asc' }],
  });
  return rows.map((r) => ({ ...r, progress: calcInboundProgress(r.inventoryUnits, r.quantity) }));
}

export async function getInboundWork(id: string) {
  const ownerUserId = await resolveUserId();
  const schedule = await prismaClient.inboundSchedule.findFirst({
    where: { id, ownerUserId },
    include: { inventoryUnits: { orderBy: { createdAt: 'asc' } }, inventoryItem: true, destinationLocation: true },
  });
  if (!schedule) return null;
  return { ...schedule, progress: calcInboundProgress(schedule.inventoryUnits, schedule.quantity) };
}

export async function saveInboundWork(id: string, formData: FormData) {
  const ownerUserId = await resolveUserId();
  const schedule = await prismaClient.inboundSchedule.findFirst({ where: { id, ownerUserId } });
  if (!schedule) throw new Error('not found');
  if (!schedule.inventoryItemId) throw new Error('schedule has no inventory item');

  const unitId = String(formData.get('unitId') ?? '').trim();
  const rawQr = String(formData.get('rawQr') ?? '').trim() || null;
  const normalizedDisplayCode = normalizeDisplayCode(String(formData.get('displayCode') ?? '')) || null;
  const parsed = rawQr ? parseMachineQr(rawQr, schedule.itemType) : null;
  const displayCode = normalizedDisplayCode ?? null;
  const memo = String(formData.get('memo') ?? '').trim() || null;

  const dup = await prismaClient.inventoryUnit.findFirst({
    where: { ownerUserId, OR: [{ displayCode: displayCode ?? undefined }, { rawQr: rawQr ?? undefined }], id: unitId ? { not: unitId } : undefined },
  });

  const codeTypeInput = String(formData.get('codeType') ?? '').trim() as InventoryUnitCodeType;
  const codeType: InventoryUnitCodeType = ['MAIN_BOARD','CERTIFICATE','BODY','FRAME','BOARD','OTHER','UNKNOWN'].includes(codeTypeInput) ? codeTypeInput : 'UNKNOWN';

  const data = {
    rawQr,
    displayCode,
    parsedQr: parsed?.parsedQr as never,
    memo,
    codeType,
    storageLocationId: schedule.destinationLocationId,
    status: 'RESERVED' as const,
  };

  if (unitId) {
    await prismaClient.inventoryUnit.update({ where: { id: unitId, ownerUserId }, data });
  } else {
    await prismaClient.inventoryUnit.create({
      data: {
        ownerUserId,
        inventoryItemId: schedule.inventoryItemId,
        itemType: schedule.itemType,
        inboundScheduleId: id,
        ...data,
      },
    });
  }

  return { duplicateWarning: Boolean(dup) };
}
