import { ManualNaviItem, NaviDraft } from "@/lib/navi/types";
import { DEV_USERS } from "@/lib/dev-user/users";
import { creditBalance, deductBalanceDirect } from "@/lib/balance/BalanceContext";
import { addLedgerEntry } from "@/lib/balance/ledger";

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
  ensureTradeTodos,
} from "./todo";
import { TodoKind } from "@/lib/todo/todoKinds";
import { deriveTradeStatusFromTodos } from "./deriveStatus";

export const TRADE_STORAGE_KEY = "trade_records_v1";
const CONTACT_STORAGE_PREFIX = "buyerContacts:";
const CREDITED_TRADE_IDS_KEY = "credited_trade_ids";
const TRADE_UPDATED_EVENT = "trade_records_updated";

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

const USER_A_ID = DEV_USERS.A.id;
const USER_B_ID = DEV_USERS.B.id;

const seedTodos5001 = buildTodosFromStatus("APPROVAL_REQUIRED");
const seedTodos5002 = buildTodosFromStatus("PAYMENT_REQUIRED");

const seedTrades: TradeRecord[] = [
  {
    id: "T-REQ-5001",
    status: deriveTradeStatusFromTodos({ todos: seedTodos5001 }),
    sellerUserId: USER_B_ID,
    buyerUserId: USER_A_ID,
    sellerName: companyDirectory[USER_B_ID].companyName,
    buyerName: companyDirectory[USER_A_ID].companyName,
    createdAt: "2025-11-20T09:30:00.000Z",
    updatedAt: "2025-11-20T09:30:00.000Z",
    contractDate: "2025-11-21",
    shipmentDate: "2025-11-28",
    receiveMethod: "混載便（指定なし）",
    shippingMethod: "路線便",
    handlerName: "川田",
    paymentMethod: "銀行振込（請求後3営業日以内）",
    paymentTerms: "請求書到着後3営業日以内に指定口座へ振込",
    seller: companyDirectory[USER_B_ID],
    buyer: companyDirectory[USER_A_ID],
    todos: seedTodos5001,
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
      companyName: companyDirectory[USER_A_ID].companyName,
      zip: "100-0005",
      address: "東京都千代田区丸の内1-1-1 パチマートビル 10F",
      tel: "03-1234-5678",
      personName: "田中 太郎",
    },
    buyerContactName: "田中 太郎",
    buyerShippingAddress: {
      companyName: companyDirectory[USER_A_ID].companyName,
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
    status: deriveTradeStatusFromTodos({ todos: seedTodos5002 }),
    sellerUserId: USER_A_ID,
    buyerUserId: USER_B_ID,
    sellerName: companyDirectory[USER_A_ID].companyName,
    buyerName: companyDirectory[USER_B_ID].companyName,
    createdAt: "2025-11-18T12:00:00.000Z",
    updatedAt: "2025-11-19T08:00:00.000Z",
    contractDate: "2025-11-19",
    shipmentDate: "2025-11-26",
    receiveMethod: "混載便（午後着）",
    shippingMethod: "専用便",
    handlerName: "佐藤",
    paymentMethod: "銀行振込（即日）",
    paymentTerms: "請求日から5営業日以内に振込",
    seller: companyDirectory[USER_A_ID],
    buyer: companyDirectory[USER_B_ID],
    todos: seedTodos5002,
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
      companyName: companyDirectory[USER_B_ID].companyName,
      zip: "530-0001",
      address: "大阪府大阪市北区梅田1-2-3 トレードタワー 15F",
      tel: "06-9876-5432",
      personName: "佐藤 花子",
    },
    buyerContactName: "佐藤 花子",
    buyerShippingAddress: {
      companyName: companyDirectory[USER_B_ID].companyName,
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

function readDealingsFromStorage(): TradeRecord[] {
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

function normalizeDealing(dealing: TradeRecord): TradeRecord {
  const sellerUserId = dealing.sellerUserId ?? dealing.seller.userId ?? "seller";
  const buyerUserId = dealing.buyerUserId ?? dealing.buyer.userId ?? "buyer";
  const sellerName = dealing.sellerName ?? dealing.seller.companyName ?? "売主";
  const buyerName = dealing.buyerName ?? dealing.buyer.companyName ?? "買主";
  const todos = ensureTradeTodos(dealing);
  const status = deriveTradeStatusFromTodos({ todos });

  return {
    ...dealing,
    sellerUserId,
    buyerUserId,
    sellerName,
    buyerName,
    todos,
    status,
  };
}

function writeDealingsToStorage(dealings: TradeRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRADE_STORAGE_KEY, JSON.stringify(dealings));
  window.dispatchEvent(new Event(TRADE_UPDATED_EVENT));
}

function mergeSeedDealings(stored: TradeRecord[]): TradeRecord[] {
  const ids = new Set(stored.map((dealing) => dealing.id));
  const merged = [...stored];
  seedTrades.forEach((seed) => {
    if (!ids.has(seed.id)) merged.push(seed);
  });
  return merged;
}

function getContactStorageKey(scopeId: string) {
  return `${CONTACT_STORAGE_PREFIX}${scopeId}`;
}

function getContactScopeId(dealing?: TradeRecord | null) {
  if (!dealing) return "";
  return dealing.buyer.userId ?? dealing.id;
}

function loadCreditedDealingIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const raw = window.localStorage.getItem(CREDITED_TRADE_IDS_KEY);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id) => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function saveCreditedDealingIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CREDITED_TRADE_IDS_KEY, JSON.stringify([...ids]));
}

