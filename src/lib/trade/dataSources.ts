import { fetchWithDevHeader } from "@/lib/api/fetchWithDevHeader";
import { mergeTrades } from "./merge";
import { type TradeRecord } from "./types";
import { tradeDtoListSchema, transformTrade } from "./transform";
import {
  getHistoryTradesForUser,
  getPurchaseHistoryForUser,
  getSalesHistoryForUser,
  getTradesForUser,
  loadAllTrades,
} from "./storage";
import { loadAcceptedOnlineInquiryTrades } from "./onlineInquiryTrades";

async function loadTradesFromApi(): Promise<TradeRecord[]> {
  try {
    const recordsResponse = await fetchWithDevHeader("/api/trades/records");

    if (!recordsResponse.ok) {
      throw new Error(`Failed to fetch trades: ${recordsResponse.status}`);
    }

    const json = (await recordsResponse.json()) as unknown;
    const parsed = tradeDtoListSchema.safeParse(json);

    if (!parsed.success) {
      throw new Error(parsed.error.message);
    }

    const eligibleTrades = parsed.data.filter((trade) =>
      ["IN_PROGRESS", "COMPLETED", "CANCELED"].includes(trade.status)
    );

    const tradeRecords = eligibleTrades.map(transformTrade);

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
  const [apiTrades, storedTrades] = await Promise.all([loadTradesFromApi(), Promise.resolve(loadAllTrades())]);

  const apiTradesById = new Map(apiTrades.map((trade) => [trade.id, trade]));
  const merged = mergeTrades(
    apiTrades,
    storedTrades.filter((stored) => {
      const apiTrade = apiTradesById.get(stored.id);
      if (!apiTrade) return true;

      const apiUpdatedAt = new Date(apiTrade.updatedAt ?? apiTrade.createdAt ?? 0).getTime();
      const storedUpdatedAt = new Date(stored.updatedAt ?? stored.createdAt ?? 0).getTime();

      return storedUpdatedAt > apiUpdatedAt;
    })
  );

  return merged.sort((a, b) => {
    const aDate = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
    const bDate = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
    return bDate - aDate;
  });
}

export async function loadTradesForUser(userId: string): Promise<TradeRecord[]> {
  const trades = await loadTradesFromApi();
  return getTradesForUser(userId, trades);
}

export async function loadHistoryTradesForUser(userId: string): Promise<TradeRecord[]> {
  const [trades, onlineInquiryTrades] = await Promise.all([
    loadTradesFromApi(),
    loadAcceptedOnlineInquiryTrades(),
  ]);
  return getHistoryTradesForUser(userId, [...trades, ...onlineInquiryTrades]);
}

export async function loadPurchaseHistoryForUser(userId: string): Promise<TradeRecord[]> {
  const [trades, onlineInquiryTrades] = await Promise.all([
    loadTradesFromApi(),
    loadAcceptedOnlineInquiryTrades(),
  ]);
  return getPurchaseHistoryForUser(userId, [...trades, ...onlineInquiryTrades]);
}

export async function loadSalesHistoryForUser(userId: string): Promise<TradeRecord[]> {
  const [trades, onlineInquiryTrades] = await Promise.all([
    loadTradesFromApi(),
    loadAcceptedOnlineInquiryTrades(),
  ]);
  return getSalesHistoryForUser(userId, [...trades, ...onlineInquiryTrades]);
}

export async function loadTradeById(tradeId: string): Promise<TradeRecord | null> {
  const trades = await loadTradesFromApi();
  return trades.find((trade) => trade.id === tradeId) ?? null;
}
