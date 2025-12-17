import { TradeNaviDraft } from "@/lib/navi/types";

import {
  type BuyerContact,
  type CompanyProfile,
  type ShippingInfo,
  type StatementItem,
  type TradeRecord,
  type TradeStatus,
} from "./types";
import { calculateStatementTotals } from "./calcTotals";

export const TRADE_STORAGE_KEY = "trade_records_v1";
const CONTACT_STORAGE_PREFIX = "buyerContacts:";

const companyDirectory: Record<string, CompanyProfile> = {
  "user-a": {
    userId: "user-a",
    companyName: "株式会社パチテック",
    address: "東京都千代田区丸の内1-1-1 パチマートビル 10F",
    tel: "03-1234-5678",
    fax: "03-1234-5679",
    contactName: "田中 太郎",
  },
  "user-b": {
    userId: "user-b",
    companyName: "株式会社トレード連合",
    address: "大阪府大阪市北区梅田1-2-3 トレードタワー 15F",
    tel: "06-9876-5432",
    fax: "06-9876-5433",
    contactName: "佐藤 花子",
  },
};

const seedTrades: TradeRecord[] = [
  {
    id: "T-REQ-5001",
    status: "APPROVAL_REQUIRED",
    createdAt: "2025-11-20T09:30:00.000Z",
    updatedAt: "2025-11-20T09:30:00.000Z",
    contractDate: "2025-11-21",
    shipmentDate: "2025-11-28",
    preRemovalDate: "2025-11-26",
    paymentTerms: "請求書到着後5営業日以内に指定口座へ振込",
    seller: companyDirectory["user-b"],
    buyer: companyDirectory["user-a"],
    items: [
      {
        lineId: "line-1",
        maker: "SANKYO",
        itemName: "P フィーバー機動戦士ガンダムSEED",
        category: "本体",
        qty: 2,
        unitPrice: 180000,
        isTaxable: true,
      },
      {
        lineId: "line-2",
        itemName: "送料",
        category: "送料",
        qty: 1,
        unitPrice: 20000,
        isTaxable: true,
      },
      {
        lineId: "line-3",
        itemName: "出庫手数料",
        category: "手数料",
        qty: 1,
        unitPrice: 10000,
        isTaxable: true,
      },
      {
        lineId: "line-4",
        itemName: "値引き",
        category: "値引き",
        qty: 1,
        unitPrice: -5000,
        isTaxable: true,
      },
    ],
    taxRate: 0.1,
    remarks: "搬出時に立ち会いが必要です。",
    termsText: "納品後7日以内の初期不良のみ対応いたします。キャンセルは原則不可です。",
    shipping: {
      companyName: "株式会社パチテック",
      zip: "100-0005",
      address: "東京都千代田区丸の内1-1-1 パチマートビル 3F 物流センター行",
      tel: "03-1000-2000",
      personName: "田中 責任者",
    },
    buyerContactName: "田中 責任者",
    buyerContacts: [
      { contactId: "contact-a1", name: "田中 責任者" },
      { contactId: "contact-a2", name: "山本 進行" },
    ],
  },
  {
    id: "T-REQ-5002",
    status: "PAYMENT_REQUIRED",
    createdAt: "2025-11-18T12:00:00.000Z",
    updatedAt: "2025-11-19T08:00:00.000Z",
    contractDate: "2025-11-19",
    shipmentDate: "2025-11-30",
    preRemovalDate: "2025-11-29",
    paymentTerms: "納品後3営業日以内に着金",
    seller: companyDirectory["user-a"],
    buyer: companyDirectory["user-b"],
    items: [
      {
        lineId: "line-1",
        maker: "ニューギン",
        itemName: "P 真・花の慶次3 黄金一閃",
        category: "本体",
        qty: 4,
        unitPrice: 170000,
        isTaxable: true,
      },
      {
        lineId: "line-2",
        itemName: "送料",
        category: "送料",
        qty: 1,
        unitPrice: 15000,
        isTaxable: true,
      },
    ],
    taxRate: 0.1,
    remarks: "梱包材は売主にて手配します。",
    termsText: "支払期日は請求日から5営業日以内。キャンセルは協議の上で判断します。",
    shipping: {
      companyName: "株式会社トレード連合",
      zip: "530-0001",
      address: "大阪府大阪市北区梅田1-2-3 西倉庫B棟 2F",
      tel: "06-1111-2222",
      personName: "佐藤 花子",
    },
    buyerContactName: "佐藤 花子",
    buyerContacts: [{ contactId: "contact-b1", name: "佐藤 花子" }],
  },
];

const defaultTermsText =
  "本見積の有効期限は発行日から7日間です。納品後7日以内の初期不良のみ対応し、その他は協議の上決定します。";

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `contact-${Date.now()}`;

