import { DEV_USERS } from "@/lib/dev-user/users";

const DEV_USER_HEADER = "x-dev-user-id";

export const getCurrentUserId = (request: Request): string | null => {
  const headerValue = request.headers.get(DEV_USER_HEADER);

  if (!headerValue) return null;

  const normalized = String(headerValue);
  return DEV_USERS[normalized as keyof typeof DEV_USERS]?.id ?? normalized;
};

