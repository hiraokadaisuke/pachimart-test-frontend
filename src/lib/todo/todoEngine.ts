import { TodoKind } from "./todoKinds";
import { TodoItem } from "./types";
import { todoUiMap } from "./todoUiMap";

export function completeTodo(todos: TodoItem[], completedKind: TodoKind): TodoItem[] {
  const def = todoUiMap[completedKind];
  const updatedTodos = todos.map((t): TodoItem =>
    t.kind === completedKind ? { ...t, status: "done" } : t
  );

  if (!def?.primaryAction?.nextTodo) {
    return updatedTodos;
  }

  return [
    ...updatedTodos,
    {
      kind: def.primaryAction.nextTodo,
      assignee: def.primaryAction.role,
      status: "open",
    } satisfies TodoItem,
  ];
}

export function getOpenTodo(todos: TodoItem[] = []): TodoItem | undefined {
  return todos.find((todo) => todo.status === "open");
}
