export type SupplierCategory = "vendor" | "hall";

export type CompanyProfile = {
  corporateName: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine?: string;
  addressLine2?: string;
  phone: string;
  fax: string;
  title: string;
  representative: string;
  note: string;
};

export type CompanyProfileEntry = CompanyProfile & {
  id: string;
  isPrimary?: boolean;
};

export type CompanyBranch = {
  id: string;
  corporateId?: string;
  name: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine?: string;
  addressLine2?: string;
  phone: string;
  fax: string;
  manager: string;
  note: string;
};

export type CompanyStaff = {
  id: string;
  name: string;
  branchId?: string;
  corporateId?: string;
};

export type SupplierBranch = {
  id: string;
  name: string;
  nameKana?: string;
  postalCode: string;
  prefecture?: string;
  city?: string;
  addressLine?: string;
  address: string;
  representative?: string;
  contactPerson?: string;
  phone?: string;
  fax?: string;
  type?: "hall" | "branch";
};

export type SupplierCorporate = {
  id: string;
  category: SupplierCategory;
  corporateName: string;
  corporateNameKana?: string;
  corporateRepresentative?: string;
  postalCode: string;
  prefecture?: string;
  city?: string;
  addressLine?: string;
  address: string;
  phone?: string;
  fax?: string;
  email?: string;
  isHidden?: boolean;
  branches: SupplierBranch[];
};

export type Warehouse = {
  id: string;
  name: string;
  address: string;
  category: "self" | "other";
};

export type MasterData = {
  suppliers: SupplierCorporate[];
  buyerStaffs: string[];
  warehouses: string[];
  warehouseDetails: Warehouse[];
  companyProfile: CompanyProfile;
  companyProfiles: CompanyProfileEntry[];
  companyBranches: CompanyBranch[];
  companyStaffs: CompanyStaff[];
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
  corporateNameKana: "",
  corporateRepresentative: "",
  postalCode: "",
  prefecture: "",
  city: "",
  addressLine: "",
  address: "",
  phone: "",
  fax: "",
  email: "",
  isHidden: false,
  branches: [
    {
      id: createMasterId("branch"),
      name: branchName,
      nameKana: "",
      postalCode: "",
      prefecture: "",
      city: "",
      addressLine: "",
      address: "",
      representative: "",
      contactPerson: "",
      phone: "",
      fax: "",
      type: category === "hall" ? "hall" : "branch",
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
  warehouseDetails: [],
  companyProfile: {
    corporateName: "",
    postalCode: "",
    prefecture: "",
    city: "",
    addressLine: "",
    addressLine2: "",
    phone: "",
    fax: "",
    title: "",
    representative: "",
    note: "",
  },
  companyProfiles: [],
  companyBranches: [],
  companyStaffs: [],
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

const isCompanyProfileEntry = (value: unknown): value is CompanyProfileEntry => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as CompanyProfileEntry;
  return typeof candidate.id === "string" && typeof candidate.corporateName === "string";
};

const isWarehouseDetail = (value: unknown): value is Warehouse => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Warehouse;
  return typeof candidate.id === "string" && typeof candidate.name === "string";
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

const normalizeCompanyProfiles = (stored: MasterData): CompanyProfileEntry[] => {
  if (Array.isArray(stored.companyProfiles) && stored.companyProfiles.every((item) => isCompanyProfileEntry(item))) {
    const hasPrimary = stored.companyProfiles.some((profile) => profile.isPrimary);
    if (hasPrimary) return stored.companyProfiles;
    if (stored.companyProfiles.length === 0) return [];
    return [{ ...stored.companyProfiles[0], isPrimary: true }, ...stored.companyProfiles.slice(1)];
  }

  return [
    {
      id: "company-primary",
      isPrimary: true,
      ...DEFAULT_MASTER_DATA.companyProfile,
      ...(stored.companyProfile ?? {}),
    },
  ];
};

const normalizeWarehouses = (stored: MasterData): Warehouse[] => {
  if (Array.isArray(stored.warehouseDetails) && stored.warehouseDetails.every((item) => isWarehouseDetail(item))) {
    return stored.warehouseDetails;
  }

  if (Array.isArray(stored.warehouses)) {
    return stored.warehouses.map((name) => ({
      id: createMasterId("warehouse"),
      name,
      address: "",
      category: "self",
    }));
  }

  return DEFAULT_MASTER_DATA.warehouses.map((name) => ({
    id: createMasterId("warehouse"),
    name,
    address: "",
    category: "self",
  }));
};

export const loadMasterData = (): MasterData => {
  const stored = readLocalStorage<MasterData>(MASTER_KEY);
  if (stored && Array.isArray(stored.buyerStaffs) && Array.isArray(stored.warehouses)) {
    const companyProfiles = normalizeCompanyProfiles(stored);
    const primaryProfile = companyProfiles.find((profile) => profile.isPrimary) ?? companyProfiles[0];
    const warehouseDetails = normalizeWarehouses(stored);
    const migrated: MasterData = {
      ...stored,
      suppliers: migrateLegacySuppliers((stored as MasterData).suppliers),
      warehouses: warehouseDetails.map((warehouse) => warehouse.name),
      warehouseDetails,
      companyProfiles,
      companyProfile: {
        ...DEFAULT_MASTER_DATA.companyProfile,
        ...(primaryProfile ?? stored.companyProfile ?? {}),
      },
      companyBranches: stored.companyBranches ?? [],
      companyStaffs: stored.companyStaffs ?? [],
    };
    writeLocalStorage(MASTER_KEY, migrated);
    return migrated;
  }
  const defaultWarehouses = normalizeWarehouses(DEFAULT_MASTER_DATA);
  const defaultCompanyProfiles = normalizeCompanyProfiles(DEFAULT_MASTER_DATA);
  const primaryProfile = defaultCompanyProfiles.find((profile) => profile.isPrimary) ?? defaultCompanyProfiles[0];
  const seeded: MasterData = {
    ...DEFAULT_MASTER_DATA,
    warehouses: defaultWarehouses.map((warehouse) => warehouse.name),
    warehouseDetails: defaultWarehouses,
    companyProfiles: defaultCompanyProfiles,
    companyProfile: {
      ...DEFAULT_MASTER_DATA.companyProfile,
      ...(primaryProfile ?? {}),
    },
  };
  writeLocalStorage(MASTER_KEY, seeded);
  return seeded;
};

export const saveMasterData = (data: MasterData): void => {
  writeLocalStorage(MASTER_KEY, data);
};
