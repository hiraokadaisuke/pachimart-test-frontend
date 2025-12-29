import { z } from "zod";

export const messageRecordSchema = z.object({
  id: z.number(),
  naviId: z.number().int().positive(),
  senderUserId: z.string(),
  senderRole: z.enum(["buyer", "seller"]).optional().default("buyer"),
  body: z.string(),
  createdAt: z.date(),
});

export type MessageRecord = z.infer<typeof messageRecordSchema>;

export const messageDtoSchema = z.object({
  id: z.number(),
  naviId: z.number().int().positive(),
  senderUserId: z.string(),
  senderRole: z.enum(["buyer", "seller"]).optional().default("buyer"),
  body: z.string(),
  createdAt: z.string(),
});

export type MessageDto = z.infer<typeof messageDtoSchema>;

export type TradeMessage = {
  sender: string;
  body: string;
  timestamp: string;
};

const formatDateLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (v: number) => v.toString().padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
};

const toDate = (value: unknown): Date => {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
};

export const normalizeMessageRecord = (message: unknown): MessageRecord => {
  if (!message || typeof message !== "object") {
    throw new Error("Message must be an object");
  }

  const candidate = message as Record<string, unknown>;

  const parsed = messageRecordSchema.safeParse({
    id: Number(candidate.id),
    naviId: Number(candidate.tradeNaviId ?? candidate.naviId),
    senderUserId: String(candidate.senderUserId ?? ""),
    senderRole: (candidate.senderRole as "buyer" | "seller" | undefined) ?? "buyer",
    body: String(candidate.body ?? ""),
    createdAt: toDate(candidate.createdAt),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return parsed.data;
};

export const toMessageDto = (message: MessageRecord): MessageDto => ({
  id: message.id,
  naviId: message.naviId,
  senderUserId: message.senderUserId,
  senderRole: message.senderRole,
  body: message.body,
  createdAt: message.createdAt.toISOString(),
});

export const mapMessageDtoToTradeMessage = (dto: MessageDto): TradeMessage => ({
  sender: dto.senderUserId,
  body: dto.body,
  timestamp: formatDateLabel(dto.createdAt),
});

