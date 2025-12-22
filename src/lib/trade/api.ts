import { TradeNaviStatus, type Prisma } from "@prisma/client";
import { z } from "zod";

import { type TradeNaviDraft } from "@/lib/navi/types";

import { createTradeFromDraft } from "./storage";
import { type TradeRecord } from "./types";

const tradeNaviSchema = z.object({
  id: z.number(),
  status: z.nativeEnum(TradeNaviStatus),
  ownerUserId: z.string(),
  buyerUserId: z.string().nullable(),
  payload: z.unknown().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TradeNaviDto = z.infer<typeof tradeNaviSchema>;

const tradeNaviListSchema = z.array(tradeNaviSchema);

const isTradeNaviDraft = (payload: unknown): payload is TradeNaviDraft => {
  if (!payload || typeof payload !== "object") return false;
  return "id" in payload && "ownerUserId" in payload && "conditions" in payload;
};

export function mapTradeNaviToTradeRecord(trade: TradeNaviDto): TradeRecord | null {
  if (!isTradeNaviDraft(trade.payload)) return null;

  const draft: TradeNaviDraft = {
    ...trade.payload,
    status: trade.payload.status ?? "sent_to_buyer",
    ownerUserId: trade.ownerUserId,
    buyerId: trade.payload.buyerId ?? trade.buyerUserId,
    createdAt: trade.payload.createdAt ?? trade.createdAt,
    updatedAt: trade.payload.updatedAt ?? trade.updatedAt,
  };

  const record = createTradeFromDraft(draft, trade.ownerUserId);

  return {
    ...record,
    id: draft.id,
    buyerUserId: draft.buyerId ?? trade.buyerUserId ?? record.buyerUserId,
    createdAt: draft.createdAt ?? trade.createdAt,
    updatedAt: draft.updatedAt ?? trade.updatedAt,
  };
}

export async function fetchTradeNavis(): Promise<TradeNaviDto[]> {
  const response = await fetch("/api/trades");

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to fetch trades: ${response.status} ${detail}`);
  }

  const json = (await response.json()) as unknown;
  const parsed = tradeNaviListSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return parsed.data.map((trade) => ({
    ...trade,
    payload: (trade.payload as Prisma.JsonValue | null) ?? null,
  }));
}

export async function fetchTradeRecordsFromApi(): Promise<TradeRecord[]> {
  const trades = await fetchTradeNavis();

  return trades
    .map((trade) => mapTradeNaviToTradeRecord(trade))
    .filter((trade): trade is TradeRecord => Boolean(trade));
}

export async function fetchTradeNaviById(tradeId: string): Promise<TradeNaviDto | null> {
  const response = await fetch(`/api/trades/${tradeId}`);

  if (response.status === 404) return null;

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to fetch trade ${tradeId}: ${response.status} ${detail}`);
  }

  const json = (await response.json()) as unknown;
  const parsed = tradeNaviSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return {
    ...parsed.data,
    payload: (parsed.data.payload as Prisma.JsonValue | null) ?? null,
  } satisfies TradeNaviDto;
}

export async function fetchTradeRecordById(tradeId: string): Promise<TradeRecord | null> {
  const trade = await fetchTradeNaviById(tradeId);
  return trade ? mapTradeNaviToTradeRecord(trade) : null;
}
