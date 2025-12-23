import { TradeNaviStatus, TradeNaviType, type Prisma } from "@prisma/client";
import { z } from "zod";

import { findDevUserById } from "@/lib/dev-user/users";
import { buildTodosFromStatus } from "./todo";
import { type TradeNaviDraft } from "@/lib/navi/types";

import { createTradeFromDraft } from "./storage";
import { type TradeRecord } from "./types";

const tradeNaviSchema = z.object({
  id: z.number(),
  status: z.nativeEnum(TradeNaviStatus),
  naviType: z.nativeEnum(TradeNaviType),
  ownerUserId: z.string(),
  buyerUserId: z.string().nullable(),
  payload: z.unknown().nullable(),
  listingSnapshot: z.unknown().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TradeNaviDto = z.infer<typeof tradeNaviSchema>;

const tradeNaviListSchema = z.array(tradeNaviSchema);

const isTradeNaviDraft = (payload: unknown): payload is TradeNaviDraft => {
  if (!payload || typeof payload !== "object") return false;
  return "id" in payload && "ownerUserId" in payload && "conditions" in payload;
};

type ListingSnapshot = {
  id: string;
  machineName?: string | null;
  maker?: string | null;
  storageLocation?: string;
  unitPriceExclTax?: number | null;
};

type OnlineInquiryPayload = {
  unitPriceExclTax?: number | null;
  quantity?: number | null;
  taxRate?: number | null;
  shippingFee?: number | null;
  handlingFee?: number | null;
  buyerMemo?: string | null;
  productName?: string | null;
  makerName?: string | null;
  location?: string | null;
  buyerAddress?: string | null;
  buyerContactName?: string | null;
};

const isOnlineInquiryPayload = (payload: unknown): payload is OnlineInquiryPayload => {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Record<string, unknown>;
  return "quantity" in candidate || "unitPriceExclTax" in candidate || "buyerMemo" in candidate;
};

const resolveListingSnapshot = (snapshot: unknown): ListingSnapshot | null => {
  if (!snapshot || typeof snapshot !== "object") return null;
  const listing = snapshot as Record<string, unknown>;
  const id = listing.id;
  if (typeof id !== "string") return null;
  return {
    id,
    machineName: (listing.machineName as string | null | undefined) ?? null,
    maker: (listing.maker as string | null | undefined) ?? null,
    storageLocation: (listing.storageLocation as string | null | undefined) ?? undefined,
    unitPriceExclTax: listing.unitPriceExclTax as number | null | undefined,
  };
};

const buildOnlineInquiryDraft = (
  trade: TradeNaviDto,
  payload: OnlineInquiryPayload,
  snapshot: ListingSnapshot | null
): TradeNaviDraft => {
  const now = new Date().toISOString();
  const listingUnitPrice = snapshot?.unitPriceExclTax;
  const unitPrice =
    payload.unitPriceExclTax === null || payload.unitPriceExclTax === undefined
      ? listingUnitPrice ?? 0
      : payload.unitPriceExclTax;

  return {
    id: String(trade.id),
    ownerUserId: trade.ownerUserId,
    status: "sent_to_buyer",
    productId: snapshot?.id ?? undefined,
    buyerId: trade.buyerUserId ?? undefined,
    buyerCompanyName: findDevUserById(trade.buyerUserId ?? "")?.companyName ?? null,
    buyerContactName: payload.buyerContactName ?? undefined,
    buyerAddress: payload.buyerAddress ?? undefined,
    buyerPending: false,
    conditions: {
      unitPrice,
      quantity: payload.quantity ?? 1,
      shippingFee: payload.shippingFee ?? 0,
      handlingFee: payload.handlingFee ?? 0,
      taxRate: payload.taxRate ?? 0.1,
      memo: payload.buyerMemo ?? null,
      productName: payload.productName ?? snapshot?.machineName ?? undefined,
      makerName: payload.makerName ?? snapshot?.maker ?? undefined,
      location: payload.location ?? snapshot?.storageLocation ?? undefined,
    },
    createdAt: trade.createdAt,
    updatedAt: trade.updatedAt ?? now,
  };
};

export function mapTradeNaviToTradeRecord(trade: TradeNaviDto): TradeRecord | null {
  if (trade.naviType === TradeNaviType.ONLINE_INQUIRY) {
    const inquiryRecord = mapOnlineInquiryToTradeRecord(trade);
    if (inquiryRecord) return inquiryRecord;
  }

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
    naviId: trade.id,
    id: draft.id,
    buyerUserId: draft.buyerId ?? trade.buyerUserId ?? record.buyerUserId,
    createdAt: draft.createdAt ?? trade.createdAt,
    updatedAt: draft.updatedAt ?? trade.updatedAt,
  };
}

export function mapOnlineInquiryToTradeRecord(trade: TradeNaviDto): TradeRecord | null {
  if (trade.naviType !== TradeNaviType.ONLINE_INQUIRY || !trade.payload) return null;
  if (!isOnlineInquiryPayload(trade.payload)) return null;

  const snapshot = resolveListingSnapshot(trade.listingSnapshot);
  const draft = buildOnlineInquiryDraft(trade, trade.payload, snapshot);
  const record = createTradeFromDraft(draft, trade.ownerUserId, {
    termsText: undefined,
  });

  return {
    ...record,
    naviId: trade.id,
    id: draft.id,
    buyerUserId: draft.buyerId ?? trade.buyerUserId ?? record.buyerUserId,
    createdAt: draft.createdAt ?? trade.createdAt,
    updatedAt: draft.updatedAt ?? trade.updatedAt,
    todos: buildTodosFromStatus("APPROVAL_REQUIRED"),
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
    listingSnapshot: (trade.listingSnapshot as Prisma.JsonValue | null) ?? null,
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
    listingSnapshot: (parsed.data.listingSnapshot as Prisma.JsonValue | null) ?? null,
  } satisfies TradeNaviDto;
}

export async function fetchTradeRecordById(tradeId: string): Promise<TradeRecord | null> {
  const trade = await fetchTradeNaviById(tradeId);
  return trade ? mapTradeNaviToTradeRecord(trade) : null;
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
