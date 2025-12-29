import { TradeConditions, NaviStatus } from "./types";

export type { NaviStatus } from "./types";

const STORAGE_KEY = "trade_navis";

export interface Navi {
  id: string;
  buyerId?: string | null;
  sellerId?: string;
  status: NaviStatus;
  conditions: TradeConditions;
  createdAt: string;
  updatedAt: string;
  productId?: string | null;
  buyerCompanyName?: string | null;
  buyerContactName?: string | null;
  buyerAddress?: string | null;
  buyerTel?: string | null;
  buyerEmail?: string | null;
  buyerNote?: string | null;
  buyerPending?: boolean;
}

export function loadAllNavis(): Navi[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is Navi => Boolean(item?.id && item?.status && item?.conditions));
  } catch {
    return [];
  }
}

export function saveAllNavis(navis: Navi[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(navis));
}
