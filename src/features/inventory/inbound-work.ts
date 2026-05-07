import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import { cookies } from 'next/headers';

const prismaClient = prisma as PrismaClient;
const resolveUserId = async () => (await cookies()).get('dev_user_id')?.value ?? 'dev-user-a';

export const calcInboundProgress = (
  units: { rawQr: string | null; displayCode: string | null; memo: string | null }[],
  qty: number,
) => ({
  qrDone: units.filter((x) => Boolean(x.rawQr)).length,
  codeDone: units.filter((x) => Boolean(x.displayCode)).length,
  checkDone: units.filter((x) => (x.memo ?? '').includes('動確済')).length,
  total: qty,
});

export async function listInboundMobile() {
  try {
    const ownerUserId = await resolveUserId();
    const rows = await prismaClient.inboundSchedule.findMany({
      where: { ownerUserId },
      include: { inventoryUnits: true },
      orderBy: { expectedDate: 'desc' },
    });
    return rows.map((r) => ({ ...r, progress: calcInboundProgress(r.inventoryUnits, r.quantity) }));
  } catch {
    return [];
  }
}

export async function getInboundWork(id: string) {
  try {
    const ownerUserId = await resolveUserId();
    return await prismaClient.inboundSchedule.findFirst({
      where: { id, ownerUserId },
      include: { inventoryUnits: true, inventoryItem: true },
    });
  } catch {
    return null;
  }
}

export async function saveInboundWork(id: string, formData: FormData) {
  const ownerUserId = await resolveUserId();
  const schedule = await prismaClient.inboundSchedule.findFirst({ where: { id, ownerUserId } });
  if (!schedule) throw new Error('not found');

  const unitId = String(formData.get('unitId') ?? '').trim();
  const data = {
    rawQr: String(formData.get('rawQr') ?? '').trim() || null,
    displayCode: String(formData.get('displayCode') ?? '').trim() || null,
    memo: String(formData.get('memo') ?? '').trim() || null,
  };

  if (unitId) {
    await prismaClient.inventoryUnit.update({ where: { id: unitId }, data });
    return;
  }

  if (!schedule.inventoryItemId) throw new Error('schedule has no inventory item');
  await prismaClient.inventoryUnit.create({
    data: {
      ownerUserId,
      inventoryItemId: schedule.inventoryItemId,
      itemType: schedule.itemType,
      inboundScheduleId: id,
      status: 'PROVISIONAL',
      ...data,
    },
  });
}
