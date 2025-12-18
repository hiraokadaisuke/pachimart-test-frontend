import { TodoKind } from "./todoKinds";
import { TodoItem } from "./types";
import { todoUiMap } from "./todoUiMap";

export function completeTodo(todos: TodoItem[], completedKind: TodoKind): TodoItem[] {
  const def = todoUiMap[completedKind];
  if (!def?.primaryAction?.nextTodo) {
    return todos.map((todo) =>
      todo.kind === completedKind ? { ...todo, status: "done" } : todo
    );
  }

  return [
    ...todos.map((t) =>
      t.kind === completedKind ? { ...t, status: "done" } : t
    ),
    {
      kind: def.primaryAction.nextTodo,
      assignee: def.primaryAction.role,
      status: "open",
    },
  ];
}

export function getOpenTodo(todos: TodoItem[] = []): TodoItem | undefined {
  return todos.find((todo) => todo.status === "open");
}
