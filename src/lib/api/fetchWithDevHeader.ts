import { DEV_USERS, type DevUserKey } from "@/lib/dev-user/users";

const STORAGE_KEY = "dev_user_type";

export function resolveCurrentDevUserId(): string | undefined {
  if (typeof window === "undefined") return undefined;

  const storedType = window.localStorage.getItem(STORAGE_KEY) as DevUserKey | null;
  if (storedType && storedType in DEV_USERS) {
    return DEV_USERS[storedType].id;
  }

  return DEV_USERS.A.id;
}

export function withDevUserHeader(init?: RequestInit, devUserId?: string): RequestInit {
  const headers = new Headers(init?.headers ?? {});
  const currentUserId = devUserId ?? resolveCurrentDevUserId();

  if (currentUserId) {
    headers.set("x-dev-user-id", currentUserId);
  }

  return { ...init, headers };
}

export function fetchWithDevHeader(
  input: RequestInfo | URL,
  init?: RequestInit,
  devUserId?: string
): Promise<Response> {
  return fetch(input, withDevUserHeader(init, devUserId));
}
