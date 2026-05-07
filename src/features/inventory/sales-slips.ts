import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import { cookies } from 'next/headers';

const prismaClient = prisma as PrismaClient;
const salesSlipDelegate = (prismaClient as unknown as Record<string, any>).salesSlip;
const DEV_USER_COOKIE_KEY = 'dev_user_id';
const resolveCurrentUserId = async () => (await cookies()).get(DEV_USER_COOKIE_KEY)?.value ?? 'dev-user-a';

export async function listSalesSlips() {
  try {
    if (!salesSlipDelegate?.findMany) return [];
    const ownerUserId = await resolveCurrentUserId();
    return await salesSlipDelegate.findMany({
      where: { ownerUserId },
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    return [];
  }
}

export async function getSalesSlip(id: string) {
  try {
    if (!salesSlipDelegate?.findFirst) return null;
    const ownerUserId = await resolveCurrentUserId();
    return await salesSlipDelegate.findFirst({
      where: { id, ownerUserId },
      include: { lines: { include: { inventoryUnit: true } }, bankAccount: true },
    });
  } catch {
    return null;
  }
}

export async function createSalesSlip(formData: FormData) {
  if (!salesSlipDelegate?.create) throw new Error('販売伝票機能は現在利用できません。');
  const ownerUserId = await resolveCurrentUserId();
  const customerName = String(formData.get('customerName') ?? '').trim();
  if (!customerName) throw new Error('販売先は必須です。');

  const machineName = String(formData.get('machineName') ?? '').trim() || '未入力';
  const salesUnitPrice = Number(formData.get('salesUnitPrice') ?? 0);
  const purchaseUnitPrice = Number(formData.get('purchaseUnitPrice') ?? 0);
  const inventoryUnitIdRaw = String(formData.get('inventoryUnitId') ?? '').trim();
  const inventoryUnitId = inventoryUnitIdRaw || null;

  if (inventoryUnitId) {
    const unit = await prismaClient.inventoryUnit.findFirst({ where: { id: inventoryUnitId, ownerUserId } });
    if (!unit) throw new Error('Unitが見つかりません。');
    if (unit.status === 'SHIPPED' || unit.status === 'CANCELED') throw new Error('発送済み/取消済みUnitは選択できません。');
  }

  return salesSlipDelegate.create({
    data: {
      ownerUserId,
      customerName,
      salesContactName: String(formData.get('salesContactName') ?? '').trim() || null,
      paymentDueDate: formData.get('paymentDueDate') ? new Date(String(formData.get('paymentDueDate'))) : null,
      subtotalAmount: salesUnitPrice,
      taxAmount: Math.floor(salesUnitPrice * 0.1),
      totalAmount: Math.floor(salesUnitPrice * 1.1),
      grossProfitAmount: salesUnitPrice - (Number.isFinite(purchaseUnitPrice) ? purchaseUnitPrice : 0),
      lines: {
        create: [{
          ownerUserId,
          machineName,
          itemType: 'PACHINKO',
          quantity: 1,
          salesUnitPrice,
          purchaseUnitPrice,
          amount: salesUnitPrice,
          inventoryUnitId,
        }],
      },
    },
  });
}

export async function listSelectableSalesUnits() {
  try {
    const ownerUserId = await resolveCurrentUserId();
    return await prismaClient.inventoryUnit.findMany({
      where: { ownerUserId, status: { notIn: ['SHIPPED', 'CANCELED'] } },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    });
  } catch {
    return [];
  }
}
