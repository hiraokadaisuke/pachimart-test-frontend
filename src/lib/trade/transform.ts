import { TradeNaviType } from "@prisma/client";

import { buildTodosFromStatus } from "@/lib/trade/todo";
import {
  type BuyerContact,
  type ShippingInfo,
  type StatementItem,
  type TradeRecord,
} from "@/lib/trade/types";
import { resolveListingSnapshot, type ListingSnapshot } from "./listingSnapshot";

export type TradeDto = {
  id: number;
  sellerUserId: string;
  buyerUserId: string;
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELED";
  payload: unknown;
  naviId: number | null;
  createdAt: string;
  updatedAt: string;
  navi: {
    id: number;
    ownerUserId: string;
    buyerUserId: string | null;
    payload: unknown;
    listingSnapshot: unknown;
    naviType: TradeNaviType | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  sellerUser: { id: string; companyName: string } | null;
  buyerUser: { id: string; companyName: string } | null;
};

type TradeConditions = {
  unitPrice?: unknown;
  quantity?: unknown;
  shippingFee?: unknown;
  handlingFee?: unknown;
  taxRate?: unknown;
  removalDate?: unknown;
  machineShipmentDate?: unknown;
  machineShipmentType?: unknown;
  documentShipmentDate?: unknown;
  documentShipmentType?: unknown;
  paymentDue?: unknown;
  cardboardFee?: { label?: unknown; amount?: unknown } | null;
  nailSheetFee?: { label?: unknown; amount?: unknown } | null;
  insuranceFee?: { label?: unknown; amount?: unknown } | null;
  notes?: unknown;
  terms?: unknown;
  memo?: unknown;
  handler?: unknown;
  productName?: unknown;
  makerName?: unknown;
  location?: unknown;
};

type TradePayload = {
  buyerCompanyName?: unknown;
  sellerCompanyName?: unknown;
  buyerContactName?: unknown;
  buyerAddress?: unknown;
  buyerTel?: unknown;
  buyerPending?: unknown;
  conditions?: TradeConditions;
  buyerContacts?: BuyerContact[];
};

function toNumber(value: unknown): number {
  const parsed = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function buildItems(conditions: TradeConditions): StatementItem[] {
  const qty = toNumber(conditions.quantity) || 1;
  const unitPrice = toNumber(conditions.unitPrice);

  const items: StatementItem[] = [
    {
      lineId: "main-item",
      maker: toString(conditions.makerName),
      itemName: toString(conditions.productName) || "商品",
      qty,
      unitPrice,
      isTaxable: true,
    },
  ];

  if (conditions.shippingFee !== undefined) {
    items.push({
      lineId: "shipping-fee",
      itemName: "送料",
      qty: 1,
      unitPrice: toNumber(conditions.shippingFee),
      isTaxable: true,
    });
  }

  if (conditions.handlingFee !== undefined) {
    items.push({
      lineId: "handling-fee",
      itemName: "手数料",
      qty: 1,
      unitPrice: toNumber(conditions.handlingFee),
      isTaxable: true,
    });
  }

  const pushExtraFee = (
    key: string,
    label?: string,
    amount?: number | null,
    defaultLabel?: string
  ) => {
    if (amount === undefined || amount === null) return;
    items.push({
      lineId: key,
      itemName: label || defaultLabel || key,
      qty: 1,
      unitPrice: amount,
      isTaxable: true,
    });
  };

  pushExtraFee(
    "cardboard-fee",
    toString(conditions.cardboardFee?.label),
    toNumber(conditions.cardboardFee?.amount),
    "段ボール費"
  );
  pushExtraFee(
    "nail-sheet-fee",
    toString(conditions.nailSheetFee?.label),
    toNumber(conditions.nailSheetFee?.amount),
    "釘シート費"
  );
  pushExtraFee(
    "insurance-fee",
    toString(conditions.insuranceFee?.label),
    toNumber(conditions.insuranceFee?.amount),
    "保険料"
  );

  return items;
}

function buildShippingInfo(payload: TradePayload): ShippingInfo {
  return {
    companyName: toString(payload.buyerCompanyName),
    address: toString(payload.buyerAddress),
    tel: toString(payload.buyerTel),
    personName: toString(payload.buyerContactName),
  };
}

const DB_STATUS_TO_TRADE_STATUS: Record<TradeDto["status"], TradeRecord["status"]> = {
  IN_PROGRESS: "PAYMENT_REQUIRED",
  COMPLETED: "COMPLETED",
  CANCELED: "CANCELED",
};

export function transformTrade(dto: TradeDto): TradeRecord {
  const payload = (dto.payload ?? dto.navi?.payload ?? {}) as TradePayload;
  const conditions: TradeConditions = payload.conditions ?? {};
  const listingSnapshot: ListingSnapshot | null = resolveListingSnapshot(
    dto.navi?.listingSnapshot ?? (payload as Record<string, unknown>).listingSnapshot ?? null
  );

  const buyerCompanyName = toString(payload.buyerCompanyName);
  const sellerCompanyName = toString(payload.sellerCompanyName);

  const items = buildItems(conditions);

  const contractDate = toString(conditions.machineShipmentDate || conditions.removalDate);

  const buyer: TradeRecord["buyer"] = {
    companyName: buyerCompanyName || dto.buyerUser?.companyName || "",
    userId: dto.buyerUserId,
  };

  const seller: TradeRecord["seller"] = {
    companyName: sellerCompanyName || dto.sellerUser?.companyName || "",
    userId: dto.sellerUserId,
  };

  const tradeStatus = DB_STATUS_TO_TRADE_STATUS[dto.status] ?? "PAYMENT_REQUIRED";
  const todos = buildTodosFromStatus(tradeStatus);

  return {
    id: String(dto.id),
    naviId: dto.naviId ?? undefined,
    naviType: dto.navi?.naviType ?? undefined,
    status: tradeStatus,
    sellerUserId: dto.sellerUserId,
    buyerUserId: dto.buyerUserId,
    sellerName: seller.companyName,
    buyerName: buyer.companyName,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    contractDate: contractDate || undefined,
    shipmentDate: contractDate || undefined,
    receiveMethod: toString(conditions.machineShipmentType),
    shippingMethod: toString(conditions.documentShipmentType),
    handlerName: toString(conditions.handler),
    paymentMethod: "銀行振込",
    paymentTerms: toString(conditions.terms || conditions.notes),
    seller,
    buyer,
    todos,
    items,
    taxRate: toNumber(conditions.taxRate) || 0.1,
    remarks: toString(conditions.memo),
    termsText: toString(conditions.terms),
    shipping: buildShippingInfo(payload),
    buyerContacts: payload.buyerContacts,
    buyerContactName: toString(payload.buyerContactName),
    buyerShippingAddress: buildShippingInfo(payload),
    listingSnapshot,
  } satisfies TradeRecord;
}
