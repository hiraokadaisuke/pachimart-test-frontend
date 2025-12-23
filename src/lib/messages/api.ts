import { messageDtoSchema, mapMessageDtoToTradeMessage, type MessageDto, type TradeMessage } from "./transform";

const messageListSchema = messageDtoSchema.array();

export async function fetchMessagesByNaviId(naviId: number): Promise<TradeMessage[]> {
  const response = await fetch(`/api/trades/${naviId}/messages`);

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
  senderUserId: string;
  receiverUserId: string;
  body: string;
};

export async function postMessage(naviId: number, payload: CreateMessageBody): Promise<MessageDto> {
  const response = await fetch(`/api/trades/${naviId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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