export function loadAllTrades(): TradeRecord[] {
  const stored = readDealingsFromStorage();
  const trades = mergeSeedDealings(stored).map(normalizeDealing);

  if (typeof window !== "undefined" && stored.length === 0) {
    writeDealingsToStorage(trades);
  }

  return trades;
}

export function loadTrade(dealingId: string): TradeRecord | null {
  const trades = loadAllTrades();
  return trades.find((dealing) => dealing.id === dealingId) ?? null;
}

export function completeTodoForTrade(
  dealingId: string,
  completedKind: TodoKind,
  actorUserId: string
): TradeRecord | null {
  const dealing = loadTrade(dealingId);
  if (!dealing) return null;

  const advanced = advanceTradeTodo(dealing, completedKind, actorUserId);
  if (!advanced) return null;

  return upsertDealingInternal(advanced);
}

function calculateDealingTotal(dealing: TradeRecord): number {
  return calculateStatementTotals(dealing.items, dealing.taxRate ?? 0.1).total;
}

function upsertDealingInternal(nextDealing: TradeRecord): TradeRecord {
  const trades = mergeSeedDealings(readDealingsFromStorage()).map(normalizeDealing);
  const idx = trades.findIndex((dealing) => dealing.id === nextDealing.id);
  const now = new Date().toISOString();
  const payload = normalizeDealing({ ...nextDealing, updatedAt: now });

  if (idx >= 0) {
    trades[idx] = payload;
  } else {
    trades.push(payload);
  }

  writeDealingsToStorage(trades);
  return payload;
}

export function saveTradeRecord(dealing: TradeRecord): TradeRecord {
  return upsertDealingInternal(dealing);
}

export function getAllTrades(trades?: TradeRecord[]): TradeRecord[] {
  return trades ?? loadAllTrades();
}

export function getTradesForUser(userId: string, trades?: TradeRecord[]): TradeRecord[] {
  return getAllTrades(trades).filter(
    (dealing) => dealing.sellerUserId === userId || dealing.buyerUserId === userId
  );
}

export function getHistoryTradesForUser(userId: string, trades?: TradeRecord[]): TradeRecord[] {
  return getTradesForUser(userId, trades).filter((dealing) =>
    ["APPROVAL_REQUIRED", "PAYMENT_REQUIRED", "CONFIRM_REQUIRED", "COMPLETED", "CANCELED"].includes(
      dealing.status
    )
  );
}

export function getPurchaseHistoryForUser(userId: string, trades?: TradeRecord[]): TradeRecord[] {
  return getHistoryTradesForUser(userId, trades).filter((dealing) => dealing.buyerUserId === userId);
}

export function getSalesHistoryForUser(userId: string, trades?: TradeRecord[]): TradeRecord[] {
  return getHistoryTradesForUser(userId, trades).filter((dealing) => dealing.sellerUserId === userId);
}

export function updateTradeStatus(dealingId: string, status: TradeStatus): TradeRecord | null {
  const dealing = loadTrade(dealingId);
  if (!dealing) return null;
  return upsertDealingInternal({ ...dealing, status, todos: buildTodosFromStatus(status) });
}

