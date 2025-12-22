import { fetchTradeRecordsFromApi } from "./api";
import { getHistoryTradesForUser, getPurchaseHistoryForUser, getSalesHistoryForUser, getTradesForUser, loadAllTrades } from "./storage";
import { mergeTrades } from "./merge";
import { type TradeRecord } from "./types";

async function loadMergedTrades(): Promise<TradeRecord[]> {
  const localTrades = loadAllTrades();

  try {
    const apiTrades = await fetchTradeRecordsFromApi();
    return mergeTrades(localTrades, apiTrades);
  } catch (error) {
    console.error("Failed to load trades from API", error);
    return localTrades;
  }
}

export async function loadAllTradesWithApi(): Promise<TradeRecord[]> {
  return loadMergedTrades();
}

export async function loadTradesForUser(userId: string): Promise<TradeRecord[]> {
  const trades = await loadMergedTrades();
  return getTradesForUser(userId, trades);
}

export async function loadHistoryTradesForUser(userId: string): Promise<TradeRecord[]> {
  const trades = await loadMergedTrades();
  return getHistoryTradesForUser(userId, trades);
}

export async function loadPurchaseHistoryForUser(userId: string): Promise<TradeRecord[]> {
  const trades = await loadMergedTrades();
  return getPurchaseHistoryForUser(userId, trades);
}

export async function loadSalesHistoryForUser(userId: string): Promise<TradeRecord[]> {
  const trades = await loadMergedTrades();
  return getSalesHistoryForUser(userId, trades);
}

export async function loadTradeById(tradeId: string): Promise<TradeRecord | null> {
  const trades = await loadMergedTrades();
  return trades.find((trade) => trade.id === tradeId) ?? null;
}
