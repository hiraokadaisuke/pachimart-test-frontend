import { findDevUserById } from "@/lib/dev-user/users";
import { prisma } from "@/lib/server/prisma";

export type CurrentUserIdentity = {
  id: string;
  devUserId: string | null;
};

type UserClient = typeof prisma;

type UserRecord = {
  id: string;
  devUserId?: string | null;
  companyName: string;
  contactName?: string | null;
  address?: string | null;
  tel?: string | null;
};

const buildUserDefaults = (devUserId: string) => {
  const devUser = findDevUserById(devUserId);
  return {
    devUserId,
    companyName: devUser?.companyName ?? devUserId,
    contactName: devUser?.contactName ?? null,
    address: devUser?.address ?? null,
    tel: devUser?.tel ?? null,
  };
};

export const getUserIdCandidates = (user: CurrentUserIdentity) => {
  const ids = [user.id, user.devUserId].filter((value): value is string => Boolean(value));
  return Array.from(new Set(ids));
};

export const ensureUserForIdentifier = async (identifier: string, client: UserClient = prisma) => {
  const trimmed = identifier.trim();
  if (!trimmed) {
    throw new Error("User identifier must not be empty");
  }

  const userById = await client.user.findUnique({ where: { id: trimmed } as any });
  if (userById) {
    if (!userById.devUserId && trimmed.startsWith("dev_user_")) {
      if ("update" in client.user) {
        return (client.user as any).update({
          where: { id: userById.id },
          data: { devUserId: trimmed },
        }) as Promise<UserRecord>;
      }
      return { ...userById, devUserId: trimmed } as UserRecord;
    }

    return userById as UserRecord;
  }

  const userByDevUserId = await client.user.findUnique({
    where: { devUserId: trimmed } as any,
  });
  if (userByDevUserId) {
    return userByDevUserId as UserRecord;
  }

  const defaults = buildUserDefaults(trimmed);

  if ("upsert" in client.user) {
    return (client.user as any).upsert({
      where: { devUserId: trimmed },
      update: { ...defaults },
      create: { ...defaults },
    }) as Promise<UserRecord>;
  }

  return (client.user as any).create({ data: { ...defaults } }) as Promise<UserRecord>;
};

export const resolveUserId = async (identifier: string, client: UserClient = prisma) => {
  const user = await ensureUserForIdentifier(identifier, client);
  return user.id;
};

export const resolveOptionalUserId = async (
  identifier: string | null | undefined,
  client: UserClient = prisma
) => {
  if (!identifier || !identifier.trim()) return null;
  return resolveUserId(identifier, client);
};
