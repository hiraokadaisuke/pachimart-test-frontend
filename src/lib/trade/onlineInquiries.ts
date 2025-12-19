import { DEV_USERS } from "@/lib/dev-user/users";

export type OnlineInquiryStatus = "pending" | "accepted" | "declined" | "canceled";

export type OnlineInquiryRecord = {
  id: string;
  tradeId?: string;
  sellerUserId: string;
  buyerUserId: string;
  sellerName?: string;
  buyerName?: string;
  makerName?: string;
  itemName: string;
  quantity: number;
  totalAmount: number;
  updatedAt: string;
  status: OnlineInquiryStatus;
};

export const ONLINE_INQUIRY_STORAGE_KEY = "trade_online_inquiries_v1";

const seedInquiries: OnlineInquiryRecord[] = [
  {
    id: "OI-7001",
    tradeId: "T-REQ-5101",
    sellerUserId: "user-b",
    buyerUserId: "user-a",
    sellerName: DEV_USERS.B.companyName,
    buyerName: DEV_USERS.A.companyName,
    makerName: "SANKYO",
    itemName: "P フィーバー 機動戦士ガンダムSEED",
    quantity: 2,
    totalAmount: 380000,
    updatedAt: "2025-11-21T03:30:00.000Z",
    status: "pending",
  },
  {
    id: "OI-7002",
    tradeId: "T-REQ-5102",
    sellerUserId: "user-a",
    buyerUserId: "user-b",
    sellerName: DEV_USERS.A.companyName,
    buyerName: DEV_USERS.B.companyName,
    makerName: "ニューギン",
    itemName: "P 真・花の慶次3 黄金一閃",
    quantity: 3,
    totalAmount: 540000,
    updatedAt: "2025-11-22T09:00:00.000Z",
    status: "pending",
  },
  {
    id: "OI-7003",
    tradeId: "T-REQ-5103",
    sellerUserId: "user-b",
    buyerUserId: "user-a",
    sellerName: DEV_USERS.B.companyName,
    buyerName: DEV_USERS.A.companyName,
    makerName: "Sansei",
    itemName: "P ゴジラ対エヴァンゲリオン ～G細胞覚醒～",
    quantity: 1,
    totalAmount: 210000,
    updatedAt: "2025-11-23T01:15:00.000Z",
    status: "pending",
  },
];

const companyDirectory = Object.values(DEV_USERS).reduce<Record<string, string>>((acc, user) => {
  acc[user.id] = user.companyName;
  return acc;
}, {});

function readInquiriesFromStorage(): OnlineInquiryRecord[] {
  if (typeof window === "undefined") return seedInquiries;

  const raw = window.localStorage.getItem(ONLINE_INQUIRY_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as OnlineInquiryRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeInquiriesToStorage(inquiries: OnlineInquiryRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONLINE_INQUIRY_STORAGE_KEY, JSON.stringify(inquiries));
}

function mergeSeedInquiries(stored: OnlineInquiryRecord[]): OnlineInquiryRecord[] {
  const ids = new Set(stored.map((inquiry) => inquiry.id));
  const merged = [...stored];
  seedInquiries.forEach((seed) => {
    if (!ids.has(seed.id)) merged.push(seed);
  });
  return merged;
}

function normalizeInquiry(inquiry: OnlineInquiryRecord): OnlineInquiryRecord {
  const sellerName = inquiry.sellerName ?? companyDirectory[inquiry.sellerUserId] ?? inquiry.sellerUserId;
  const buyerName = inquiry.buyerName ?? companyDirectory[inquiry.buyerUserId] ?? inquiry.buyerUserId;

  return {
    ...inquiry,
    sellerName,
    buyerName,
    status: inquiry.status ?? "pending",
  };
}

export function loadOnlineInquiries(): OnlineInquiryRecord[] {
  const stored = readInquiriesFromStorage();
  const normalized = mergeSeedInquiries(stored).map(normalizeInquiry);

  if (typeof window !== "undefined" && stored.length === 0) {
    writeInquiriesToStorage(normalized);
  }

  return normalized;
}

export function updateOnlineInquiryStatus(
  inquiryId: string,
  status: OnlineInquiryStatus
): OnlineInquiryRecord | null {
  const inquiries = mergeSeedInquiries(readInquiriesFromStorage()).map(normalizeInquiry);
  const idx = inquiries.findIndex((inquiry) => inquiry.id === inquiryId);
  if (idx < 0) return null;

  const now = new Date().toISOString();
  const updated: OnlineInquiryRecord = {
    ...inquiries[idx],
    status,
    updatedAt: now,
  };

  inquiries[idx] = updated;
  writeInquiriesToStorage(inquiries);

  return updated;
}
