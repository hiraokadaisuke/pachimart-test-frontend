import { todoUiMap } from "@/lib/todo/todoUiMap";
import { completeTodo, getOpenTodo } from "@/lib/todo/todoEngine";
import { TodoKind } from "@/lib/todo/todoKinds";
import { TodoItem } from "@/lib/todo/types";

import { calculateStatementTotals } from "./calcTotals";
import { deriveTradeStatusFromTodos } from "./deriveStatus";
import { getActorRole } from "./navigation";
import { TradeRecord, TradeStatus } from "./types";

const STATUS_TO_TODO_KIND: Record<TradeStatus, TodoKind> = {
  APPROVAL_REQUIRED: "application_sent",
  PAYMENT_REQUIRED: "application_approved",
  CONFIRM_REQUIRED: "payment_confirmed",
  COMPLETED: "trade_completed",
  CANCELED: "trade_canceled",
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

export function ensureTradeTodos(dealing: TradeRecord): TodoItem[] {
  if (dealing.todos?.length) return dealing.todos;
  return buildTodosFromStatus(dealing.status);
}

export function mapStatusToTodoKind(status: TradeStatus): TodoKind {
  return STATUS_TO_TODO_KIND[status];
}

export function resolveCurrentTodoKind(dealing: Pick<TradeRecord, "status" | "todos">): TodoKind {
  const todos = dealing.todos?.length ? dealing.todos : buildTodosFromStatus(dealing.status);
  const active = getOpenTodo(todos);
  if (active) return active.kind;
  const derivedStatus = deriveTradeStatusFromTodos({ todos });
  return mapStatusToTodoKind(derivedStatus);
}

export function getTodoPresentation(dealing: TradeRecord, viewerRole: "buyer" | "seller") {
  const todos = ensureTradeTodos(dealing);
  const activeTodo = getOpenTodo(todos);
  const derivedStatus = deriveTradeStatusFromTodos({ todos });
  const todoKind = activeTodo?.kind ?? mapStatusToTodoKind(derivedStatus);
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
  dealing: TradeRecord,
  completedKind: TodoKind,
  actorUserId: string
): TradeRecord | null {
  const todos = ensureTradeTodos(dealing);
  const openTodo = getOpenTodo(todos);
  if (!openTodo || openTodo.kind !== completedKind) return null;

  const actorRole = getActorRole(dealing, actorUserId);
  if (actorRole !== openTodo.assignee) return null;

  const now = new Date().toISOString();
  let updatedDealing: TradeRecord = { ...dealing };

  if (completedKind === "application_sent") {
    updatedDealing.contractDate = updatedDealing.contractDate ?? now;
  }

  if (completedKind === "application_approved") {
    const totals = calculateStatementTotals(dealing.items, dealing.taxRate ?? 0.1);
    updatedDealing.paymentDate = now;
    updatedDealing.paymentAmount = totals.total;
    updatedDealing.paymentMethod = updatedDealing.paymentMethod ?? "振込（テスト）";
  }

  if (completedKind === "payment_confirmed") {
    updatedDealing.completedAt = now;
  }

  const nextTodos = completeTodo(todos, completedKind);
  const status = deriveTradeStatusFromTodos({ todos: nextTodos }, actorUserId);

  updatedDealing = {
    ...updatedDealing,
    todos: nextTodos,
    status,
    updatedAt: now,
  };

  return updatedDealing;
}

export function cancelTradeTodos(dealing: TradeRecord): TodoItem[] {
  const existing = ensureTradeTodos(dealing);
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