function readTradesFromStorage(): TradeRecord[] {
  if (typeof window === "undefined") {
    return seedTrades;
  }

  const raw = window.localStorage.getItem(TRADE_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as TradeRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeTradesToStorage(trades: TradeRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRADE_STORAGE_KEY, JSON.stringify(trades));
}

function mergeSeedTrades(stored: TradeRecord[]): TradeRecord[] {
  const ids = new Set(stored.map((trade) => trade.id));
  const merged = [...stored];
  seedTrades.forEach((seed) => {
    if (!ids.has(seed.id)) merged.push(seed);
  });
  return merged;
}

function getContactStorageKey(scopeId: string) {
  return `${CONTACT_STORAGE_PREFIX}${scopeId}`;
}

function getContactScopeId(trade?: TradeRecord | null) {
  if (!trade) return "";
  return trade.buyer.userId ?? trade.id;
}

export function loadAllTrades(): TradeRecord[] {
  const stored = readTradesFromStorage();
  const trades = mergeSeedTrades(stored);

  if (typeof window !== "undefined" && stored.length === 0) {
    writeTradesToStorage(trades);
  }

  return trades;
}

export function loadTrade(tradeId: string): TradeRecord | null {
  const trades = loadAllTrades();
  return trades.find((trade) => trade.id === tradeId) ?? null;
}

function calculateTradeTotal(trade: TradeRecord): number {
  return calculateStatementTotals(trade.items, trade.taxRate ?? 0.1).total;
}

function upsertTradeInternal(nextTrade: TradeRecord): TradeRecord {
  const trades = mergeSeedTrades(readTradesFromStorage());
  const idx = trades.findIndex((trade) => trade.id === nextTrade.id);
  const now = new Date().toISOString();
  const payload = { ...nextTrade, updatedAt: now };

  if (idx >= 0) {
    trades[idx] = payload;
  } else {
    trades.push(payload);
  }

  writeTradesToStorage(trades);
  return payload;
}

export function saveTradeRecord(trade: TradeRecord): TradeRecord {
  return upsertTradeInternal(trade);
}

export function updateTradeStatus(tradeId: string, status: TradeStatus): TradeRecord | null {
  const trade = loadTrade(tradeId);
  if (!trade) return null;
  return upsertTradeInternal({ ...trade, status });
}

export function approveTrade(
  tradeId: string,
  options?: { shipping?: ShippingInfo; contacts?: BuyerContact[]; buyerContactName?: string }
): TradeRecord | null {
  const trade = loadTrade(tradeId);
  if (!trade) return null;

  const now = new Date().toISOString();
  const nextShipping = options?.shipping ?? trade.shipping;
  const nextContacts = options?.contacts ?? trade.buyerContacts;

  return upsertTradeInternal({
    ...trade,
    status: "PAYMENT_REQUIRED",
    contractDate: now,
    updatedAt: now,
    shipping: nextShipping,
    buyerContacts: nextContacts,
    buyerContactName: options?.buyerContactName ?? trade.buyerContactName ?? nextShipping.personName,
  });
}

export function updateTradeShipping(
  tradeId: string,
  shipping: ShippingInfo,
  contacts?: BuyerContact[]
): TradeRecord | null {
  const trade = loadTrade(tradeId);
  if (!trade) return null;

  const updated = {
    ...trade,
    shipping,
    buyerContacts: contacts ?? trade.buyerContacts,
    buyerContactName: shipping.personName ?? trade.buyerContactName,
  };
  return upsertTradeInternal(updated);
}

export function loadBuyerContacts(scopeId: string, fallback: BuyerContact[] = []): BuyerContact[] {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(getContactStorageKey(scopeId));
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as BuyerContact[];
    if (!Array.isArray(parsed)) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

export function saveBuyerContacts(scopeId: string, contacts: BuyerContact[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getContactStorageKey(scopeId), JSON.stringify(contacts));
}

export function addBuyerContact(tradeId: string, name: string): { trade: TradeRecord | null; contact: BuyerContact | null } {
  const trade = loadTrade(tradeId);
  if (!trade) return { trade: null, contact: null };

  const scopeId = getContactScopeId(trade) || tradeId;
  const contact: BuyerContact = {
    contactId: generateId(),
    name,
  };
  const nextContacts = [...(loadBuyerContacts(scopeId, trade.buyerContacts ?? []) ?? []), contact];
  saveBuyerContacts(scopeId, nextContacts);

  const updatedTrade = upsertTradeInternal({
    ...trade,
    buyerContacts: nextContacts,
  });

  return { trade: updatedTrade, contact };
}

export function saveContactsToTrade(tradeId: string, contacts: BuyerContact[]): TradeRecord | null {
  const trade = loadTrade(tradeId);
  if (!trade) return null;

  const scopeId = getContactScopeId(trade) || tradeId;
  saveBuyerContacts(scopeId, contacts);

  return upsertTradeInternal({
    ...trade,
    buyerContacts: contacts,
  });
}

export function markTradePaid(tradeId: string): TradeRecord | null {
  const trade = loadTrade(tradeId);
  if (!trade) return null;

  const now = new Date().toISOString();
  const totalAmount = calculateTradeTotal(trade);
  return upsertTradeInternal({
    ...trade,
    status: "CONFIRM_REQUIRED",
    paymentDate: now,
    paymentAmount: totalAmount,
    paymentMethod: "振込（テスト）",
    updatedAt: now,
  });
}

export function markTradeCompleted(tradeId: string): TradeRecord | null {
  const trade = loadTrade(tradeId);
  if (!trade) return null;

  const now = new Date().toISOString();
  return upsertTradeInternal({
    ...trade,
    status: "COMPLETED",
    completedAt: now,
    updatedAt: now,
  });
}

export function cancelTrade(tradeId: string, by: "buyer" | "seller"): TradeRecord | null {
  const trade = loadTrade(tradeId);
  if (!trade) return null;

  const now = new Date().toISOString();
  return upsertTradeInternal({
    ...trade,
    status: "CANCELED",
    canceledBy: by,
    canceledAt: now,
    updatedAt: now,
  });
}

export function buildItemsFromDraft(draft: TradeNaviDraft): StatementItem[] {
  const items: StatementItem[] = [];
  const qty = draft.conditions.quantity ?? 1;
  const unitPrice = draft.conditions.unitPrice ?? 0;

  items.push({
    lineId: `${draft.id}-item`,
    maker: draft.conditions.makerName ?? undefined,
    itemName: draft.conditions.productName ?? "取引商品",
    category: "本体",
    qty,
    unitPrice,
    isTaxable: true,
    note: draft.conditions.memo ?? undefined,
  });

  const pushFee = (amount: number | null | undefined, category: string, label: string) => {
    if (amount == null) return;
    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric === 0) return;
    items.push({
      lineId: `${draft.id}-${category}`,
      itemName: label,
      category,
      qty: 1,
      unitPrice: numeric,
      isTaxable: true,
    });
  };

  pushFee(draft.conditions.shippingFee, "送料", "送料");
  pushFee(draft.conditions.handlingFee, "手数料", "出庫手数料");
  pushFee(draft.conditions.cardboardFee?.amount, "資材", draft.conditions.cardboardFee?.label ?? "段ボール");
  pushFee(draft.conditions.nailSheetFee?.amount, "資材", draft.conditions.nailSheetFee?.label ?? "釘シート");
  pushFee(draft.conditions.insuranceFee?.amount, "保険", draft.conditions.insuranceFee?.label ?? "保険");

  return items;
}

export function createTradeFromDraft(
  draft: TradeNaviDraft,
  sellerUserId: string,
  defaults?: { termsText?: string }
): TradeRecord {
  const sellerProfile = companyDirectory[sellerUserId] ?? {
    userId: sellerUserId,
    companyName: "売主（仮）",
  };
  const buyerProfile: CompanyProfile = {
    userId: draft.buyerId ?? undefined,
    companyName: draft.buyerCompanyName ?? "買主（未設定）",
    address: draft.buyerAddress ?? undefined,
    tel: draft.buyerTel ?? undefined,
    contactName: draft.buyerContactName ?? undefined,
  };

  const now = new Date().toISOString();
  const items = buildItemsFromDraft(draft);
  const taxRate = draft.conditions.taxRate ?? 0.1;
  const termsText = draft.conditions.terms ?? defaults?.termsText ?? defaultTermsText;
  const shipmentDate =
    draft.conditions.machineShipmentDate ?? draft.conditions.documentShipmentDate ?? undefined;
  const removalDate = draft.conditions.removalDate ?? undefined;
  const paymentTerms = draft.conditions.paymentDue ?? undefined;

  return {
    id: draft.id,
    status: "APPROVAL_REQUIRED",
    createdAt: draft.createdAt ?? now,
    updatedAt: now,
    contractDate: now.slice(0, 10),
    shipmentDate: shipmentDate ?? undefined,
    removalDate,
    paymentTerms,
    seller: sellerProfile,
    buyer: buyerProfile,
    items,
    taxRate,
    remarks: draft.conditions.notes ?? draft.conditions.memo ?? undefined,
    termsText,
    shipping: {
      companyName: draft.buyerCompanyName ?? buyerProfile.companyName,
      zip: undefined,
      address: draft.buyerAddress ?? "",
      tel: draft.buyerTel ?? "",
      personName: draft.buyerContactName ?? "",
    },
    buyerContactName: draft.buyerContactName ?? undefined,
    buyerContacts: draft.buyerContactName
      ? [{ contactId: generateId(), name: draft.buyerContactName }]
      : undefined,
  };
}

export function ensureContactsLoaded(trade: TradeRecord | null): BuyerContact[] {
  if (!trade) return [];
  const scopeId = getContactScopeId(trade) || trade.id;
  return loadBuyerContacts(scopeId, trade.buyerContacts ?? []);
}
