import { TradeNaviStatus, TradeStatus, type Prisma } from "@prisma/client";
import { z } from "zod";

import { type TradeNaviDraft } from "@/lib/navi/types";

import { type InProgressTradeDto, transformInProgressTrade } from "./transform";

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

const inProgressTradeSchema = z.object({
  id: z.number(),
  sellerUserId: z.string(),
  buyerUserId: z.string(),
  status: z.nativeEnum(TradeStatus),
  payload: z.unknown().nullable(),
  naviId: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  navi: z
    .object({
      id: z.number(),
      ownerUserId: z.string(),
      buyerUserId: z.string().nullable(),
      payload: z.unknown().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .nullable(),
  sellerUser: z
    .object({
      id: z.string(),
      companyName: z.string(),
    })
    .nullable(),
  buyerUser: z
    .object({
      id: z.string(),
      companyName: z.string(),
    })
    .nullable(),
});

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

export async function fetchInProgressTradeById(
  tradeId: string
): Promise<InProgressTradeDto | null> {
  const response = await fetch(`/api/trades/in-progress/${tradeId}`);

  if (response.status === 404) return null;

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to fetch trade ${tradeId}: ${response.status} ${detail}`);
  }

  const json = (await response.json()) as unknown;
  const parsed = inProgressTradeSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const dto = parsed.data;

  return {
    ...dto,
    payload: (dto.payload as Prisma.JsonValue | null) ?? null,
    navi: dto.navi
      ? {
          ...dto.navi,
          payload: (dto.navi.payload as Prisma.JsonValue | null) ?? null,
        }
      : null,
  } satisfies InProgressTradeDto;
}

export async function fetchTradeRecordById(tradeId: string): Promise<TradeRecord | null> {
  const trade = await fetchInProgressTradeById(tradeId);
  return trade ? transformInProgressTrade(trade) : null;
}

export async function updateTradeStatus(tradeId: string, status: "APPROVED" | "REJECTED") {
  const response = await fetch(`/api/trades/${tradeId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to update trade ${tradeId}: ${response.status} ${detail}`);
  }
}
