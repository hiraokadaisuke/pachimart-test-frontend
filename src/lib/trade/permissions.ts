import { deriveTradeStatusFromTodos } from "./deriveStatus";
import { resolveCurrentTodoKind } from "./todo";
import { TradeRecord } from "./types";

export type TradeActorRole = "buyer" | "seller" | "none";

export function getActorRole(trade: TradeRecord, currentUserId: string): TradeActorRole {
  const buyerId = trade.buyerUserId ?? trade.buyer.userId;
  const sellerId = trade.sellerUserId ?? trade.seller.userId;

  if (buyerId && buyerId === currentUserId) return "buyer";
  if (sellerId && sellerId === currentUserId) return "seller";
  return "none";
}

export function canApprove(trade: TradeRecord, currentUserId: string): boolean {
  return resolveCurrentTodoKind(trade) === "application_sent" && getActorRole(trade, currentUserId) === "buyer";
}

export function canMarkPaid(trade: TradeRecord, currentUserId: string): boolean {
  return resolveCurrentTodoKind(trade) === "application_approved" && getActorRole(trade, currentUserId) === "buyer";
}

export function canMarkCompleted(trade: TradeRecord, currentUserId: string): boolean {
  return resolveCurrentTodoKind(trade) === "payment_confirmed" && getActorRole(trade, currentUserId) === "buyer";
}

export function canCancel(trade: TradeRecord, currentUserId: string): boolean {
  const role = getActorRole(trade, currentUserId);
  if (role === "none") return false;
  const derivedStatus = deriveTradeStatusFromTodos(trade);
  if (derivedStatus === "CANCELED" || derivedStatus === "COMPLETED") return false;
  return true;
}
