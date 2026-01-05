import {
  DealingStatus,
  LedgerEntryCategory,
  LedgerEntryKind,
  LedgerEntrySource,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/server/prisma";
import { calculateStatementTotals } from "@/lib/dealings/calcTotals";
import { transformTrade, type TradeDto } from "@/lib/dealings/transform";
import { type TradeRecord } from "@/lib/dealings/types";

export type LedgerEntryInput = {
  userId: string;
  category: LedgerEntryCategory;
  kind?: LedgerEntryKind;
  amountYen: number;
  tradeId?: number | null;
  occurredAt?: Date;
  counterpartyName?: string | null;
  makerName?: string | null;
  itemName?: string | null;
  memo?: string | null;
  balanceAfterYen?: number | null;
  breakdown?: Prisma.JsonValue | null;
  createdByUserId?: string;
  source?: LedgerEntrySource;
  tradeStatusAtCreation?: DealingStatus | null;
  dedupeKey?: string;
};

export type LedgerConsistencyWarning = {
  code: string;
  message: string;
};

const toTradeDto = (record: {
  id: number;
  sellerUserId: string;
  buyerUserId: string;
  status: DealingStatus;
  paymentAt: Date | null;
  completedAt: Date | null;
  canceledAt: Date | null;
  payload: Prisma.JsonValue | null;
  naviId: number | null;
  createdAt: Date;
  updatedAt: Date;
  navi: {
    id: number;
    ownerUserId: string;
    buyerUserId: string | null;
    payload: Prisma.JsonValue | null;
    listingSnapshot: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  sellerUser: { id: string; companyName: string } | null;
  buyerUser: { id: string; companyName: string } | null;
}): TradeDto => ({
  id: record.id,
  sellerUserId: record.sellerUserId,
  buyerUserId: record.buyerUserId,
  status: record.status,
  paymentAt: record.paymentAt?.toISOString() ?? null,
  completedAt: record.completedAt?.toISOString() ?? null,
  canceledAt: record.canceledAt?.toISOString() ?? null,
  payload: record.payload,
  naviId: record.naviId,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
  navi: record.navi
    ? {
        id: record.navi.id,
        ownerUserId: record.navi.ownerUserId,
        buyerUserId: record.navi.buyerUserId,
        payload: record.navi.payload,
        listingSnapshot: record.navi.listingSnapshot,
        naviType: null,
        createdAt: record.navi.createdAt.toISOString(),
        updatedAt: record.navi.updatedAt.toISOString(),
      }
    : null,
  sellerUser: record.sellerUser,
  buyerUser: record.buyerUser,
});

const buildLedgerSnapshot = (trade: TradeRecord) => {
  const totals = calculateStatementTotals(trade.items, trade.taxRate ?? 0.1);
  const amountYen = trade.totalAmount ?? totals.total;
  const primaryItem = trade.items[0];
  const numericTradeId = Number(trade.id);
  return {
    amountYen,
    makerName: primaryItem?.maker,
    itemName: primaryItem?.itemName,
    tradeId: Number.isFinite(numericTradeId) ? numericTradeId : null,
    buyerCounterparty: trade.sellerName ?? trade.seller?.companyName ?? null,
    sellerCounterparty: trade.buyerName ?? trade.buyer?.companyName ?? null,
  };
};

const statusRank: Record<DealingStatus, number> = {
  [DealingStatus.APPROVAL_REQUIRED]: 1,
  [DealingStatus.PAYMENT_REQUIRED]: 2,
  [DealingStatus.CONFIRM_REQUIRED]: 3,
  [DealingStatus.COMPLETED]: 4,
  [DealingStatus.CANCELED]: 0,
};

const createDedupeKey = (entry: LedgerEntryInput, resolvedKind: LedgerEntryKind, occurredAt: Date) => {
  if (entry.dedupeKey) return entry.dedupeKey;
  if (entry.tradeId) {
    const sourceKey = entry.source ?? LedgerEntrySource.TRADE_STATUS_TRANSITION;
    return `${entry.tradeId}:${entry.category}:${resolvedKind}:${sourceKey}`;
  }

  return `manual:${entry.userId}:${entry.category}:${resolvedKind}:${occurredAt.toISOString()}`;
};

export async function addLedgerEntry(entry: LedgerEntryInput) {
  if (!entry.userId || !Number.isFinite(entry.amountYen) || entry.amountYen <= 0) return null;

  const occurredAt = entry.occurredAt ?? new Date();
  const resolvedKind = entry.kind ?? LedgerEntryKind.PLANNED;
  const source = entry.source ?? LedgerEntrySource.TRADE_STATUS_TRANSITION;
  const tradeStatusAtCreation = entry.tradeStatusAtCreation ?? null;

  const data: Prisma.LedgerEntryCreateInput = {
    userId: entry.userId,
    tradeId: entry.tradeId ?? null,
    category: entry.category,
    kind: resolvedKind,
    amountYen: Math.trunc(entry.amountYen),
    occurredAt,
    counterpartyName: entry.counterpartyName ?? null,
    makerName: entry.makerName ?? null,
    itemName: entry.itemName ?? null,
    memo: entry.memo ?? null,
    balanceAfterYen: entry.balanceAfterYen ?? null,
    createdByUserId: entry.createdByUserId ?? entry.userId,
    source,
    tradeStatusAtCreation,
    dedupeKey: createDedupeKey(entry, resolvedKind, occurredAt),
  };

  if (entry.breakdown !== undefined) {
    data.breakdown = entry.breakdown as Prisma.InputJsonValue;
  }

  try {
    return await prisma.ledgerEntry.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return prisma.ledgerEntry.findFirst({ where: { dedupeKey: data.dedupeKey } });
    }
    throw error;
  }
}

async function ledgerEntryExists(params: {
  userId: string;
  tradeId: number | null;
  category: LedgerEntryCategory;
  kind: LedgerEntryKind;
}) {
  return prisma.ledgerEntry.findFirst({
    where: {
      userId: params.userId,
      tradeId: params.tradeId,
      category: params.category,
      kind: params.kind,
    },
  });
}

export async function ensurePlannedLedgerEntries(trade: TradeRecord, actorUserId?: string) {
  const snapshot = buildLedgerSnapshot(trade);
  const plannedKind = LedgerEntryKind.PLANNED;
  const creator = actorUserId ?? trade.buyerUserId ?? trade.sellerUserId;

  if (!trade.buyerUserId || !trade.sellerUserId) return;

  const buyerExists = await ledgerEntryExists({
    userId: trade.buyerUserId,
    tradeId: snapshot.tradeId,
    category: LedgerEntryCategory.PURCHASE,
    kind: plannedKind,
  });

  if (!buyerExists) {
    await addLedgerEntry({
      userId: trade.buyerUserId,
      category: LedgerEntryCategory.PURCHASE,
      kind: plannedKind,
      amountYen: snapshot.amountYen,
      tradeId: snapshot.tradeId,
      counterpartyName: snapshot.buyerCounterparty,
      makerName: snapshot.makerName,
      itemName: snapshot.itemName,
      createdByUserId: creator,
      source: LedgerEntrySource.TRADE_STATUS_TRANSITION,
      tradeStatusAtCreation: trade.status,
    });
  }

  const sellerExists = await ledgerEntryExists({
    userId: trade.sellerUserId,
    tradeId: snapshot.tradeId,
    category: LedgerEntryCategory.SALE,
    kind: plannedKind,
  });

  if (!sellerExists) {
    await addLedgerEntry({
      userId: trade.sellerUserId,
      category: LedgerEntryCategory.SALE,
      kind: plannedKind,
      amountYen: snapshot.amountYen,
      tradeId: snapshot.tradeId,
      counterpartyName: snapshot.sellerCounterparty,
      makerName: snapshot.makerName,
      itemName: snapshot.itemName,
      createdByUserId: creator,
      source: LedgerEntrySource.TRADE_STATUS_TRANSITION,
      tradeStatusAtCreation: trade.status,
    });
  }
}

export async function recordLedgerForStatus(
  currentStatus: DealingStatus,
  nextStatus: DealingStatus,
  rawTrade: {
    id: number;
    sellerUserId: string;
    buyerUserId: string;
    status: DealingStatus;
    paymentAt: Date | null;
    completedAt: Date | null;
    canceledAt: Date | null;
    payload: Prisma.JsonValue | null;
    naviId: number | null;
    createdAt: Date;
    updatedAt: Date;
    navi: {
      id: number;
      ownerUserId: string;
      buyerUserId: string | null;
      payload: Prisma.JsonValue | null;
      listingSnapshot: Prisma.JsonValue | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    sellerUser: { id: string; companyName: string } | null;
    buyerUser: { id: string; companyName: string } | null;
  },
  actorUserId?: string,
) {
  const tradeDto = toTradeDto({ ...rawTrade, status: nextStatus });
  const trade = transformTrade(tradeDto);
  const snapshot = buildLedgerSnapshot(trade);

  if (nextStatus === DealingStatus.APPROVAL_REQUIRED || nextStatus === DealingStatus.PAYMENT_REQUIRED) {
    await ensurePlannedLedgerEntries(trade, actorUserId);
  }

  if (
    nextStatus === DealingStatus.CONFIRM_REQUIRED &&
    currentStatus !== DealingStatus.CONFIRM_REQUIRED &&
    trade.buyerUserId
  ) {
    const exists = await ledgerEntryExists({
      userId: trade.buyerUserId,
      tradeId: snapshot.tradeId,
      category: LedgerEntryCategory.PURCHASE,
      kind: LedgerEntryKind.ACTUAL,
    });

    if (!exists) {
      await addLedgerEntry({
        userId: trade.buyerUserId,
        category: LedgerEntryCategory.PURCHASE,
        kind: LedgerEntryKind.ACTUAL,
        amountYen: snapshot.amountYen,
        tradeId: snapshot.tradeId,
        counterpartyName: snapshot.buyerCounterparty,
        makerName: snapshot.makerName,
        itemName: snapshot.itemName,
        occurredAt: new Date(),
        createdByUserId: actorUserId ?? trade.buyerUserId,
        source: LedgerEntrySource.TRADE_STATUS_TRANSITION,
        tradeStatusAtCreation: nextStatus,
      });
    }
  }

  if (nextStatus === DealingStatus.COMPLETED && currentStatus !== DealingStatus.COMPLETED && trade.sellerUserId) {
    const exists = await ledgerEntryExists({
      userId: trade.sellerUserId,
      tradeId: snapshot.tradeId,
      category: LedgerEntryCategory.SALE,
      kind: LedgerEntryKind.ACTUAL,
    });

    if (!exists) {
      await addLedgerEntry({
        userId: trade.sellerUserId,
        category: LedgerEntryCategory.SALE,
        kind: LedgerEntryKind.ACTUAL,
        amountYen: snapshot.amountYen,
        tradeId: snapshot.tradeId,
        counterpartyName: snapshot.sellerCounterparty,
        makerName: snapshot.makerName,
        itemName: snapshot.itemName,
        occurredAt: new Date(),
        createdByUserId: actorUserId ?? trade.sellerUserId,
        source: LedgerEntrySource.TRADE_STATUS_TRANSITION,
        tradeStatusAtCreation: nextStatus,
      });
    }
  }
}

const statusAtLeast = (status: DealingStatus, target: DealingStatus) =>
  (statusRank[status] ?? 0) >= (statusRank[target] ?? 0);

export async function validateTradeLedgerConsistency(tradeId: number): Promise<LedgerConsistencyWarning[]> {
  const trade = await prisma.dealing.findUnique({
    where: { id: tradeId } as any,
    select: { id: true, status: true, buyerUserId: true, sellerUserId: true } as any,
  });

  if (!trade) {
    return [{ code: "TRADE_NOT_FOUND", message: `Trade ${tradeId} not found for ledger validation` }];
  }

  const entries = await prisma.ledgerEntry.findMany({
    where: { tradeId },
    orderBy: { occurredAt: "asc" },
  });

  const warnings: LedgerConsistencyWarning[] = [];

  const plannedPurchase = entries.filter(
    (entry) => entry.category === LedgerEntryCategory.PURCHASE && entry.kind === LedgerEntryKind.PLANNED
  );
  const plannedSale = entries.filter(
    (entry) => entry.category === LedgerEntryCategory.SALE && entry.kind === LedgerEntryKind.PLANNED
  );
  const actualPurchase = entries.filter(
    (entry) => entry.category === LedgerEntryCategory.PURCHASE && entry.kind === LedgerEntryKind.ACTUAL
  );
  const actualSale = entries.filter(
    (entry) => entry.category === LedgerEntryCategory.SALE && entry.kind === LedgerEntryKind.ACTUAL
  );

  const requiresPlan = statusAtLeast(trade.status, DealingStatus.APPROVAL_REQUIRED);
  const requiresPurchaseActual = statusAtLeast(trade.status, DealingStatus.CONFIRM_REQUIRED);
  const requiresSaleActual = statusAtLeast(trade.status, DealingStatus.COMPLETED);

  if (requiresPlan && plannedPurchase.length === 0) {
    warnings.push({
      code: "PLANNED_PURCHASE_MISSING",
      message: `Trade ${trade.id} is ${trade.status} but has no planned purchase ledger entry`,
    });
  }

  if (requiresPlan && plannedSale.length === 0) {
    warnings.push({
      code: "PLANNED_SALE_MISSING",
      message: `Trade ${trade.id} is ${trade.status} but has no planned sale ledger entry`,
    });
  }

  if (plannedPurchase.length > 1) {
    warnings.push({
      code: "PLANNED_PURCHASE_DUPLICATE",
      message: `Trade ${trade.id} has ${plannedPurchase.length} planned purchase ledger entries`,
    });
  }

  if (plannedSale.length > 1) {
    warnings.push({
      code: "PLANNED_SALE_DUPLICATE",
      message: `Trade ${trade.id} has ${plannedSale.length} planned sale ledger entries`,
    });
  }

  if (requiresPurchaseActual && actualPurchase.length === 0) {
    warnings.push({
      code: "ACTUAL_PURCHASE_MISSING",
      message: `Trade ${trade.id} is ${trade.status} but has no actual purchase ledger entry`,
    });
  }

  if (requiresSaleActual && actualSale.length === 0) {
    warnings.push({
      code: "ACTUAL_SALE_MISSING",
      message: `Trade ${trade.id} is ${trade.status} but has no actual sale ledger entry`,
    });
  }

  if (actualPurchase.length > 1) {
    warnings.push({
      code: "ACTUAL_PURCHASE_DUPLICATE",
      message: `Trade ${trade.id} has ${actualPurchase.length} actual purchase ledger entries`,
    });
  }

  if (actualSale.length > 1) {
    warnings.push({
      code: "ACTUAL_SALE_DUPLICATE",
      message: `Trade ${trade.id} has ${actualSale.length} actual sale ledger entries`,
    });
  }

  if (warnings.length) {
    console.warn("Ledger consistency warnings", { tradeId, warnings });
  }

  return warnings;
}
