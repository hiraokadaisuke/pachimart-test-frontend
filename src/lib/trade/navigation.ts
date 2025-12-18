import { TradeRecord, TradeStatus } from "./types";

export function getActorRole(
  trade: Pick<TradeRecord, "buyerUserId" | "sellerUserId">,
  currentUserId: string
): "buyer" | "seller" {
  return trade.buyerUserId === currentUserId ? "buyer" : "seller";
}

export function getStatementPath(
  tradeId: string,
  status: TradeStatus,
  actorRole: "buyer" | "seller"
): string {
  if (status === "APPROVAL_REQUIRED" && actorRole === "buyer") {
    return `/trade-navi/buyer/requests/${tradeId}`;
  }
  return `/trade-navi/${tradeId}/statement`;
}
