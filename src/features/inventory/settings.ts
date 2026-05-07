import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import { cookies } from 'next/headers';

const prismaClient = prisma as PrismaClient;
const me = async () => (await cookies()).get('dev_user_id')?.value ?? 'dev-user-a';

export async function getSettingsOverview() {
  const ownerUserId = await me();
  const [partners, profiles, banks] = await Promise.all([
    prismaClient.businessPartner.count({ where: { ownerUserId } }),
    prismaClient.companyProfile.count({ where: { ownerUserId } }),
    prismaClient.bankAccount.count({ where: { ownerUserId } }),
  ]);
  return { partners, profiles, banks };
}

export async function listBankAccounts() {
  const ownerUserId = await me();
  return prismaClient.bankAccount.findMany({ where: { ownerUserId }, orderBy: { createdAt: 'desc' } });
}

export async function createBankAccount(fd: FormData) {
  const ownerUserId = await me();
  return prismaClient.bankAccount.create({
    data: {
      ownerUserId,
      bankName: String(fd.get('bankName') ?? ''),
      accountNumber: String(fd.get('accountNumber') ?? ''),
      accountHolder: String(fd.get('accountHolder') ?? ''),
    },
  });
}
