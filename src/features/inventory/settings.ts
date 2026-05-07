import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import { cookies } from 'next/headers';

const prismaClient = prisma as PrismaClient;
const partnerDelegate = (prismaClient as unknown as Record<string, any>).businessPartner;
const profileDelegate = (prismaClient as unknown as Record<string, any>).companyProfile;
const bankAccountDelegate = (prismaClient as unknown as Record<string, any>).bankAccount;
const me = async () => (await cookies()).get('dev_user_id')?.value ?? 'dev-user-a';

export async function getSettingsOverview() {
  const ownerUserId = await me();
  if (!partnerDelegate?.count || !profileDelegate?.count || !bankAccountDelegate?.count) {
    return { partners: 0, profiles: 0, banks: 0 };
  }
  const [partners, profiles, banks] = await Promise.all([
    partnerDelegate.count({ where: { ownerUserId } }),
    profileDelegate.count({ where: { ownerUserId } }),
    bankAccountDelegate.count({ where: { ownerUserId } }),
  ]);
  return { partners, profiles, banks };
}

export async function listBankAccounts() {
  const ownerUserId = await me();
  if (!bankAccountDelegate?.findMany) return [];
  return bankAccountDelegate.findMany({ where: { ownerUserId }, orderBy: { createdAt: 'desc' } });
}

export async function createBankAccount(fd: FormData) {
  const ownerUserId = await me();
  if (!bankAccountDelegate?.create) throw new Error('銀行口座設定は現在利用できません。');
  return bankAccountDelegate.create({
    data: {
      ownerUserId,
      bankName: String(fd.get('bankName') ?? ''),
      accountNumber: String(fd.get('accountNumber') ?? ''),
      accountHolder: String(fd.get('accountHolder') ?? ''),
    },
  });
}
