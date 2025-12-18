import { ProdTodoKind } from "./todoKinds.prod";
import { ExtTodoKind } from "./todoKinds.ext";

export type TodoKind = ProdTodoKind | ExtTodoKind;