export function approveTrade(dealingId: string, actorUserId: string): TradeRecord | null {
  const dealing = loadTrade(dealingId);
  if (!dealing) return null;
  if (!canApprove(dealing, actorUserId)) return null;

  const advanced = advanceTradeTodo(dealing, "application_sent", actorUserId);
  if (!advanced) return null;

  return upsertDealingInternal(advanced);
}

export function updateTradeShipping(
  dealingId: string,
  shipping: ShippingInfo,
  contacts?: BuyerContact[]
): TradeRecord | null {
  const dealing = loadTrade(dealingId);
  if (!dealing) return null;

  const updated = {
    ...dealing,
    shipping,
    buyerShippingAddress: shipping,
    buyerContactName: shipping.personName ?? dealing.buyerContactName,
    buyerContacts: contacts ?? dealing.buyerContacts,
  };
  return upsertDealingInternal(updated);
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

export function addBuyerContact(
  dealingId: string,
  name: string
): { trade: TradeRecord | null; contact: BuyerContact | null } {
  const dealing = loadTrade(dealingId);
  if (!dealing) return { trade: null, contact: null };

  const scopeId = getContactScopeId(dealing) || dealingId;
  const contact: BuyerContact = {
    contactId: generateId(),
    name,
  };
  const nextContacts = [...(loadBuyerContacts(scopeId, dealing.buyerContacts ?? []) ?? []), contact];
  saveBuyerContacts(scopeId, nextContacts);

  const updatedTrade = upsertDealingInternal({
    ...dealing,
    buyerContacts: nextContacts,
  });

  return { trade: updatedTrade, contact };
}

export function saveContactsToTrade(dealingId: string, contacts: BuyerContact[]): TradeRecord | null {
  const dealing = loadTrade(dealingId);
  if (!dealing) return null;

  const scopeId = getContactScopeId(dealing) || dealingId;
  saveBuyerContacts(scopeId, contacts);

  return upsertDealingInternal({
    ...dealing,
    buyerContacts: contacts,
  });
}

export function markTradePaid(
  dealingId: string,
  actorUserId: string,
  fallbackTrade?: TradeRecord | null
): TradeRecord | null {
  const dealing = loadTrade(dealingId) ?? fallbackTrade;
  if (!dealing) return null;
  if (!canMarkPaid(dealing, actorUserId)) return null;

  const advanced = advanceTradeTodo(dealing, "application_approved", actorUserId);
  if (!advanced) return null;

  const buyerId = advanced.buyerUserId ?? advanced.buyer.userId;
  if (!buyerId) return null;

  const amount = calculateDealingTotal(advanced);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const buyerBalanceAfter = deductBalanceDirect(buyerId, amount);
  if (buyerBalanceAfter === null) return null;

  const updated = upsertDealingInternal(advanced);

  const tradeNumericId = Number(dealingId);

  void addLedgerEntry(buyerId, {
    category: "PURCHASE",
    amountYen: amount,
    tradeId: Number.isFinite(tradeNumericId) ? tradeNumericId : undefined,
    counterpartyName: advanced.sellerName ?? advanced.seller.companyName,
    makerName: advanced.items[0]?.maker,
    itemName: advanced.items[0]?.itemName,
    balanceAfterYen: buyerBalanceAfter,
  });

  return updated;
}

export function markTradeCompleted(
  dealingId: string,
  actorUserId: string,
  fallbackTrade?: TradeRecord | null
): TradeRecord | null {
  const dealing = loadTrade(dealingId) ?? fallbackTrade;
  if (!dealing) return null;
  if (!canMarkCompleted(dealing, actorUserId)) return null;

  const advanced = advanceTradeTodo(dealing, "payment_confirmed", actorUserId);
  if (!advanced) return null;

  const updated = upsertDealingInternal(advanced);

  if (typeof window === "undefined") return updated;

  const creditedTradeIds = loadCreditedDealingIds();
  if (creditedTradeIds.has(dealingId)) return updated;

  const amount =
    advanced.paymentAmount ??
    advanced.totalAmount ??
    calculateStatementTotals(advanced.items, advanced.taxRate ?? 0.1).total;

  if (Number.isFinite(amount) && amount > 0) {
    const sellerBalanceAfter = creditBalance(advanced.sellerUserId, amount);
    if (sellerBalanceAfter !== null) {
      creditedTradeIds.add(dealingId);
      saveCreditedDealingIds(creditedTradeIds);

      void addLedgerEntry(advanced.sellerUserId, {
        category: "SALE",
        amountYen: amount,
        tradeId: Number.isFinite(tradeNumericId) ? tradeNumericId : undefined,
        counterpartyName: advanced.buyerName ?? advanced.buyer.companyName,
        makerName: advanced.items[0]?.maker,
        itemName: advanced.items[0]?.itemName,
        balanceAfterYen: sellerBalanceAfter,
      });
    }
  }

  return updated;
}

export function cancelTrade(dealingId: string, actorUserId: string): TradeRecord | null {
  const dealing = loadTrade(dealingId);
  if (!dealing) return null;
  if (!canCancel(dealing, actorUserId)) return null;

  const now = new Date().toISOString();
  const canceledBy = getActorRole(dealing, actorUserId);
  const currentStatus = deriveTradeStatusFromTodos(dealing);
  if (currentStatus === "CANCELED" || currentStatus === "COMPLETED" || canceledBy === "none") {
    return dealing;
  }
  const canceledTodos = cancelTradeTodos(dealing);
  const derivedStatus = deriveTradeStatusFromTodos({ todos: canceledTodos });

  return upsertDealingInternal({
    ...dealing,
    status: derivedStatus,
    todos: canceledTodos,
    canceledBy,
    canceledAt: now,
    updatedAt: now,
  });
}

export function buildItemsFromDraft(draft: NaviDraft): StatementItem[] {
  const items: StatementItem[] = [];
  const manualItems = draft.items ?? [];

  const pushManualItem = (item: ManualNaviItem, index: number) => {
    const unitPrice = item.unitPrice ?? draft.conditions.unitPrice ?? 0;
    items.push({
      lineId: item.id ?? `${draft.id}-item-${index}`,
      maker: item.maker,
      itemName: item.modelName,
      category: item.bodyType,
      qty: item.quantity,
      unitPrice,
      isTaxable: true,
      note: item.note ?? undefined,
    });
  };

  if (manualItems.length > 0) {
    manualItems.forEach((item, index) => pushManualItem(item, index));
  } else {
    const qty = draft.conditions.quantity ?? 1;
    const unitPrice = draft.conditions.unitPrice ?? 0;

    pushManualItem(
      {
        id: `${draft.id}-item`,
        maker: draft.conditions.makerName ?? "",
        modelName: draft.conditions.productName ?? "取引商品",
        bodyType: "本体",
        quantity: qty,
        unitPrice,
        receiveMethod: "発送",
        gameType: "pachinko",
      },
      0
    );
  }

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
  draft: NaviDraft,
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
  const primaryItem = draft.items?.[0];
  const quantity = primaryItem?.quantity ?? draft.conditions.quantity ?? 1;
  const initialTodos = buildTodosFromStatus("APPROVAL_REQUIRED");
  const initialStatus = deriveTradeStatusFromTodos({ todos: initialTodos });
  const totalAmount = calculateDealingTotal({
    id: draft.id,
    status: initialStatus,
    todos: initialTodos,
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
    status: initialStatus,
    sellerUserId,
    buyerUserId: buyerProfile.userId ?? draft.buyerId ?? "buyer",
    sellerName: sellerProfile.companyName,
    buyerName: buyerProfile.companyName,
    createdAt: draft.createdAt ?? now,
    updatedAt: now,
    contractDate: undefined,
    makerName: primaryItem?.maker ?? draft.conditions.makerName ?? undefined,
    itemName: primaryItem?.modelName ?? draft.conditions.productName ?? "取引商品",
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
    todos: initialTodos,
    taxRate,
    remarks: draft.conditions.notes ?? draft.conditions.memo ?? undefined,
    termsText,
    storageLocationName: draft.conditions.location ?? undefined,
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

export function ensureContactsLoaded(dealing: TradeRecord | null): BuyerContact[] {
  if (!dealing) return [];
  const scopeId = getContactScopeId(dealing) || dealing.id;
  return loadBuyerContacts(scopeId, dealing.buyerContacts ?? []);
}
