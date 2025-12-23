import { z } from "zod";

export const messageDtoSchema = z.object({
  id: z.number(),
  naviId: z.number(),
  senderUserId: z.string(),
  receiverUserId: z.string(),
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

export const mapMessageDtoToTradeMessage = (dto: MessageDto): TradeMessage => ({
  sender: dto.senderUserId,
  body: dto.body,
  timestamp: formatDateLabel(dto.createdAt),
});

