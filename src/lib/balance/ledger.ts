export type LedgerEntryCategory = "PURCHASE" | "SALE" | "DEPOSIT" | "WITHDRAWAL";

export type LedgerEntry = {
  id: string;
  userId: string;
  category: LedgerEntryCategory;
  amountYen: number;
  occurredAt: string;
  tradeId?: string;
  counterpartyName?: string;
  makerName?: string;
  itemName?: string;
  memo?: string;
  balanceAfterYen?: number;
};

type LedgerState = Record<string, LedgerEntry[]>;

type LedgerEntryInput = Omit<LedgerEntry, "id" | "occurredAt" | "userId"> & {
  id?: string;
  occurredAt?: string;
  userId?: string;
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
        return [userId, entries.map((entry) => normalizeEntry(entry, userId)).filter(Boolean) as LedgerEntry[]];
      }),
    );
  } catch {
    return {};
  }
};

const normalizeEntry = (value: unknown, userIdHint?: string): LedgerEntry | null => {
  if (!value || typeof value !== "object") return null;
  const entry = value as LedgerEntry & {
    amount?: number;
    createdAt?: string;
    kind?: string;
  };

  const category = resolveCategory(entry);
  if (!category) return null;

  const amountYen = resolveAmount(entry, category);
  if (!Number.isFinite(amountYen) || amountYen <= 0) return null;

  const occurredAt = typeof entry.occurredAt === "string" ? entry.occurredAt : entry.createdAt;

  if (!occurredAt || typeof entry.id !== "string") return null;

  return {
    id: entry.id,
    userId: entry.userId ?? userIdHint ?? "",
    category,
    amountYen,
    occurredAt,
    tradeId: entry.tradeId,
    counterpartyName: entry.counterpartyName,
    makerName: entry.makerName,
    itemName: entry.itemName,
    memo: entry.memo,
    balanceAfterYen: entry.balanceAfterYen,
  } satisfies LedgerEntry;
};

const resolveCategory = (
  entry: Partial<LedgerEntry> & { kind?: string; amount?: number }
): LedgerEntryCategory | null => {
  if (entry.category === "PURCHASE" || entry.category === "SALE" || entry.category === "DEPOSIT") {
    return entry.category;
  }
  if (entry.category === "WITHDRAWAL") return "WITHDRAWAL";

  if (entry.kind === "PAYMENT") return "PURCHASE";
  if (entry.kind === "SALE") return "SALE";
  if (entry.kind === "DEPOSIT") return "DEPOSIT";

  if (typeof entry.amount === "number") {
    return entry.amount < 0 ? "PURCHASE" : "DEPOSIT";
  }

  return null;
};

const resolveAmount = (
  entry: Partial<LedgerEntry> & { amount?: number },
  category: LedgerEntryCategory
): number => {
  if (typeof entry.amountYen === "number") return Math.abs(entry.amountYen);
  if (typeof entry.amount === "number") return Math.abs(entry.amount);

  switch (category) {
    case "PURCHASE":
    case "WITHDRAWAL":
      return Math.abs(entry.amount ?? 0);
    default:
      return Math.abs(entry.amount ?? 0);
  }
};

const generateEntryId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ledger_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export function addLedgerEntry(userId: string, entry: LedgerEntryInput): LedgerEntry | null {
  if (typeof window === "undefined") return null;
  if (!userId || !entry || !Number.isFinite(entry.amountYen)) return null;

  const amountYen = entry.amountYen;
  if (amountYen === 0) return null;

  const ledger = parseStoredLedger(window.localStorage.getItem(STORAGE_KEY));
  const occurredAt = entry.occurredAt ?? new Date().toISOString();
  const newEntry: LedgerEntry = {
    id: entry.id ?? generateEntryId(),
    userId: entry.userId ?? userId,
    category: entry.category,
    amountYen,
    occurredAt,
    tradeId: entry.tradeId,
    counterpartyName: entry.counterpartyName,
    makerName: entry.makerName,
    itemName: entry.itemName,
    memo: entry.memo,
    balanceAfterYen: entry.balanceAfterYen,
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
