import { TodoKind } from "./todoKinds";

export type TodoItem = {
  kind: TodoKind;
  assignee: "buyer" | "seller";
  status: "open" | "done";
};
