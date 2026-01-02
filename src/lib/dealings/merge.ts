import { type TradeRecord } from "./types";

export function mergeTrades(primary: TradeRecord[], secondary: TradeRecord[]): TradeRecord[] {
  const map = new Map<string, TradeRecord>();

  primary.forEach((trade) => {
    if (trade.id) {
      map.set(trade.id, trade);
    }
  });

  secondary.forEach((trade) => {
    if (trade.id) {
      map.set(trade.id, trade);
    }
  });

  return Array.from(map.values());
}
