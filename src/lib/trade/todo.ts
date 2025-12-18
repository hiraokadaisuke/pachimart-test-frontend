import { todoUiMap } from "@/lib/todo/todoUiMap";
import { completeTodo, getOpenTodo } from "@/lib/todo/todoEngine";
import { TodoKind } from "@/lib/todo/todoKinds";
import { TodoItem } from "@/lib/todo/types";

import { calculateStatementTotals } from "./calcTotals";
import { getActorRole } from "./navigation";
import { TradeRecord, TradeStatus } from "./types";

const STATUS_TO_TODO_KIND: Record<TradeStatus, TodoKind> = {
  APPROVAL_REQUIRED: "application_sent",
  PAYMENT_REQUIRED: "application_approved",
  CONFIRM_REQUIRED: "payment_confirmed",
  COMPLETED: "trade_completed",
  CANCELED: "trade_canceled",
};

const TODO_KIND_TO_STATUS: Record<TodoKind, TradeStatus> = {
  application_sent: "APPROVAL_REQUIRED",
  application_approved: "PAYMENT_REQUIRED",
  payment_confirmed: "CONFIRM_REQUIRED",
  trade_completed: "COMPLETED",
  trade_canceled: "CANCELED",
  x_test_shipping_address_fix: "APPROVAL_REQUIRED",
};

function getDefaultAssignee(kind: TodoKind): TodoItem["assignee"] {
  return todoUiMap[kind]?.primaryAction?.role ?? "buyer";
}

export function buildTodosFromStatus(status: TradeStatus): TodoItem[] {
  const todos: TodoItem[] = [];
  const push = (kind: TodoKind, state: TodoItem["status"]) =>
    todos.push({
      kind,
      assignee: getDefaultAssignee(kind),
      status: state,
    });

  switch (status) {
    case "APPROVAL_REQUIRED":
      push("application_sent", "open");
      break;
    case "PAYMENT_REQUIRED":
      push("application_sent", "done");
      push("application_approved", "open");
      break;
    case "CONFIRM_REQUIRED":
      push("application_sent", "done");
      push("application_approved", "done");
      push("payment_confirmed", "open");
      break;
    case "COMPLETED":
      push("application_sent", "done");
      push("application_approved", "done");
      push("payment_confirmed", "done");
      push("trade_completed", "done");
      break;
    case "CANCELED":
      push("trade_canceled", "done");
      break;
  }

  return todos;
}

export function ensureTradeTodos(trade: TradeRecord): TodoItem[] {
  if (trade.todos?.length) return trade.todos;
  return buildTodosFromStatus(trade.status);
}

export function mapStatusToTodoKind(status: TradeStatus): TodoKind {
  return STATUS_TO_TODO_KIND[status];
}

export function deriveStatusFromTodos(todos: TodoItem[], fallback: TradeStatus = "APPROVAL_REQUIRED"): TradeStatus {
  const openTodo = getOpenTodo(todos);
  if (openTodo) return TODO_KIND_TO_STATUS[openTodo.kind] ?? fallback;

  if (todos.some((todo) => todo.kind === "trade_canceled")) return "CANCELED";

  const lastTodo = todos.at(-1);
  if (lastTodo) return TODO_KIND_TO_STATUS[lastTodo.kind] ?? fallback;

  return fallback;
}

export function resolveCurrentTodoKind(trade: Pick<TradeRecord, "status" | "todos">): TodoKind {
  const active = getOpenTodo(trade.todos ?? []);
  if (active) return active.kind;
  return mapStatusToTodoKind(trade.status);
}

export function getTodoPresentation(trade: TradeRecord, viewerRole: "buyer" | "seller") {
  const todos = ensureTradeTodos(trade);
  const activeTodo = getOpenTodo(todos);
  const todoKind = activeTodo?.kind ?? mapStatusToTodoKind(trade.status);
  const def = todoUiMap[todoKind];

  return {
    todos,
    activeTodo,
    todoKind,
    section: def.section,
    description: def.description[viewerRole],
    primaryAction:
      def.primaryAction && def.primaryAction.role === viewerRole ? def.primaryAction : undefined,
    assignee: activeTodo?.assignee ?? getDefaultAssignee(todoKind),
  } as const;
}

export function advanceTradeTodo(
  trade: TradeRecord,
  completedKind: TodoKind,
  actorUserId: string
): TradeRecord | null {
  const todos = ensureTradeTodos(trade);
  const openTodo = getOpenTodo(todos);
  if (!openTodo || openTodo.kind !== completedKind) return null;

  const actorRole = getActorRole(trade, actorUserId);
  if (actorRole !== openTodo.assignee) return null;

  const now = new Date().toISOString();
  let updatedTrade: TradeRecord = { ...trade };

  if (completedKind === "application_sent") {
    updatedTrade.contractDate = updatedTrade.contractDate ?? now;
  }

  if (completedKind === "application_approved") {
    const totals = calculateStatementTotals(trade.items, trade.taxRate ?? 0.1);
    updatedTrade.paymentDate = now;
    updatedTrade.paymentAmount = totals.total;
    updatedTrade.paymentMethod = updatedTrade.paymentMethod ?? "振込（テスト）";
  }

  if (completedKind === "payment_confirmed") {
    updatedTrade.completedAt = now;
  }

  const nextTodos = completeTodo(todos, completedKind);
  const status = deriveStatusFromTodos(nextTodos, trade.status);

  updatedTrade = {
    ...updatedTrade,
    todos: nextTodos,
    status,
    updatedAt: now,
  };

  return updatedTrade;
}

export function cancelTradeTodos(trade: TradeRecord): TodoItem[] {
  const existing = ensureTradeTodos(trade);
  const closed: TodoItem[] = existing.map((todo): TodoItem =>
    todo.status === "open" ? ({ ...todo, status: "done" } as TodoItem) : todo
  );
  if (closed.some((todo) => todo.kind === "trade_canceled")) {
    return closed;
  }
  return [
    ...closed,
    {
      kind: "trade_canceled",
      assignee: getDefaultAssignee("trade_canceled"),
      status: "done",
    },
  ];
}
