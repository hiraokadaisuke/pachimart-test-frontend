import { prisma } from '@/lib/server/prisma';
import { cookies } from 'next/headers';
const me=async()=> (await cookies()).get('dev_user_id')?.value ?? 'dev-user-a';
export async function getSettingsOverview(){const ownerUserId=await me();const [partners,profiles,banks]=await Promise.all([prisma.businessPartner.count({where:{ownerUserId}}),prisma.companyProfile.count({where:{ownerUserId}}),prisma.bankAccount.count({where:{ownerUserId}})]);return {partners,profiles,banks};}
export async function listBankAccounts(){const ownerUserId=await me();return prisma.bankAccount.findMany({where:{ownerUserId},orderBy:{createdAt:'desc'}})}
export async function createBankAccount(fd:FormData){const ownerUserId=await me();return prisma.bankAccount.create({data:{ownerUserId,bankName:String(fd.get('bankName')??''),accountNumber:String(fd.get('accountNumber')??''),accountHolder:String(fd.get('accountHolder')??'')}})}
