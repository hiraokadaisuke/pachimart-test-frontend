import { fetchTradeRecordsFromApi } from "./api";
import { type TradeRecord } from "./types";
import { type TradeDto, transformTrade } from "./transform";
import { getHistoryTradesForUser, getPurchaseHistoryForUser, getSalesHistoryForUser, getTradesForUser } from "./storage";

async function loadTradesFromApi(): Promise<TradeRecord[]> {
  try {
    const [recordsResponse, tradeNaviRecords] = await Promise.all([
      fetch("/api/trades/records"),
      fetchTradeRecordsFromApi().catch((error) => {
        console.error("Failed to load trade navis", error);
        return [] as TradeRecord[];
      }),
    ]);

    if (!recordsResponse.ok) {
      throw new Error(`Failed to fetch trades: ${recordsResponse.status}`);
    }

    const json = (await recordsResponse.json()) as unknown;
    if (!Array.isArray(json)) {
      throw new Error("Invalid trade response");
    }

    const tradeRecords = (json as TradeDto[]).map(transformTrade);

    const seenKeys = new Set<string>();
    const normalizeKey = (trade: TradeRecord) =>
      typeof trade.naviId === "number" ? `navi:${trade.naviId}` : `id:${trade.id}`;

    tradeRecords.forEach((record) => seenKeys.add(normalizeKey(record)));

    tradeNaviRecords.forEach((record) => {
      const key = normalizeKey(record);
      if (!seenKeys.has(key)) {
        tradeRecords.push(record);
        seenKeys.add(key);
      }
    });

    return tradeRecords.sort((a, b) => {
      const aDate = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      const bDate = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
      return bDate - aDate;
    });
  } catch (error) {
    console.error("Failed to load trades from API", error);
    return [];
  }
}

export async function loadAllTradesWithApi(): Promise<TradeRecord[]> {
  return loadTradesFromApi();
}

export async function loadTradesForUser(userId: string): Promise<TradeRecord[]> {
  const trades = await loadTradesFromApi();
  return getTradesForUser(userId, trades);
}

export async function loadHistoryTradesForUser(userId: string): Promise<TradeRecord[]> {
  const trades = await loadTradesFromApi();
  return getHistoryTradesForUser(userId, trades);
}

export async function loadPurchaseHistoryForUser(userId: string): Promise<TradeRecord[]> {
  const trades = await loadTradesFromApi();
  return getPurchaseHistoryForUser(userId, trades);
}

export async function loadSalesHistoryForUser(userId: string): Promise<TradeRecord[]> {
  const trades = await loadTradesFromApi();
  return getSalesHistoryForUser(userId, trades);
}

export async function loadTradeById(tradeId: string): Promise<TradeRecord | null> {
  const trades = await loadTradesFromApi();
  return trades.find((trade) => trade.id === tradeId) ?? null;
}
