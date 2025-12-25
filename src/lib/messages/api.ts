import { messageDtoSchema, mapMessageDtoToTradeMessage, type MessageDto, type TradeMessage } from "./transform";
import { fetchWithDevHeader, resolveCurrentDevUserId } from "@/lib/api/fetchWithDevHeader";

const messageListSchema = messageDtoSchema.array();

export async function fetchMessagesByNaviId(naviId: number): Promise<TradeMessage[]> {
  const currentUserId = resolveCurrentDevUserId();
  const headers: HeadersInit | undefined = currentUserId
    ? { "x-dev-user-id": currentUserId }
    : undefined;

  const response = await fetchWithDevHeader(`/api/messages?tradeNaviId=${naviId}`, { headers });

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

  const response = await fetchWithDevHeader(
    `/api/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(currentUserId ? { "x-dev-user-id": currentUserId } : {}),
      },
      body: JSON.stringify({ tradeNaviId: naviId, ...payload }),
    },
    currentUserId
  );

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

