export type MasterData = {
  suppliers: string[];
  buyerStaffs: string[];
  warehouses: string[];
};

const MASTER_KEY = "demo_inventory_master_v1";

export const DEFAULT_MASTER_DATA: MasterData = {
  suppliers: ["サンプル商事", "ユニ商会", "大阪商事", "北日本物産", "パチマートテスト"],
  buyerStaffs: ["山田", "佐藤", "田中"],
  warehouses: ["東京第1倉庫", "埼玉倉庫", "大阪倉庫"],
};

const readLocalStorage = <T,>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Failed to parse localStorage for ${key}`, error);
    return null;
  }
};

const writeLocalStorage = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const loadMasterData = (): MasterData => {
  const stored = readLocalStorage<MasterData>(MASTER_KEY);
  if (stored && Array.isArray(stored.suppliers) && Array.isArray(stored.buyerStaffs) && Array.isArray(stored.warehouses)) {
    return stored;
  }
  writeLocalStorage(MASTER_KEY, DEFAULT_MASTER_DATA);
  return DEFAULT_MASTER_DATA;
};

export const saveMasterData = (data: MasterData): void => {
  writeLocalStorage(MASTER_KEY, data);
};
