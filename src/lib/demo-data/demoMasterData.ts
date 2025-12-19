export type SupplierCategory = "vendor" | "hall";

export type SupplierBranch = {
  id: string;
  name: string;
  postalCode: string;
  address: string;
  phone?: string;
  fax?: string;
};

export type SupplierCorporate = {
  id: string;
  category: SupplierCategory;
  corporateName: string;
  postalCode: string;
  address: string;
  phone?: string;
  fax?: string;
  branches: SupplierBranch[];
};

export type MasterData = {
  suppliers: SupplierCorporate[];
  buyerStaffs: string[];
  warehouses: string[];
};

const MASTER_KEY = "demo_inventory_master_v2";

export const createMasterId = (prefix: string) =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const buildDefaultSupplier = (
  corporateName: string,
  category: SupplierCategory = "vendor",
  branchName = "本店",
): SupplierCorporate => ({
  id: createMasterId("supplier"),
  category,
  corporateName,
  postalCode: "",
  address: "",
  phone: "",
  fax: "",
  branches: [
    {
      id: createMasterId("branch"),
      name: branchName,
      postalCode: "",
      address: "",
      phone: "",
      fax: "",
    },
  ],
});

export const DEFAULT_MASTER_DATA: MasterData = {
  suppliers: [
    buildDefaultSupplier("サンプル商事", "vendor", "本社"),
    buildDefaultSupplier("ユニ商会", "vendor", "関東支店"),
    buildDefaultSupplier("大阪商事", "vendor", "大阪支店"),
    buildDefaultSupplier("北日本物産", "vendor", "札幌営業所"),
    buildDefaultSupplier("パチマートテスト", "hall", "高田馬場ホール"),
  ],
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

const isSupplierCorporate = (value: unknown): value is SupplierCorporate => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as SupplierCorporate;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.category === "string" &&
    typeof candidate.corporateName === "string" &&
    Array.isArray(candidate.branches)
  );
};

const migrateLegacySuppliers = (suppliers?: unknown): SupplierCorporate[] => {
  if (!Array.isArray(suppliers)) return DEFAULT_MASTER_DATA.suppliers;
  if (suppliers.every((item) => isSupplierCorporate(item))) {
    return suppliers as SupplierCorporate[];
  }

  return suppliers.map((name) => {
    if (typeof name !== "string") return buildDefaultSupplier("未登録", "vendor");
    return buildDefaultSupplier(name, "vendor");
  });
};

export const loadMasterData = (): MasterData => {
  const stored = readLocalStorage<MasterData>(MASTER_KEY);
  if (stored && Array.isArray(stored.buyerStaffs) && Array.isArray(stored.warehouses)) {
    const migrated: MasterData = {
      ...stored,
      suppliers: migrateLegacySuppliers((stored as MasterData).suppliers),
    };
    writeLocalStorage(MASTER_KEY, migrated);
    return migrated;
  }
  writeLocalStorage(MASTER_KEY, DEFAULT_MASTER_DATA);
  return DEFAULT_MASTER_DATA;
};

export const saveMasterData = (data: MasterData): void => {
  writeLocalStorage(MASTER_KEY, data);
};
