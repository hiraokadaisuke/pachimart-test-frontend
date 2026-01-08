import { DEV_USERS } from "@/lib/dev-user/users";
import { ensureUserForIdentifier, type CurrentUserIdentity } from "@/lib/server/users";

const DEV_USER_HEADER = "x-dev-user-id";

export const getCurrentUser = async (request: Request): Promise<CurrentUserIdentity | null> => {
  const headerValue = request.headers.get(DEV_USER_HEADER);

  if (!headerValue) return null;

  const normalized = String(headerValue);
  const devUserId = DEV_USERS[normalized as keyof typeof DEV_USERS]?.id ?? normalized;
  const user = await ensureUserForIdentifier(devUserId);

  return {
    id: user.id,
    devUserId: user.devUserId ?? devUserId,
  };
};

export const getCurrentUserId = async (request: Request): Promise<string | null> => {
  const user = await getCurrentUser(request);
  return user?.id ?? null;
};
