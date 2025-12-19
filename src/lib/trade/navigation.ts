import { TodoKind } from "@/lib/todo/todoKinds";

import { resolveCurrentTodoKind } from "./todo";
import { TradeRecord } from "./types";

export function getActorRole(
  trade: Pick<TradeRecord, "buyerUserId" | "sellerUserId">,
  currentUserId: string
): "buyer" | "seller" {
  return trade.buyerUserId === currentUserId ? "buyer" : "seller";
}

export function getStatementPath(
  tradeId: string,
  todoKind: TodoKind | null,
  actorRole: "buyer" | "seller"
): string {
  if (todoKind === "application_sent" && actorRole === "buyer") {
    return `/navi/buyer/requests/${tradeId}`;
  }
  return `/navi/${tradeId}/statement`;
}

export function getStatementPathForTrade(
  trade: Pick<TradeRecord, "id" | "status" | "todos">,
  actorRole: "buyer" | "seller"
): string {
  const todoKind = resolveCurrentTodoKind(trade);
  return getStatementPath(trade.id, todoKind, actorRole);
}
