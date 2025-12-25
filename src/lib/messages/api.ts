import { messageDtoSchema, mapMessageDtoToTradeMessage, type MessageDto, type TradeMessage } from "./transform";
import { DEV_USERS, type DevUserKey } from "@/lib/dev-user/users";

const messageListSchema = messageDtoSchema.array();

const resolveCurrentDevUserId = (): string | undefined => {
  if (typeof window === "undefined") return undefined;

  const storedType = window.localStorage.getItem("dev_user_type") as DevUserKey | null;
  if (storedType && storedType in DEV_USERS) {
    return DEV_USERS[storedType].id;
  }

  return DEV_USERS.A.id;
};

export async function fetchMessagesByNaviId(naviId: number): Promise<TradeMessage[]> {
  const currentUserId = resolveCurrentDevUserId();
  const headers: HeadersInit | undefined = currentUserId
    ? { "x-dev-user-id": currentUserId }
    : undefined;

  const response = await fetch(`/api/messages?tradeNaviId=${naviId}`, { headers });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to fetch messages: ${response.status} ${detail}`);
  }

  const json = (await response.json()) as unknown;
  const parsed = messageListSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return parsed.data.map(mapMessageDtoToTradeMessage);
}

type CreateMessageBody = {
  body: string;
};

export async function postMessage(naviId: number, payload: CreateMessageBody): Promise<MessageDto> {
  const currentUserId = resolveCurrentDevUserId();

  const response = await fetch(`/api/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(currentUserId ? { "x-dev-user-id": currentUserId } : {}),
    },
    body: JSON.stringify({ tradeNaviId: naviId, ...payload }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to post message: ${response.status} ${detail}`);
  }

  const json = (await response.json()) as unknown;
  const parsed = messageDtoSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return parsed.data;
}

