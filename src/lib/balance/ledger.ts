export type LedgerEntryKind = "DEPOSIT" | "PAYMENT" | "SALE";

export type LedgerEntry = {
  id: string;
  kind: LedgerEntryKind;
  amount: number;
  createdAt: string;
  tradeId?: string;
};

type LedgerState = Record<string, LedgerEntry[]>;

type LedgerEntryInput = Omit<LedgerEntry, "id" | "createdAt"> & {
  id?: string;
  createdAt?: string;
};

const STORAGE_KEY = "dev_user_ledger";

const triggerLedgerSync = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("ledger_updated"));
};

const parseStoredLedger = (raw: string | null): LedgerState => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as LedgerState;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([userId, entries]) => {
        if (!Array.isArray(entries)) return [userId, []];
        return [userId, entries.filter(isLedgerEntry).map(normalizeEntry)];
      }),
    );
  } catch {
    return {};
  }
};

const isLedgerEntry = (value: unknown): value is LedgerEntry => {
  if (!value || typeof value !== "object") return false;
  const entry = value as LedgerEntry;
  return (
    typeof entry.id === "string" &&
    typeof entry.kind === "string" &&
    typeof entry.amount === "number" &&
    typeof entry.createdAt === "string"
  );
};

const normalizeEntry = (entry: LedgerEntry): LedgerEntry => ({
  id: entry.id,
  kind: entry.kind,
  amount: Number.isFinite(entry.amount) ? entry.amount : 0,
  createdAt: entry.createdAt,
  tradeId: entry.tradeId,
});

const generateEntryId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ledger_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export function addLedgerEntry(userId: string, entry: LedgerEntryInput): LedgerEntry | null {
  if (typeof window === "undefined") return null;
  if (!userId || !entry || !Number.isFinite(entry.amount)) return null;

  const amount = entry.amount;
  if (amount === 0) return null;

  const ledger = parseStoredLedger(window.localStorage.getItem(STORAGE_KEY));
  const createdAt = entry.createdAt ?? new Date().toISOString();
  const newEntry: LedgerEntry = {
    id: entry.id ?? generateEntryId(),
    kind: entry.kind,
    amount,
    createdAt,
    tradeId: entry.tradeId,
  };

  ledger[userId] = [...(ledger[userId] ?? []), newEntry];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
  triggerLedgerSync();
  return newEntry;
}

export function listLedgerEntries(userId: string): LedgerEntry[] {
  if (typeof window === "undefined") return [];
  if (!userId) return [];
  const ledger = parseStoredLedger(window.localStorage.getItem(STORAGE_KEY));
  return [...(ledger[userId] ?? [])];
}
