export type SerialInputRow = {
  p: number;
  board: string;
  frame: string;
  main: string;
  removalDate: string;
};

export type SerialInputPayload = {
  inventoryId: string;
  units: number;
  rows: SerialInputRow[];
  updatedAt: string;
};

const SERIAL_INPUT_PREFIX = "pachimart:serialInput:";
const SERIAL_ROWS_PREFIX = "pachimart:inventory:serialRows:";
const ORDER_KEY = `${SERIAL_INPUT_PREFIX}order`;
const DRAFT_SUFFIX = ":draft";

const safeParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error("Failed to parse serial input data", error);
    return null;
  }
};

const readLocalStorage = <T,>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  return safeParse<T>(raw);
};

const writeLocalStorage = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const removeLocalStorage = (key: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
};

const serialKey = (inventoryId: string) => `${SERIAL_INPUT_PREFIX}${inventoryId}`;
const serialDraftKey = (inventoryId: string) => `${serialKey(inventoryId)}${DRAFT_SUFFIX}`;
const serialRowsKey = (inventoryId: string) => `${SERIAL_ROWS_PREFIX}${inventoryId}`;

export const loadSerialRows = async (inventoryId: string): Promise<SerialInputRow[]> =>
  readLocalStorage<SerialInputRow[]>(serialRowsKey(inventoryId)) ?? [];

export const loadSerialRowsSync = (inventoryId: string): SerialInputRow[] =>
  readLocalStorage<SerialInputRow[]>(serialRowsKey(inventoryId)) ?? [];

export const saveSerialRows = async (inventoryId: string, rows: SerialInputRow[]): Promise<void> => {
  writeLocalStorage(serialRowsKey(inventoryId), rows);
};

export const loadSerialInput = (inventoryId: string): SerialInputPayload | null =>
  readLocalStorage<SerialInputPayload>(serialKey(inventoryId));

export const loadSerialDraft = (inventoryId: string): SerialInputPayload | null =>
  readLocalStorage<SerialInputPayload>(serialDraftKey(inventoryId));

export const saveSerialInput = (payload: SerialInputPayload) =>
  writeLocalStorage(serialKey(payload.inventoryId), payload);

export const saveSerialDraft = (payload: SerialInputPayload) =>
  writeLocalStorage(serialDraftKey(payload.inventoryId), payload);

export const clearSerialDraft = (inventoryId: string) => removeLocalStorage(serialDraftKey(inventoryId));

export const hasSerialInput = (inventoryId: string): boolean => loadSerialInput(inventoryId) != null;

export const loadSerialOrder = (): string[] => readLocalStorage<string[]>(ORDER_KEY) ?? [];

export const saveSerialOrder = (inventoryIds: string[]): void => writeLocalStorage(ORDER_KEY, inventoryIds);

export const nextInventoryId = (currentId: string): string | null => {
  const list = loadSerialOrder();
  if (!list.length) return null;
  const currentIndex = list.findIndex((id) => id === currentId);
  if (currentIndex === -1) return null;
  return list[currentIndex + 1] ?? null;
};
