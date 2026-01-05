import { DealingStatus, LedgerEntryCategory, LedgerEntryKind, Prisma } from "@prisma/client";

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

export async function addLedgerEntry(entry: LedgerEntryInput) {
  if (!entry.userId || !Number.isFinite(entry.amountYen) || entry.amountYen <= 0) return null;

  return prisma.ledgerEntry.create({
    data: {
      userId: entry.userId,
      tradeId: entry.tradeId ?? null,
      category: entry.category,
      kind: entry.kind ?? LedgerEntryKind.PLANNED,
      amountYen: Math.trunc(entry.amountYen),
      occurredAt: entry.occurredAt ?? new Date(),
      counterpartyName: entry.counterpartyName ?? null,
      makerName: entry.makerName ?? null,
      itemName: entry.itemName ?? null,
      memo: entry.memo ?? null,
      balanceAfterYen: entry.balanceAfterYen ?? null,
      breakdown: entry.breakdown ?? null,
    },
  });
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

export async function ensurePlannedLedgerEntries(trade: TradeRecord) {
  const snapshot = buildLedgerSnapshot(trade);
  const plannedKind = LedgerEntryKind.PLANNED;

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
  }
) {
  const tradeDto = toTradeDto({ ...rawTrade, status: nextStatus });
  const trade = transformTrade(tradeDto);
  const snapshot = buildLedgerSnapshot(trade);

  if ([DealingStatus.APPROVAL_REQUIRED, DealingStatus.PAYMENT_REQUIRED].includes(nextStatus)) {
    await ensurePlannedLedgerEntries(trade);
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
      });
    }
  }
}
