import { NaviStatus, NaviType, type Prisma } from "@prisma/client";
import { z } from "zod";

import { findDevUserById } from "@/lib/dev-user/users";
import { fetchWithDevHeader } from "@/lib/api/fetchWithDevHeader";
import { buildTodosFromStatus } from "./todo";
import { mergeTrades } from "./merge";
import { type NaviDraft } from "@/lib/navi/types";
import {
  formatListingStorageLocation,
  resolveListingSnapshot,
  type ListingSnapshot,
} from "@/lib/dealings/listingSnapshot";

import { createTradeFromDraft } from "./storage";
import { type BuyerContact, type ShippingInfo, type TradeRecord } from "./types";
import { tradeDtoListSchema, type TradeDto, transformTrade } from "./transform";
import { calculateOnlineInquiryTotals } from "@/lib/online-inquiries/totals";

const naviSchema = z.object({
  id: z.number(),
  status: z.nativeEnum(NaviStatus),
  naviType: z.nativeEnum(NaviType),
  ownerUserId: z.string(),
  buyerUserId: z.string().nullable(),
  payload: z.unknown().nullable(),
  listingSnapshot: z.unknown().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type NaviDto = z.infer<typeof naviSchema>;

const naviListSchema = z.array(naviSchema);

const isNaviDraft = (payload: unknown): payload is NaviDraft => {
  if (!payload || typeof payload !== "object") return false;
  return "id" in payload && "ownerUserId" in payload && "conditions" in payload;
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

const normalizeContacts = (input: unknown, fallback: BuyerContact[] = []): BuyerContact[] => {
  if (!Array.isArray(input)) return fallback;

  return input
    .map((candidate) => {
      if (!candidate || typeof candidate !== "object") return null;
      const record = candidate as Record<string, unknown>;
      const contactId = record.contactId ?? record.id ?? record.name;

      if (typeof contactId !== "string" || typeof record.name !== "string") return null;
      return { contactId, name: record.name } satisfies BuyerContact;
    })
    .filter(Boolean) as BuyerContact[];
};

const buildOnlineInquiryDraft = (
  dealing: NaviDto,
  payload: OnlineInquiryPayload,
  snapshot: ListingSnapshot | null
): NaviDraft => {
  const now = new Date().toISOString();
  const listingUnitPrice = snapshot?.unitPriceExclTax ?? null;
  const unitPrice =
    payload.unitPriceExclTax === null || payload.unitPriceExclTax === undefined
      ? listingUnitPrice ?? 0
      : payload.unitPriceExclTax;
  const location = formatListingStorageLocation(snapshot);

  return {
    id: String(dealing.id),
    ownerUserId: dealing.ownerUserId,
    status: "sent_to_buyer",
    productId: snapshot?.listingId ?? undefined,
    buyerId: dealing.buyerUserId ?? undefined,
    buyerCompanyName: findDevUserById(dealing.buyerUserId ?? "")?.companyName ?? null,
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
      productName: payload.productName ?? snapshot?.machineName ?? snapshot?.title ?? undefined,
      makerName: payload.makerName ?? snapshot?.maker ?? undefined,
      location: payload.location ?? location ?? undefined,
    },
    createdAt: dealing.createdAt,
    updatedAt: dealing.updatedAt ?? now,
  };
};

export function mapNaviToTradeRecord(dealing: NaviDto): TradeRecord | null {
  if (dealing.naviType === NaviType.ONLINE_INQUIRY) {
    const inquiryRecord = mapOnlineInquiryToTradeRecord(dealing);
    if (inquiryRecord) return inquiryRecord;
  }

  if (!isNaviDraft(dealing.payload)) return null;

  const listingSnapshot = resolveListingSnapshot(dealing.listingSnapshot);

  const draft: NaviDraft = {
    ...dealing.payload,
    status: dealing.payload.status ?? "sent_to_buyer",
    ownerUserId: dealing.ownerUserId,
    buyerId: dealing.payload.buyerId ?? dealing.buyerUserId,
    createdAt: dealing.payload.createdAt ?? dealing.createdAt,
    updatedAt: dealing.payload.updatedAt ?? dealing.updatedAt,
  };

  const record = createTradeFromDraft(draft, dealing.ownerUserId);

  const payloadShipping =
    dealing.payload && typeof dealing.payload === "object" && !Array.isArray(dealing.payload)
      ? ((dealing.payload as { buyerShippingAddress?: ShippingInfo }).buyerShippingAddress ??
          (dealing.payload as { shipping?: ShippingInfo }).shipping ??
          undefined)
      : undefined;

  const payloadContacts =
    dealing.payload && typeof dealing.payload === "object" && !Array.isArray(dealing.payload)
      ? (dealing.payload as { buyerContacts?: BuyerContact[] }).buyerContacts
      : undefined;

  const payloadContactName =
    dealing.payload && typeof dealing.payload === "object" && !Array.isArray(dealing.payload)
      ? (dealing.payload as { buyerContactName?: string }).buyerContactName
      : undefined;

  const normalizedShipping = payloadShipping ?? record.buyerShippingAddress ?? record.shipping ?? {};
  const normalizedContacts = normalizeContacts(payloadContacts, record.buyerContacts ?? []);
  const normalizedContactName = payloadContactName ?? normalizedShipping.personName ?? record.buyerContactName;

  return {
    ...record,
    naviId: dealing.id,
    naviType: dealing.naviType,
    id: draft.id,
    buyerUserId: draft.buyerId ?? dealing.buyerUserId ?? record.buyerUserId,
    createdAt: draft.createdAt ?? dealing.createdAt,
    updatedAt: draft.updatedAt ?? dealing.updatedAt,
    listingSnapshot,
    shipping: normalizedShipping,
    buyerShippingAddress: normalizedShipping,
    buyerContactName: normalizedContactName,
    buyerContacts: normalizedContacts,
  };
}

export function mapOnlineInquiryToTradeRecord(dealing: NaviDto): TradeRecord | null {
  if (dealing.naviType !== NaviType.ONLINE_INQUIRY || !dealing.payload) return null;
  if (!isOnlineInquiryPayload(dealing.payload)) return null;

  const snapshot = resolveListingSnapshot(dealing.listingSnapshot);
  const draft = buildOnlineInquiryDraft(dealing, dealing.payload, snapshot);

  const sellerCompany = findDevUserById(dealing.ownerUserId)?.companyName ?? dealing.ownerUserId;
  const buyerCompany =
    findDevUserById(draft.buyerId ?? dealing.buyerUserId ?? "")?.companyName ??
    draft.buyerId ??
    dealing.buyerUserId ??
    "buyer";

  const amountInput = {
    id: draft.id,
    unitPriceExclTax: draft.conditions.unitPrice ?? 0,
    quantity: draft.conditions.quantity ?? 1,
    shippingFee: draft.conditions.shippingFee ?? 0,
    handlingFee: draft.conditions.handlingFee ?? 0,
    taxRate: draft.conditions.taxRate ?? 0.1,
    makerName: draft.conditions.makerName ?? snapshot?.maker ?? undefined,
    productName:
      draft.conditions.productName ?? snapshot?.machineName ?? snapshot?.title ?? "商品",
  };

  const { items, totals } = calculateOnlineInquiryTotals(amountInput);
  const todos = buildTodosFromStatus("APPROVAL_REQUIRED");

  return {
    id: draft.id,
    naviId: dealing.id,
    naviType: dealing.naviType,
    status: "APPROVAL_REQUIRED",
    sellerUserId: dealing.ownerUserId,
    buyerUserId: draft.buyerId ?? dealing.buyerUserId ?? "buyer",
    sellerName: sellerCompany,
    buyerName: buyerCompany,
    createdAt: draft.createdAt ?? dealing.createdAt,
    updatedAt: draft.updatedAt ?? dealing.updatedAt,
    contractDate: draft.updatedAt ?? dealing.updatedAt,
    makerName: amountInput.makerName ?? undefined,
    itemName: amountInput.productName ?? "商品",
    quantity: amountInput.quantity,
    totalAmount: totals.total,
    seller: { companyName: sellerCompany, userId: dealing.ownerUserId },
    buyer: { companyName: buyerCompany, userId: draft.buyerId ?? dealing.buyerUserId ?? "buyer" },
    todos,
    items,
    taxRate: amountInput.taxRate,
    shipping: {},
    listingSnapshot: snapshot,
  } satisfies TradeRecord;
}

const normalizeDealingRecord = (dealing: TradeRecord): TradeRecord => {
  const sellerUserId = dealing.sellerUserId ?? dealing.seller?.userId ?? "seller";
  const buyerUserId = dealing.buyerUserId ?? dealing.buyer?.userId ?? "buyer";

  const seller = {
    companyName: dealing.seller?.companyName ?? dealing.sellerName ?? "-",
    userId: dealing.seller?.userId ?? sellerUserId,
    address: dealing.seller?.address ?? "",
    tel: dealing.seller?.tel ?? "",
    fax: dealing.seller?.fax ?? "",
    contactName: dealing.seller?.contactName ?? "",
  };

  const buyer = {
    companyName: dealing.buyer?.companyName ?? dealing.buyerName ?? "-",
    userId: dealing.buyer?.userId ?? buyerUserId,
    address: dealing.buyer?.address ?? "",
    tel: dealing.buyer?.tel ?? "",
    fax: dealing.buyer?.fax ?? "",
    contactName: dealing.buyer?.contactName ?? "",
  };

  const items = Array.isArray(dealing.items)
    ? dealing.items.map((item, index) => {
        const { lineId, itemName, ...rest } = item ?? {};

        return {
          ...rest,
          lineId: lineId ?? `${dealing.id || dealing.naviId || "item"}-${index}`,
          itemName: itemName ?? "商品",
        };
      })
    : [];

  return {
    ...dealing,
    id: dealing.id || (dealing.naviId ? String(dealing.naviId) : ""),
    sellerUserId,
    buyerUserId,
    seller,
    buyer,
    items,
    todos: Array.isArray(dealing.todos) ? dealing.todos : [],
    shipping: dealing.shipping ?? dealing.buyerShippingAddress ?? {},
    buyerShippingAddress: dealing.buyerShippingAddress ?? dealing.shipping ?? {},
    buyerContacts: Array.isArray(dealing.buyerContacts) ? dealing.buyerContacts : [],
    listingSnapshot: dealing.listingSnapshot ?? null,
    storageLocationName: dealing.storageLocationName ?? undefined,
  };
};

export async function fetchTradeDtos() {
  const response = await fetchWithDevHeader("/api/trades/records");

  if (!response.ok) {
    throw new Error(`Failed to fetch trades: ${response.status}`);
  }

  const json = (await response.json()) as unknown;
  const parsed = tradeDtoListSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return parsed.data;
}

const sortTradesByDate = (trades: TradeRecord[]) =>
  trades.sort((a, b) => {
    const aDate = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
    const bDate = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
    return bDate - aDate;
  });

export async function fetchNavis(): Promise<NaviDto[]> {
  const response = await fetchWithDevHeader("/api/trades");

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to fetch trades: ${response.status} ${detail}`);
  }

  const json = (await response.json()) as unknown;
  const parsed = naviListSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return parsed.data.map((dealing) => ({
    ...dealing,
    payload: (dealing.payload as Prisma.JsonValue | null) ?? null,
    listingSnapshot: (dealing.listingSnapshot as Prisma.JsonValue | null) ?? null,
  }));
}

export async function fetchTradeRecordsFromApi(options?: {
  navis?: NaviDto[];
  tradeDtos?: TradeDto[];
}): Promise<TradeRecord[]> {
  const [dealings, tradeDtos] = await Promise.all([
    options?.navis ?? fetchNavis(),
    options?.tradeDtos ?? fetchTradeDtos(),
  ]);

  const naviTrades = dealings
    .map((dealing) => mapNaviToTradeRecord(dealing))
    .filter((dealing): dealing is TradeRecord => Boolean(dealing));

  const tradeRecords = tradeDtos
    .map((dto) => normalizeDealingRecord(transformTrade(dto as TradeDto)))
    .filter((record): record is TradeRecord => Boolean(record?.id));

  return sortTradesByDate(mergeTrades(tradeRecords, naviTrades));
}

export async function fetchNaviById(dealingId: string): Promise<NaviDto | null> {
  const response = await fetchWithDevHeader(`/api/trades/${dealingId}`);

  if (response.status === 404) return null;

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to fetch trade ${dealingId}: ${response.status} ${detail}`);
  }

  const json = (await response.json()) as unknown;
  const parsed = naviSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return {
    ...parsed.data,
    payload: (parsed.data.payload as Prisma.JsonValue | null) ?? null,
    listingSnapshot: (parsed.data.listingSnapshot as Prisma.JsonValue | null) ?? null,
  } satisfies NaviDto;
}

