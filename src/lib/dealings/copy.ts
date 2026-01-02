import { todoUiMap } from "@/lib/todo/todoUiMap";
import { TodoKind } from "@/lib/todo/todoKinds";

export function getInProgressDescription(kind: "buy" | "sell", todoKind: TodoKind): string {
  const def = todoUiMap[todoKind];
  if (!def) return "";

  return kind === "buy" ? def.description.buyer : def.description.seller;
}
