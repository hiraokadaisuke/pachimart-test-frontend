import { TodoUiDef, todoUiMap } from "@/lib/todo/todoUiMap";
import { TodoKind } from "@/lib/todo/todoKinds";

export type TradeStatusKey = TodoKind;

export type TradeStatusDisplay = {
  key: TradeStatusKey;
  label: string;
  color: "gray" | "blue" | "yellow" | "green" | "red";
  section: TodoUiDef["section"];
};

export type TradeStatusDisplayContext = "inProgress" | "history";

const SECTION_COLOR: Record<TodoUiDef["section"], TradeStatusDisplay["color"]> = {
  approval: "blue",
  payment: "yellow",
  confirmation: "green",
  completed: "green",
  canceled: "red",
};

export const TRADE_STATUS_DEFINITIONS: TradeStatusDisplay[] = Object.entries(todoUiMap).map(
  ([key, def]) => ({
    key: key as TodoKind,
    label: def.title,
    color: SECTION_COLOR[def.section],
    section: def.section,
  })
);

export function getTradeStatusDisplay(
  statusKey: TradeStatusKey,
  _context?: TradeStatusDisplayContext
): TradeStatusDisplay | undefined {
  return TRADE_STATUS_DEFINITIONS.find((status) => status.key === statusKey);
}

export const IN_PROGRESS_STATUS_KEYS: TradeStatusKey[] = TRADE_STATUS_DEFINITIONS.filter(
  (status) => status.section !== "completed" && status.section !== "canceled"
).map((status) => status.key);

export const COMPLETED_STATUS_KEYS: TradeStatusKey[] = TRADE_STATUS_DEFINITIONS.filter(
  (status) => status.section === "completed" || status.section === "canceled"
).map((status) => status.key);
