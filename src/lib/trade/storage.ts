import { TradeNaviDraft } from "@/lib/navi/types";
import { DEV_USERS } from "@/lib/dev-user/users";

import {
  type BuyerContact,
  type CompanyProfile,
  type ShippingInfo,
  type StatementItem,
  type TradeRecord,
  type TradeStatus,
} from "./types";
import { calculateStatementTotals } from "./calcTotals";
import { canApprove, canCancel, canMarkCompleted, canMarkPaid, getActorRole } from "./permissions";
import {
  advanceTradeTodo,
  buildTodosFromStatus,
  cancelTradeTodos,
  deriveStatusFromTodos,
  ensureTradeTodos,
} from "./todo";
import { TodoKind } from "@/lib/todo/todoKinds";

export const TRADE_STORAGE_KEY = "trade_records_v1";
const CONTACT_STORAGE_PREFIX = "buyerContacts:";

const companyDirectory: Record<string, CompanyProfile> = Object.values(DEV_USERS).reduce(
  (acc, user) => {
    acc[user.id] = {
      userId: user.id,
      companyName: user.companyName,
      address: user.address,
      tel: user.tel,
      fax: user.fax,
      contactName: user.contactName,
    } satisfies CompanyProfile;
    return acc;
  },
  {} as Record<string, CompanyProfile>
);

const seedTrades: TradeRecord[] = [
  {
    id: "T-REQ-5001",
    status: "APPROVAL_REQUIRED",
    sellerUserId: "user-b",
    buyerUserId: "user-a",
    sellerName: companyDirectory["user-b"].companyName,
    buyerName: companyDirectory["user-a"].companyName,
    createdAt: "2025-11-20T09:30:00.000Z",
    updatedAt: "2025-11-20T09:30:00.000Z",
    contractDate: "2025-11-21",
    shipmentDate: "2025-11-28",
    receiveMethod: "混載便（指定なし）",
    shippingMethod: "路線便",
    handlerName: "川田",
    paymentMethod: "銀行振込（請求後3営業日以内）",
    paymentTerms: "請求書到着後3営業日以内に指定口座へ振込",
    seller: companyDirectory["user-b"],
    buyer: companyDirectory["user-a"],
    todos: buildTodosFromStatus("APPROVAL_REQUIRED"),
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
      companyName: companyDirectory["user-a"].companyName,
      zip: "100-0005",
      address: "東京都千代田区丸の内1-1-1 パチマートビル 10F",
      tel: "03-1234-5678",
      personName: "田中 太郎",
    },
    buyerContactName: "田中 太郎",
    buyerShippingAddress: {
      companyName: companyDirectory["user-a"].companyName,
      zip: "100-0005",
      address: "東京都千代田区丸の内1-1-1 パチマートビル 10F",
      tel: "03-1234-5678",
      personName: "田中 太郎",
    },
    buyerContacts: [
      { contactId: "contact-a1", name: "田中 責任者" },
      { contactId: "contact-a2", name: "山本 進行" },
    ],
  },
  {
    id: "T-REQ-5002",
    status: "PAYMENT_REQUIRED",
    sellerUserId: "user-a",
    buyerUserId: "user-b",
    sellerName: companyDirectory["user-a"].companyName,
    buyerName: companyDirectory["user-b"].companyName,
    createdAt: "2025-11-18T12:00:00.000Z",
    updatedAt: "2025-11-19T08:00:00.000Z",
    contractDate: "2025-11-19",
    shipmentDate: "2025-11-26",
    receiveMethod: "混載便（午後着）",
    shippingMethod: "専用便",
    handlerName: "佐藤",
    paymentMethod: "銀行振込（即日）",
    paymentTerms: "請求日から5営業日以内に振込",
    seller: companyDirectory["user-a"],
    buyer: companyDirectory["user-b"],
    todos: buildTodosFromStatus("PAYMENT_REQUIRED"),
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
      companyName: companyDirectory["user-b"].companyName,
      zip: "530-0001",
      address: "大阪府大阪市北区梅田1-2-3 トレードタワー 15F",
      tel: "06-9876-5432",
      personName: "佐藤 花子",
    },
    buyerContactName: "佐藤 花子",
    buyerShippingAddress: {
      companyName: companyDirectory["user-b"].companyName,
      zip: "530-0001",
      address: "大阪府大阪市北区梅田1-2-3 トレードタワー 15F",
      tel: "06-9876-5432",
      personName: "佐藤 花子",
    },
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

