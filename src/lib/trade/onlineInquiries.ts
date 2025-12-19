import { calculateStatementTotals } from "@/lib/trade/calcTotals";
import { buildTodosFromStatus } from "@/lib/trade/todo";
import { TradeRecord } from "@/lib/trade/types";

import { saveTradeRecord } from "./storage";

export type OnlineInquiryStatus = "pending" | "accepted" | "dismissed";

export type OnlineInquiryRecord = {
  id: string;
  status: OnlineInquiryStatus;
  createdAt: string;
  updatedAt: string;
  sellerUserId: string;
  sellerName: string;
  buyerUserId: string;
  buyerName: string;
  makerName: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  scheduledShipDate: string;
  paymentDate?: string;
  taxRate?: number;
};

export const ONLINE_INQUIRY_STORAGE_KEY = "trade_online_inquiries_v1";

const seedOnlineInquiries: OnlineInquiryRecord[] = [
  {
    id: "INQ-7001",
    status: "pending",
    createdAt: "2025-11-18T12:45:00.000Z",
    updatedAt: "2025-11-21T09:10:00.000Z",
    sellerUserId: "user-b",
    sellerName: "大成ホールディングス",
    buyerUserId: "user-a",
    buyerName: "パチマート", 
    makerName: "SANKYO",
    itemName: "P フィーバー蒼穹のファフナー4",
    quantity: 3,
    unitPrice: 165000,
    totalAmount: 544500,
    scheduledShipDate: "2025-11-30",
    paymentDate: "2025-12-05",
    taxRate: 0.1,
  },
  {
    id: "INQ-7002",
    status: "pending",
    createdAt: "2025-11-20T15:00:00.000Z",
    updatedAt: "2025-11-21T10:30:00.000Z",
    sellerUserId: "user-a",
    sellerName: "パチマート",
    buyerUserId: "user-b",
    buyerName: "大成ホールディングス",
    makerName: "三洋",
    itemName: "P 大海物語5 2S",
    quantity: 2,
    unitPrice: 150000,
    totalAmount: 330000,
    scheduledShipDate: "2025-12-02",
    paymentDate: "2025-12-07",
    taxRate: 0.1,
  },
];

function readOnlineInquiries(): OnlineInquiryRecord[] {
  if (typeof window === "undefined") return seedOnlineInquiries;

  const raw = window.localStorage.getItem(ONLINE_INQUIRY_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as OnlineInquiryRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse online inquiries", error);
    return [];
  }
}

function writeOnlineInquiries(records: OnlineInquiryRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONLINE_INQUIRY_STORAGE_KEY, JSON.stringify(records));
}

export function loadOnlineInquiries(): OnlineInquiryRecord[] {
  const inquiries = readOnlineInquiries();
  if (typeof window === "undefined") return inquiries;

  const merged = [...seedOnlineInquiries];
  const updated = inquiries.reduce<OnlineInquiryRecord[]>((acc, inquiry) => {
    const idx = acc.findIndex((seed) => seed.id === inquiry.id);
    if (idx >= 0) {
      acc[idx] = { ...acc[idx], ...inquiry };
    } else {
      acc.push(inquiry);
    }
    return acc;
  }, merged);

  return updated.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1));
}

function persistInquiry(nextInquiry: OnlineInquiryRecord): OnlineInquiryRecord {
  const inquiries = loadOnlineInquiries();
  const nextList = inquiries.map((inq) => (inq.id === nextInquiry.id ? nextInquiry : inq));

  writeOnlineInquiries(nextList);
  return nextInquiry;
}

function createTradeFromInquiry(inquiry: OnlineInquiryRecord): TradeRecord {
  const now = new Date().toISOString();
  const baseAmount = inquiry.unitPrice * inquiry.quantity;
  const taxRate = inquiry.taxRate ?? 0.1;
  const trade: TradeRecord = {
    id: `T-INQ-${inquiry.id}`,
    status: "PAYMENT_REQUIRED",
    sellerUserId: inquiry.sellerUserId,
    buyerUserId: inquiry.buyerUserId,
    sellerName: inquiry.sellerName,
    buyerName: inquiry.buyerName,
    createdAt: now,
    updatedAt: now,
    contractDate: inquiry.updatedAt,
    paymentDate: inquiry.paymentDate,
    paymentMethod: "銀行振込（即日）",
    seller: {
      companyName: inquiry.sellerName,
      userId: inquiry.sellerUserId,
    },
    buyer: {
      companyName: inquiry.buyerName,
      userId: inquiry.buyerUserId,
    },
    todos: buildTodosFromStatus("PAYMENT_REQUIRED"),
    items: [
      {
        lineId: `${inquiry.id}-item`,
        maker: inquiry.makerName,
        itemName: inquiry.itemName,
        qty: inquiry.quantity,
        unitPrice: inquiry.unitPrice,
        isTaxable: true,
      },
      {
        lineId: `${inquiry.id}-shipping`,
        itemName: "送料（目安）",
        category: "送料",
        qty: 1,
        unitPrice: Math.round(baseAmount * 0.03),
        isTaxable: true,
      },
    ],
    taxRate,
    shipping: {},
  };

  const totals = calculateStatementTotals(trade.items, taxRate);
  trade.paymentAmount = totals.total;
  return saveTradeRecord(trade);
}

export function acceptOnlineInquiry(inquiryId: string): TradeRecord | null {
  const inquiries = loadOnlineInquiries();
  const target = inquiries.find((inq) => inq.id === inquiryId);
  if (!target || target.status !== "pending") return null;

  const now = new Date().toISOString();
  const next = persistInquiry({ ...target, status: "accepted", updatedAt: now });
  return createTradeFromInquiry(next);
}

export function dismissOnlineInquiry(inquiryId: string): OnlineInquiryRecord | null {
  const inquiries = loadOnlineInquiries();
  const target = inquiries.find((inq) => inq.id === inquiryId);
  if (!target || target.status !== "pending") return null;

  const now = new Date().toISOString();
  const next = persistInquiry({ ...target, status: "dismissed", updatedAt: now });
  return next;
}
