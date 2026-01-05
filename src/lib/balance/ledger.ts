import { fetchWithDevHeader } from "@/lib/api/fetchWithDevHeader";

export type LedgerEntryCategory = "PURCHASE" | "SALE" | "DEPOSIT" | "WITHDRAWAL";

export type LedgerEntryKind = "PLANNED" | "ACTUAL";

export type LedgerEntry = {
  id: string;
  userId: string;
  category: LedgerEntryCategory;
  kind: LedgerEntryKind;
  amountYen: number;
  occurredAt: string;
  tradeId?: number | null;
  counterpartyName?: string | null;
  makerName?: string | null;
  itemName?: string | null;
  memo?: string | null;
  balanceAfterYen?: number | null;
  breakdown?: unknown;
};

export type LedgerEntryInput = Omit<LedgerEntry, "id" | "occurredAt" | "userId" | "kind"> & {
  id?: string;
  occurredAt?: string;
  userId?: string;
  kind?: LedgerEntryKind;
};

const triggerLedgerSync = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("ledger_updated"));
};

const normalizeEntry = (raw: unknown): LedgerEntry | null => {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as LedgerEntry & { amount?: number };

  const category = entry.category;
  const amountYen = Number(entry.amountYen ?? entry.amount ?? 0);
  const occurredAt = typeof entry.occurredAt === "string" ? entry.occurredAt : undefined;

  if (!category || !occurredAt || !Number.isFinite(amountYen) || amountYen <= 0) return null;

  return {
    id: String(entry.id ?? ""),
    userId: String(entry.userId ?? ""),
    category,
    kind: entry.kind ?? "PLANNED",
    amountYen: amountYen,
    occurredAt,
    tradeId: entry.tradeId,
    counterpartyName: entry.counterpartyName,
    makerName: entry.makerName,
    itemName: entry.itemName,
    memo: entry.memo,
    balanceAfterYen: entry.balanceAfterYen,
    breakdown: entry.breakdown,
  } satisfies LedgerEntry;
};

export async function addLedgerEntry(
  userId: string,
  entry: LedgerEntryInput,
  actorUserId?: string
): Promise<LedgerEntry | null> {
  if (typeof window === "undefined") return null;
  if (!userId || !entry || !Number.isFinite(entry.amountYen) || entry.amountYen <= 0) return null;

  const response = await fetchWithDevHeader(
    "/api/ledger",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...entry,
        userId,
        occurredAt: entry.occurredAt,
      }),
    },
    actorUserId ?? userId
  );

  if (!response.ok) {
    console.error("Failed to append ledger", await response.text());
    return null;
  }

  const created = normalizeEntry(await response.json());
  triggerLedgerSync();
  return created;
}

export async function listLedgerEntries(userId: string, actorUserId?: string): Promise<LedgerEntry[]> {
  if (typeof window === "undefined") return [];
  if (!userId) return [];

  const response = await fetchWithDevHeader("/api/ledger", undefined, actorUserId ?? userId);

  if (!response.ok) {
    console.error("Failed to fetch ledger", await response.text());
    return [];
  }

  const json = (await response.json()) as unknown;
  if (!Array.isArray(json)) return [];

  return json.map((entry) => normalizeEntry(entry)).filter(Boolean) as LedgerEntry[];
}
