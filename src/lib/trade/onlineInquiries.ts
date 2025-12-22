import { DEV_USERS } from "@/lib/dev-user/users";

const USER_A_ID = DEV_USERS.A.id;
const USER_B_ID = DEV_USERS.B.id;

export type OnlineInquiryStatus =
  | "INQUIRY_RESPONSE_REQUIRED"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELED";

export type OnlineInquiryRecord = {
  id: string;
  productId: string;
  sellerUserId: string;
  buyerUserId: string;
  buyerCompanyName: string;
  sellerCompanyName?: string;
  makerName?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  shippingAddress: string;
  contactPerson: string;
  desiredShipDate: string;
  desiredPaymentDate: string;
  memo?: string;
  status: OnlineInquiryStatus;
  createdAt: string;
  updatedAt: string;
};

export const ONLINE_INQUIRY_STORAGE_KEY = "trade_online_inquiries_v1";

const seedInquiries: OnlineInquiryRecord[] = [
  {
    id: "OI-7001",
    productId: "101",
    sellerUserId: USER_B_ID,
    buyerUserId: USER_A_ID,
    sellerCompanyName: DEV_USERS.B.companyName,
    buyerCompanyName: DEV_USERS.A.companyName,
    makerName: "SANKYO",
    productName: "P フィーバー 機動戦士ガンダムSEED",
    quantity: 2,
    unitPrice: 190000,
    shippingAddress: DEV_USERS.A.address,
    contactPerson: DEV_USERS.A.contactName,
    desiredShipDate: "2025-12-05",
    desiredPaymentDate: "2026-01-10",
    memo: "納品希望日と支払予定日を共有しています。",
    createdAt: "2025-11-21T03:30:00.000Z",
    updatedAt: "2025-11-21T03:30:00.000Z",
    status: "INQUIRY_RESPONSE_REQUIRED",
  },
  {
    id: "OI-7002",
    productId: "102",
    sellerUserId: USER_A_ID,
    buyerUserId: USER_B_ID,
    sellerCompanyName: DEV_USERS.A.companyName,
    buyerCompanyName: DEV_USERS.B.companyName,
    makerName: "ニューギン",
    productName: "P 真・花の慶次3 黄金一閃",
    quantity: 3,
    unitPrice: 180000,
    shippingAddress: DEV_USERS.B.address,
    contactPerson: DEV_USERS.B.contactName,
    desiredShipDate: "2025-12-12",
    desiredPaymentDate: "2026-01-15",
    memo: "大型案件のため発送手段は相談させてください。",
    createdAt: "2025-11-22T09:00:00.000Z",
    updatedAt: "2025-11-22T09:00:00.000Z",
    status: "INQUIRY_RESPONSE_REQUIRED",
  },
  {
    id: "OI-7003",
    productId: "103",
    sellerUserId: USER_B_ID,
    buyerUserId: USER_A_ID,
    sellerCompanyName: DEV_USERS.B.companyName,
    buyerCompanyName: DEV_USERS.A.companyName,
    makerName: "Sansei",
    productName: "P ゴジラ対エヴァンゲリオン ～G細胞覚醒～",
    quantity: 1,
    unitPrice: 210000,
    shippingAddress: DEV_USERS.A.address,
    contactPerson: DEV_USERS.A.contactName,
    desiredShipDate: "2025-12-20",
    desiredPaymentDate: "2026-01-20",
    memo: "設置場所の搬入時間帯が限られています。",
    createdAt: "2025-11-23T01:15:00.000Z",
    updatedAt: "2025-11-23T01:15:00.000Z",
    status: "INQUIRY_RESPONSE_REQUIRED",
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
  const sellerCompanyName =
    inquiry.sellerCompanyName ?? companyDirectory[inquiry.sellerUserId] ?? inquiry.sellerUserId;
  const buyerCompanyName = inquiry.buyerCompanyName ?? companyDirectory[inquiry.buyerUserId] ?? inquiry.buyerUserId;

  return {
    ...inquiry,
    sellerCompanyName,
    buyerCompanyName,
    memo: inquiry.memo ?? "",
    status: inquiry.status ?? "INQUIRY_RESPONSE_REQUIRED",
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

export function createOnlineInquiry(
  inquiry: Omit<OnlineInquiryRecord, "id" | "status" | "createdAt" | "updatedAt"> & {
    status?: OnlineInquiryStatus;
  }
): OnlineInquiryRecord {
  const now = new Date().toISOString();
  const record: OnlineInquiryRecord = {
    ...inquiry,
    id: inquiry.productId ? `INQ-${inquiry.productId}-${Date.now()}` : `INQ-${Date.now()}`,
    status: inquiry.status ?? "INQUIRY_RESPONSE_REQUIRED",
    createdAt: now,
    updatedAt: now,
  };

  const inquiries = mergeSeedInquiries(readInquiriesFromStorage()).map(normalizeInquiry);
  inquiries.push(record);
  writeInquiriesToStorage(inquiries);
  return record;
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

export function cancelOnlineInquiry(inquiryId: string): OnlineInquiryRecord | null {
  const inquiries = mergeSeedInquiries(readInquiriesFromStorage()).map(normalizeInquiry);
  const idx = inquiries.findIndex((inquiry) => inquiry.id === inquiryId);
  if (idx < 0) return null;

  const now = new Date().toISOString();
  const canceled: OnlineInquiryRecord = {
    ...inquiries[idx],
    status: "CANCELED",
    updatedAt: now,
  };

  inquiries[idx] = canceled;
  writeInquiriesToStorage(inquiries);
  return canceled;
}
