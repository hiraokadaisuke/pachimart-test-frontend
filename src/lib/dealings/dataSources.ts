import { fetchTradeRecordsFromApi } from "./api";
import { type TradeRecord } from "./types";

const sortTradesByDate = (trades: TradeRecord[]) =>
  trades.sort((a, b) => {
    const aDate = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
    const bDate = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
    return bDate - aDate;
  });

const HISTORY_STATUSES = [
  "APPROVAL_REQUIRED",
  "PAYMENT_REQUIRED",
  "CONFIRM_REQUIRED",
  "COMPLETED",
  "CANCELED",
];

async function loadTradesFromApi(): Promise<TradeRecord[]> {
  try {
    const trades = await fetchTradeRecordsFromApi();
    return sortTradesByDate(trades);
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
  return trades.filter(
    (dealing) => dealing.sellerUserId === userId || dealing.buyerUserId === userId
  );
}

export async function loadHistoryTradesForUser(userId: string): Promise<TradeRecord[]> {
  const trades = await loadTradesFromApi();
  return trades.filter(
    (dealing) =>
      (dealing.sellerUserId === userId || dealing.buyerUserId === userId) &&
      HISTORY_STATUSES.includes(dealing.status)
  );
}

export async function loadPurchaseHistoryForUser(userId: string): Promise<TradeRecord[]> {
  const trades = await loadTradesFromApi();
  return trades.filter(
    (dealing) => dealing.buyerUserId === userId && HISTORY_STATUSES.includes(dealing.status)
  );
}

export async function loadSalesHistoryForUser(userId: string): Promise<TradeRecord[]> {
  const trades = await loadTradesFromApi();
  return trades.filter(
    (dealing) => dealing.sellerUserId === userId && HISTORY_STATUSES.includes(dealing.status)
  );
}

export async function loadTradeById(tradeId: string): Promise<TradeRecord | null> {
  const trades = await loadTradesFromApi();
  return trades.find((trade) => trade.id === tradeId) ?? null;
}