function normalizeTrade(trade: TradeRecord): TradeRecord {
  const sellerUserId = trade.sellerUserId ?? trade.seller.userId ?? "seller";
  const buyerUserId = trade.buyerUserId ?? trade.buyer.userId ?? "buyer";
  const sellerName = trade.sellerName ?? trade.seller.companyName ?? "売主";
  const buyerName = trade.buyerName ?? trade.buyer.companyName ?? "買主";
  const todos = ensureTradeTodos(trade);
  const status = deriveStatusFromTodos(todos, trade.status);

  return {
    ...trade,
    sellerUserId,
    buyerUserId,
    sellerName,
    buyerName,
    todos,
    status,
  };
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
  const trades = mergeSeedTrades(stored).map(normalizeTrade);

  if (typeof window !== "undefined" && stored.length === 0) {
    writeTradesToStorage(trades);
  }

  return trades;
}

export function loadTrade(tradeId: string): TradeRecord | null {
  const trades = loadAllTrades();
  return trades.find((trade) => trade.id === tradeId) ?? null;
}

export function completeTodoForTrade(
  tradeId: string,
  completedKind: TodoKind,
  actorUserId: string
): TradeRecord | null {
  const trade = loadTrade(tradeId);
  if (!trade) return null;

  const advanced = advanceTradeTodo(trade, completedKind, actorUserId);
  if (!advanced) return null;

  return upsertTradeInternal(advanced);
}

function calculateTradeTotal(trade: TradeRecord): number {
  return calculateStatementTotals(trade.items, trade.taxRate ?? 0.1).total;
}