export async function fetchTradeRecordById(dealingId: string): Promise<TradeRecord | null> {
  const tradeDtos = await fetchTradeDtos();
  const numericId = Number(dealingId);
  const matchingTrade = tradeDtos.find(
    (candidate) => candidate.id === numericId || String(candidate.id) === dealingId
  );

  if (!matchingTrade) return null;

  return normalizeDealingRecord(transformTrade(matchingTrade as TradeDto));
}

export async function updateTradeStatus(dealingId: string, status: "APPROVED" | "REJECTED") {
  const response = await fetchWithDevHeader(
    `/api/trades/${dealingId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to update trade ${dealingId}: ${response.status} ${detail}`);
  }
}

async function updateDealingProgress(
  dealingId: string,
  status: "CONFIRM_REQUIRED" | "COMPLETED",
  actorUserId?: string
) {
  const response = await fetchWithDevHeader(
    `/api/trades/records/${dealingId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
    actorUserId
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to update dealing ${dealingId}: ${response.status} ${detail}`);
  }
}

export async function markTradePaid(dealingId: string, actorUserId?: string) {
  await updateDealingProgress(dealingId, "CONFIRM_REQUIRED", actorUserId);
}

export async function markTradeCompleted(dealingId: string, actorUserId?: string) {
  await updateDealingProgress(dealingId, "COMPLETED", actorUserId);
}

export async function saveTradeShippingInfo(
  dealingId: string,
  shipping: ShippingInfo,
  contacts?: BuyerContact[],
  actorUserId?: string
) {
  const response = await fetchWithDevHeader(
    `/api/trades/${dealingId}/shipping`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipping, contacts: contacts ?? undefined }),
    },
    actorUserId
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to update shipping for trade ${dealingId}: ${response.status} ${detail}`);
  }

  return (await response.json()) as unknown;
}
