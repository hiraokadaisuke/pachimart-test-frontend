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
  return trade.status === "APPROVAL_REQUIRED" && getActorRole(trade, currentUserId) === "buyer";
}

export function canMarkPaid(trade: TradeRecord, currentUserId: string): boolean {
  return trade.status === "PAYMENT_REQUIRED" && getActorRole(trade, currentUserId) === "buyer";
}

export function canMarkCompleted(trade: TradeRecord, currentUserId: string): boolean {
  return trade.status === "CONFIRM_REQUIRED" && getActorRole(trade, currentUserId) === "buyer";
}

export function canCancel(trade: TradeRecord, currentUserId: string): boolean {
  const role = getActorRole(trade, currentUserId);
  if (role === "none") return false;
  if (trade.status === "CANCELED" || trade.status === "COMPLETED") return false;
  return true;
}
