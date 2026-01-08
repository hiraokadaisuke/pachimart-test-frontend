import { randomUUID } from "crypto";

import { prisma } from "@/lib/server/prisma";
import { findDevUserById } from "@/lib/dev-user/users";

const FALLBACK_COMPANY_NAME = "開発ユーザー";

const toUserDefaults = (devUserId: string) => {
  const devUser = findDevUserById(devUserId);
  return {
    companyName: devUser?.companyName ?? FALLBACK_COMPANY_NAME,
    contactName: devUser?.contactName ?? null,
    address: devUser?.address ?? null,
    tel: devUser?.tel ?? null,
  };
};

export const resolveUserByIdentifier = async (
  identifier: string,
  { createIfMissing = false }: { createIfMissing?: boolean } = {}
) => {
  if (!identifier) return null;

  const byId = await prisma.user.findUnique({
    where: { id: identifier },
    select: { id: true, devUserId: true, companyName: true },
  });

  if (byId) return byId;

  const byDevUserId = await prisma.user.findUnique({
    where: { devUserId: identifier },
    select: { id: true, devUserId: true, companyName: true },
  });

  if (byDevUserId) return byDevUserId;

  if (!createIfMissing) return null;

  const defaults = toUserDefaults(identifier);

  return prisma.user.create({
    data: {
      id: `user_${randomUUID()}`,
      devUserId: identifier,
      ...defaults,
    },
    select: { id: true, devUserId: true, companyName: true },
  });
};

export const resolveUserIdForWrite = async (identifier: string) => {
  const resolved = await resolveUserByIdentifier(identifier, { createIfMissing: true });
  return resolved?.id ?? identifier;
};

export const resolveUserLookupIds = async (identifier: string) => {
  const resolved = await resolveUserByIdentifier(identifier, { createIfMissing: false });
  const ids = new Set<string>();

  if (identifier) ids.add(identifier);

  if (resolved) {
    ids.add(resolved.id);
    if (resolved.devUserId) ids.add(resolved.devUserId);
  }

  return [...ids];
};
