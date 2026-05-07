import type { InventoryUnitCodeType, PrismaClient, OperationCheckStatus, UnitInspectionStatus, UnitGlassStatus, UnitNailSheetStatus } from '@prisma/client';
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

const OPERATION_CHECK_DONE: OperationCheckStatus[] = ['OK', 'NG', 'NEEDS_RECHECK'];
const INSPECTION_DONE: UnitInspectionStatus[] = ['INSPECTED', 'ISSUE_FOUND'];

export const calcInboundProgress = (
  units: { rawQr: string | null; displayCode: string | null; memo: string | null; bodySerialNumber?: string | null; frameSerialNumber?: string | null; mainBoardSerialNumber?: string | null; operationCheckStatus?: OperationCheckStatus | null; inspectionStatus?: UnitInspectionStatus | null }[],
  qty: number,
): InboundProgress => {
  const total = Math.max(qty, 0);
  const unitRegisteredCount = units.length;
  const qrDoneCount = units.filter((x) => Boolean((x.rawQr ?? '').trim())).length;
  const displayCodeDoneCount = units.filter((x) => Boolean((x.displayCode ?? '').trim() || (x.bodySerialNumber ?? '').trim() || (x.frameSerialNumber ?? '').trim() || (x.mainBoardSerialNumber ?? '').trim())).length;
  const checkDoneCount = units.filter((x) => x.operationCheckStatus && OPERATION_CHECK_DONE.includes(x.operationCheckStatus)).length;
  const inspectionDoneCount = units.filter((x) => x.inspectionStatus && INSPECTION_DONE.includes(x.inspectionStatus)).length;
  return {
    total,
    unitRegisteredCount,
    qrDoneCount,
    displayCodeDoneCount,
    checkDoneCount: Math.min(checkDoneCount, inspectionDoneCount),
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
  const operationCheckStatusInput = String(formData.get('operationCheckStatus') ?? '').trim() as OperationCheckStatus;
  const operationCheckStatus: OperationCheckStatus = ['NOT_CHECKED','OK','NG','NEEDS_RECHECK'].includes(operationCheckStatusInput) ? operationCheckStatusInput : 'NOT_CHECKED';
  const inspectionStatusInput = String(formData.get('inspectionStatus') ?? '').trim() as UnitInspectionStatus;
  const inspectionStatus: UnitInspectionStatus = ['NOT_INSPECTED','INSPECTED','ISSUE_FOUND'].includes(inspectionStatusInput) ? inspectionStatusInput : 'NOT_INSPECTED';
  const glassStatusInput = String(formData.get('glassStatus') ?? '').trim() as UnitGlassStatus;
  const glassStatus: UnitGlassStatus = ['UNKNOWN','OK','NG','MISSING'].includes(glassStatusInput) ? glassStatusInput : 'UNKNOWN';
  const nailSheetStatusInput = String(formData.get('nailSheetStatus') ?? '').trim() as UnitNailSheetStatus;
  const nailSheetStatus: UnitNailSheetStatus = ['UNKNOWN','PRESENT','MISSING','NOT_REQUIRED'].includes(nailSheetStatusInput) ? nailSheetStatusInput : 'UNKNOWN';

  const data = {
    rawQr,
    displayCode,
    parsedQr: parsed?.parsedQr as never,
    memo,
    bodySerialNumber: String(formData.get('bodySerialNumber') ?? '').trim() || null,
    frameSerialNumber: String(formData.get('frameSerialNumber') ?? '').trim() || null,
    mainBoardSerialNumber: String(formData.get('mainBoardSerialNumber') ?? '').trim() || null,
    operationCheckStatus,
    operationCheckedAt: operationCheckStatus === 'NOT_CHECKED' ? null : new Date(),
    operationMemo: String(formData.get('operationMemo') ?? '').trim() || null,
    glassStatus,
    nailSheetStatus,
    inspectionStatus,
    inspectedAt: inspectionStatus === 'NOT_INSPECTED' ? null : new Date(),
    inspectionMemo: String(formData.get('inspectionMemo') ?? '').trim() || null,
    accessoryMemo: String(formData.get('accessoryMemo') ?? '').trim() || null,
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