function upsertTradeInternal(nextTrade: TradeRecord): TradeRecord {
  const trades = mergeSeedTrades(readTradesFromStorage()).map(normalizeTrade);
  const idx = trades.findIndex((trade) => trade.id === nextTrade.id);
  const now = new Date().toISOString();
  const payload = normalizeTrade({ ...nextTrade, updatedAt: now });

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

export function getAllTrades(): TradeRecord[] {
  return loadAllTrades();
}

export function getTradesForUser(userId: string): TradeRecord[] {
  return getAllTrades().filter(
    (trade) => trade.sellerUserId === userId || trade.buyerUserId === userId
  );
}

export function getHistoryTradesForUser(userId: string): TradeRecord[] {
  return getTradesForUser(userId).filter((trade) =>
    ["PAYMENT_REQUIRED", "CONFIRM_REQUIRED", "COMPLETED", "CANCELED"].includes(trade.status)
  );
}

export function getPurchaseHistoryForUser(userId: string): TradeRecord[] {
  return getHistoryTradesForUser(userId).filter((trade) => trade.buyerUserId === userId);
}

export function getSalesHistoryForUser(userId: string): TradeRecord[] {
  return getHistoryTradesForUser(userId).filter((trade) => trade.sellerUserId === userId);
}

export function updateTradeStatus(tradeId: string, status: TradeStatus): TradeRecord | null {
  const trade = loadTrade(tradeId);
  if (!trade) return null;
  return upsertTradeInternal({ ...trade, status, todos: buildTodosFromStatus(status) });
}

export function approveTrade(tradeId: string, actorUserId: string): TradeRecord | null {
  const trade = loadTrade(tradeId);
  if (!trade) return null;
  if (!canApprove(trade, actorUserId)) return null;

  const advanced = advanceTradeTodo(trade, "application_sent", actorUserId);
  if (!advanced) return null;

  return upsertTradeInternal(advanced);
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
    buyerShippingAddress: shipping,
    buyerContactName: shipping.personName ?? trade.buyerContactName,
    buyerContacts: contacts ?? trade.buyerContacts,
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

export function markTradePaid(tradeId: string, actorUserId: string): TradeRecord | null {
  const trade = loadTrade(tradeId);
  if (!trade) return null;
  if (!canMarkPaid(trade, actorUserId)) return null;

  const advanced = advanceTradeTodo(trade, "application_approved", actorUserId);
  if (!advanced) return null;

  return upsertTradeInternal(advanced);
}

export function markTradeCompleted(tradeId: string, actorUserId: string): TradeRecord | null {
  const trade = loadTrade(tradeId);
  if (!trade) return null;
  if (!canMarkCompleted(trade, actorUserId)) return null;

  const advanced = advanceTradeTodo(trade, "payment_confirmed", actorUserId);
  if (!advanced) return null;

  return upsertTradeInternal(advanced);
}

export function cancelTrade(tradeId: string, actorUserId: string): TradeRecord | null {
  const trade = loadTrade(tradeId);
  if (!trade) return null;
  if (!canCancel(trade, actorUserId)) return null;

  const now = new Date().toISOString();
  const canceledBy = getActorRole(trade, actorUserId);
  if (trade.status === "CANCELED" || trade.status === "COMPLETED" || canceledBy === "none") {
    return trade;
  }

  return upsertTradeInternal({
    ...trade,
    status: "CANCELED",
    todos: cancelTradeTodos(trade),
    canceledBy,
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
  const quantity = draft.conditions.quantity ?? 1;
  const totalAmount = calculateTradeTotal({
    id: draft.id,
    status: "APPROVAL_REQUIRED",
    todos: buildTodosFromStatus("APPROVAL_REQUIRED"),
    sellerUserId,
    buyerUserId: buyerProfile.userId ?? draft.buyerId ?? "buyer",
    sellerName: sellerProfile.companyName,
    buyerName: buyerProfile.companyName,
    items,
    taxRate,
    seller: sellerProfile,
    buyer: buyerProfile,
    shipping: { companyName: draft.buyerCompanyName ?? buyerProfile.companyName },
    buyerContacts: draft.buyerContactName
      ? [{ contactId: generateId(), name: draft.buyerContactName }]
      : undefined,
  });

  return {
    id: draft.id,
    status: "APPROVAL_REQUIRED",
    sellerUserId,
    buyerUserId: buyerProfile.userId ?? draft.buyerId ?? "buyer",
    sellerName: sellerProfile.companyName,
    buyerName: buyerProfile.companyName,
    createdAt: draft.createdAt ?? now,
    updatedAt: now,
    contractDate: undefined,
    makerName: draft.conditions.makerName ?? undefined,
    itemName: draft.conditions.productName ?? "取引商品",
    category: draft.conditions.location ? "pachinko" : undefined,
    quantity,
    totalAmount,
    shipmentDate: draft.conditions.machineShipmentDate ?? undefined,
    receiveMethod: draft.conditions.machineShipmentType ?? undefined,
    shippingMethod: draft.conditions.machineShipmentType ?? undefined,
    documentSentDate: draft.conditions.documentShipmentDate ?? undefined,
    documentReceivedDate: draft.conditions.documentShipmentDate ?? undefined,
    handlerName: draft.conditions.handler ?? undefined,
    seller: sellerProfile,
    buyer: buyerProfile,
    items,
    todos: buildTodosFromStatus("APPROVAL_REQUIRED"),
    taxRate,
    remarks: draft.conditions.notes ?? draft.conditions.memo ?? undefined,
    termsText,
    shipping: {
      companyName: draft.buyerCompanyName ?? buyerProfile.companyName,
      address: draft.buyerAddress ?? "",
      tel: draft.buyerTel ?? "",
      personName: draft.buyerContactName ?? "",
    },
    buyerContactName: draft.buyerContactName ?? undefined,
    buyerShippingAddress: {
      companyName: draft.buyerCompanyName ?? buyerProfile.companyName,
      address: draft.buyerAddress ?? "",
      tel: draft.buyerTel ?? "",
      personName: draft.buyerContactName ?? "",
    },
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
