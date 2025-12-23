import { type TradeRecord } from "./types";
import { type TradeDto, transformTrade } from "./transform";
import { getHistoryTradesForUser, getPurchaseHistoryForUser, getSalesHistoryForUser, getTradesForUser } from "./storage";

async function loadTradesFromApi(): Promise<TradeRecord[]> {
  try {
    const response = await fetch("/api/trades/records");
    if (!response.ok) {
      throw new Error(`Failed to fetch trades: ${response.status}`);
    }

    const json = (await response.json()) as unknown;
    if (!Array.isArray(json)) {
      throw new Error("Invalid trade response");
    }

    return (json as TradeDto[]).map(transformTrade);
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
