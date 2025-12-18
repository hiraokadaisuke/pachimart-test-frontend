import { getOpenTodo } from "@/lib/todo/todoEngine";
import { TodoKind } from "@/lib/todo/todoKinds";
import { TodoItem } from "@/lib/todo/types";
import { TodoUiDef, todoUiMap } from "@/lib/todo/todoUiMap";

import { TradeRecord, TradeStatus } from "./types";

const SECTION_TO_TRADE_STATUS: Record<TodoUiDef["section"], TradeStatus> = {
  approval: "APPROVAL_REQUIRED",
  payment: "PAYMENT_REQUIRED",
  confirmation: "CONFIRM_REQUIRED",
  completed: "COMPLETED",
  canceled: "CANCELED",
};

function getSectionFromTodo(todoKind: TodoKind | undefined): TodoUiDef["section"] | null {
  if (!todoKind) return null;
  return todoUiMap[todoKind]?.section ?? null;
}

function deriveFromSection(section: TodoUiDef["section"] | null): TradeStatus {
  if (!section) return "APPROVAL_REQUIRED";
  return SECTION_TO_TRADE_STATUS[section] ?? "APPROVAL_REQUIRED";
}

function hasTodoOfKind(todos: TodoItem[], kind: TodoKind): boolean {
  return todos.some((todo) => todo.kind === kind);
}

export function deriveTradeStatusFromTodos(
  trade: Pick<TradeRecord, "todos">,
  _currentUserId?: string
): TradeStatus {
  const todos = trade.todos ?? [];
  const openTodo = getOpenTodo(todos);
  if (openTodo) {
    return deriveFromSection(getSectionFromTodo(openTodo.kind));
  }

  if (hasTodoOfKind(todos, "trade_canceled")) {
    return "CANCELED";
  }

  if (hasTodoOfKind(todos, "trade_completed")) {
    return "COMPLETED";
  }

  const lastTodo = todos.at(-1);
  return deriveFromSection(getSectionFromTodo(lastTodo?.kind));
}
