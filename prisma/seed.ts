import {
  ExhibitStatus,
  ExhibitType,
  MessageSenderRole,
  Prisma,
  PrismaClient,
  RemovalStatus,
  NaviStatus,
  NaviType,
  DealingStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const ALLOWED_SEED_MODES = ["preview", "dev"] as const;

type DevUser = {
  id: string;
  companyName: string;
  contactName: string;
  address: string;
  tel: string;
};

type StorageLocationSeed = {
  id: string;
  ownerUserId: string;
  name: string;
  address?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  addressLine?: string;
  handlingFeePerUnit?: number;
  shippingFeesByRegion?: Prisma.JsonObject;
  isActive?: boolean;
};

type ListingSeed = {
  id: string;
  sellerUserId: string;
  status: ExhibitStatus;
  isVisible: boolean;
  type: ExhibitType;
  kind: string;
  maker: string;
  machineName: string;
  quantity: number;
  unitPriceExclTax: number | null;
  isNegotiable: boolean;
  removalStatus: RemovalStatus;
  removalDate: Date | null;
  hasNailSheet: boolean;
  hasManual: boolean;
  pickupAvailable: boolean;
  storageLocation: string;
  storageLocationId: string;
  storageLocationSnapshot: Prisma.JsonObject;
  shippingFeeCount: number;
  handlingFeeCount: number;
  allowPartial: boolean;
  note: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type BuyerShippingAddressSeed = {
  id: string;
  ownerUserId: string;
  label: string;
  companyName: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
  tel: string;
  contactName: string;
};

type MakerSeed = {
  name: string;
};

type MachineModelSeed = {
  makerName: string;
  type: ExhibitType;
  name: string;
};

const USERS: DevUser[] = [
  {
    id: "dev_user_1",
    companyName: "株式会社あいおえお",
    contactName: "田中 太郎",
    address: "東京都千代田区丸の内1-1-1 パチマートビル 10F",
    tel: "03-1234-5678",
  },
  {
    id: "dev_user_2",
    companyName: "株式会社かきくけこ",
    contactName: "佐藤 花子",
    address: "大阪府大阪市北区梅田1-2-3 トレードタワー 15F",
    tel: "06-9876-5432",
  },
  {
    id: "dev_user_3",
    companyName: "株式会社さしすせそ",
    contactName: "鈴木 次郎",
    address: "福岡県福岡市中央区天神2-4-5 開発センター 3F",
    tel: "092-123-4567",
  },
  {
    id: "dev_user_4",
    companyName: "株式会社たちつてと",
    contactName: "高橋 三郎",
    address: "愛知県名古屋市中村区名駅3-5-7 シードビル 8F",
    tel: "052-765-4321",
  },
  {
    id: "dev_user_5",
    companyName: "株式会社なにぬねの",
    contactName: "山本 四季",
    address: "北海道札幌市中央区大通西1-1-1 プレビュータワー 12F",
    tel: "011-234-5678",
  },
];

const STORAGE_LOCATIONS: StorageLocationSeed[] = [
  {
    id: "location_dev_user_1_1",
    ownerUserId: "dev_user_1",
    name: "東京倉庫",
    address: "東京都千代田区丸の内1-1-1",
    prefecture: "東京都",
    city: "千代田区",
  },
  {
    id: "location_dev_user_1_2",
    ownerUserId: "dev_user_1",
    name: "大阪支店倉庫",
    address: "大阪府大阪市北区梅田1-2-3",
    prefecture: "大阪府",
    city: "大阪市北区",
  },
  {
    id: "location_dev_user_2_1",
    ownerUserId: "dev_user_2",
    name: "福岡倉庫",
    address: "福岡県福岡市中央区天神2-4-5",
    prefecture: "福岡県",
    city: "福岡市中央区",
  },
  {
    id: "location_dev_user_3_1",
    ownerUserId: "dev_user_3",
    name: "名古屋デポ",
    address: "愛知県名古屋市中村区名駅3-5-7",
    prefecture: "愛知県",
    city: "名古屋市中村区",
  },
  {
    id: "machine_storage_dev_user_1_1",
    ownerUserId: "dev_user_1",
    name: "東京湾岸倉庫",
    postalCode: "135-0064",
    prefecture: "東京都",
    city: "江東区",
    addressLine: "青海2-7-4",
    handlingFeePerUnit: 5000,
    shippingFeesByRegion: {
      hokkaido: 18000,
      tohokuNorth: 14000,
      tohokuSouth: 12000,
      kanto: 8000,
      chubu: 11000,
      kinki: 13000,
      chugoku: 15000,
      shikoku: 16000,
      kitakyushu: 17000,
      minamikyushu: 18000,
      okinawa: 22000,
    },
  },
  {
    id: "machine_storage_dev_user_1_2",
    ownerUserId: "dev_user_1",
    name: "埼玉メンテ倉庫",
    postalCode: "330-0854",
    prefecture: "埼玉県",
    city: "さいたま市大宮区",
    addressLine: "桜木町1-2-3",
    handlingFeePerUnit: 4500,
    shippingFeesByRegion: {
      hokkaido: 17000,
      tohokuNorth: 13000,
      tohokuSouth: 11000,
      kanto: 7000,
      chubu: 10000,
      kinki: 12500,
      chugoku: 14500,
      shikoku: 15500,
      kitakyushu: 16500,
      minamikyushu: 17500,
      okinawa: 21000,
    },
  },
  {
    id: "machine_storage_dev_user_2_1",
    ownerUserId: "dev_user_2",
    name: "福岡出庫センター",
    postalCode: "810-0001",
    prefecture: "福岡県",
    city: "福岡市中央区",
    addressLine: "天神2-4-5",
    handlingFeePerUnit: 4200,
    shippingFeesByRegion: {
      hokkaido: 20000,
      tohokuNorth: 16000,
      tohokuSouth: 15000,
      kanto: 13000,
      chubu: 12000,
      kinki: 11000,
      chugoku: 9000,
      shikoku: 9500,
      kitakyushu: 8000,
      minamikyushu: 8500,
      okinawa: 23000,
    },
  },
  {
    id: "machine_storage_dev_user_4_1",
    ownerUserId: "dev_user_4",
    name: "札幌北倉庫",
    postalCode: "060-0042",
    prefecture: "北海道",
    city: "札幌市中央区",
    addressLine: "大通西1-1-1",
    handlingFeePerUnit: 5200,
    shippingFeesByRegion: {
      hokkaido: 6000,
      tohokuNorth: 14000,
      tohokuSouth: 13000,
      kanto: 16000,
      chubu: 17000,
      kinki: 18000,
      chugoku: 19000,
      shikoku: 19500,
      kitakyushu: 20000,
      minamikyushu: 21000,
      okinawa: 24000,
    },
  },
];

const DEV_TEST_USER_ID = "dev_user_1";

const DEV_TEST_STORAGE_LOCATIONS: StorageLocationSeed[] = [
  {
    id: "test_storage_dev_user_1_tokyo",
    ownerUserId: DEV_TEST_USER_ID,
    name: "テスト倉庫（東京）",
    prefecture: "東京都",
    addressLine: "テスト用 東京都内ロケーション",
  },
  {
    id: "test_storage_dev_user_1_osaka",
    ownerUserId: DEV_TEST_USER_ID,
    name: "テスト倉庫（大阪）",
    prefecture: "大阪府",
    addressLine: "テスト用 大阪府内ロケーション",
  },
  {
    id: "test_storage_dev_user_1_fukuoka",
    ownerUserId: DEV_TEST_USER_ID,
    name: "テスト倉庫（福岡）",
    prefecture: "福岡県",
    addressLine: "テスト用 福岡県内ロケーション",
  },
  {
    id: "test_storage_dev_user_1_demo",
    ownerUserId: DEV_TEST_USER_ID,
    name: "デモ倉庫（共通）",
    prefecture: "東京都",
    addressLine: "デモ用 共通ロケーション",
  },
];

const findStorageLocationSnapshot = (id: string): Prisma.JsonObject => {
  const location = STORAGE_LOCATIONS.find((loc) => loc.id === id);

  if (!location) {
    throw new Error(`Storage location not found for snapshot: ${id}`);
  }

  const snapshot: Record<string, unknown> = {
    id: location.id,
    name: location.name,
  };

  if (location.address) snapshot.address = location.address;
  if (location.postalCode) snapshot.postalCode = location.postalCode;
  if (location.prefecture) snapshot.prefecture = location.prefecture;
  if (location.city) snapshot.city = location.city;
  if (location.addressLine) snapshot.addressLine = location.addressLine;
  if (location.handlingFeePerUnit !== undefined) snapshot.handlingFeePerUnit = location.handlingFeePerUnit;
  if (location.shippingFeesByRegion) snapshot.shippingFeesByRegion = location.shippingFeesByRegion;

  return snapshot as Prisma.JsonObject;
};
const now = new Date();

const MAKERS: MakerSeed[] = [
  { name: "三洋" },
  { name: "平和" },
  { name: "三共" },
  { name: "サミー" },
  { name: "ユニバーサル" },
  { name: "オリンピア" },
  { name: "大一" },
  { name: "藤商事" },
  { name: "京楽" },
  { name: "北電子" },
];

const MACHINE_MODELS: MachineModelSeed[] = [
  { makerName: "三洋", type: ExhibitType.PACHINKO, name: "P海物語5" },
  { makerName: "三洋", type: ExhibitType.PACHINKO, name: "P大海物語4スペシャル" },
  { makerName: "三洋", type: ExhibitType.PACHINKO, name: "Pギンギラパラダイス" },
  { makerName: "三洋", type: ExhibitType.SLOT, name: "Sスーパー海物語" },
  { makerName: "三洋", type: ExhibitType.SLOT, name: "S海物語リミックス" },
  { makerName: "三洋", type: ExhibitType.SLOT, name: "S海物語Z" },
  { makerName: "平和", type: ExhibitType.PACHINKO, name: "Pルパン三世2000カラット" },
  { makerName: "平和", type: ExhibitType.PACHINKO, name: "P麻雀物語4" },
  { makerName: "平和", type: ExhibitType.PACHINKO, name: "Pバンドリ!" },
  { makerName: "平和", type: ExhibitType.SLOT, name: "Sルパン三世Lupin the Last" },
  { makerName: "平和", type: ExhibitType.SLOT, name: "S麻雀物語5" },
  { makerName: "平和", type: ExhibitType.SLOT, name: "S戦国乙女4" },
  { makerName: "三共", type: ExhibitType.PACHINKO, name: "Pフィーバーからくりサーカス" },
  { makerName: "三共", type: ExhibitType.PACHINKO, name: "Pフィーバー革命機ヴァルヴレイヴ" },
  { makerName: "三共", type: ExhibitType.PACHINKO, name: "Pフィーバーアクエリオン7" },
  { makerName: "三共", type: ExhibitType.SLOT, name: "Sからくりサーカス" },
  { makerName: "三共", type: ExhibitType.SLOT, name: "S革命機ヴァルヴレイヴ" },
  { makerName: "三共", type: ExhibitType.SLOT, name: "Sアクエリオン" },
  { makerName: "サミー", type: ExhibitType.PACHINKO, name: "P北斗の拳9" },
  { makerName: "サミー", type: ExhibitType.PACHINKO, name: "P蒼天の拳天刻" },
  { makerName: "サミー", type: ExhibitType.PACHINKO, name: "P真・北斗無双" },
  { makerName: "サミー", type: ExhibitType.SLOT, name: "S北斗の拳" },
  { makerName: "サミー", type: ExhibitType.SLOT, name: "S甲鉄城のカバネリ" },
  { makerName: "サミー", type: ExhibitType.SLOT, name: "Sエウレカセブン4" },
  { makerName: "ユニバーサル", type: ExhibitType.PACHINKO, name: "Pバジリスク桜花忍法帖" },
  { makerName: "ユニバーサル", type: ExhibitType.PACHINKO, name: "Pアナザーゴッドハーデス" },
  { makerName: "ユニバーサル", type: ExhibitType.PACHINKO, name: "P魔法少女まどか☆マギカ" },
  { makerName: "ユニバーサル", type: ExhibitType.SLOT, name: "Sバジリスク絆2" },
  { makerName: "ユニバーサル", type: ExhibitType.SLOT, name: "Sアナザーゴッドハーデス解き放たれし槍撃" },
  { makerName: "ユニバーサル", type: ExhibitType.SLOT, name: "Sまどか☆マギカ叛逆" },
  { makerName: "オリンピア", type: ExhibitType.PACHINKO, name: "P南国育ち30" },
  { makerName: "オリンピア", type: ExhibitType.PACHINKO, name: "Pルパン三世消されたルパン" },
  { makerName: "オリンピア", type: ExhibitType.PACHINKO, name: "Pプレミアムうまい棒" },
  { makerName: "オリンピア", type: ExhibitType.SLOT, name: "S南国育ち" },
  { makerName: "オリンピア", type: ExhibitType.SLOT, name: "Sルパン三世ルパン The First" },
  { makerName: "オリンピア", type: ExhibitType.SLOT, name: "S主役は銭形4" },
  { makerName: "大一", type: ExhibitType.PACHINKO, name: "Pひぐらしのなく頃に廻" },
  { makerName: "大一", type: ExhibitType.PACHINKO, name: "P真・怪獣王ゴジラ2" },
  { makerName: "大一", type: ExhibitType.PACHINKO, name: "P犬夜叉2" },
  { makerName: "大一", type: ExhibitType.SLOT, name: "Sひぐらしのなく頃に祭2" },
  { makerName: "大一", type: ExhibitType.SLOT, name: "Sダイナマイトキング" },
  { makerName: "大一", type: ExhibitType.SLOT, name: "S犬夜叉" },
  { makerName: "藤商事", type: ExhibitType.PACHINKO, name: "Pとある魔術の禁書目録" },
  { makerName: "藤商事", type: ExhibitType.PACHINKO, name: "P地獄少女 きくりのお祭り" },
  { makerName: "藤商事", type: ExhibitType.PACHINKO, name: "P緋弾のアリア緋緋神降臨" },
  { makerName: "藤商事", type: ExhibitType.SLOT, name: "Sとある科学の超電磁砲" },
  { makerName: "藤商事", type: ExhibitType.SLOT, name: "S地獄少女" },
  { makerName: "藤商事", type: ExhibitType.SLOT, name: "S緋弾のアリア" },
  { makerName: "京楽", type: ExhibitType.PACHINKO, name: "P乃木坂46" },
  { makerName: "京楽", type: ExhibitType.PACHINKO, name: "Pにゃんこ大戦争" },
  { makerName: "京楽", type: ExhibitType.PACHINKO, name: "P仮面ライダーBLACK" },
  { makerName: "京楽", type: ExhibitType.SLOT, name: "S乃木坂46" },
  { makerName: "京楽", type: ExhibitType.SLOT, name: "Sにゃんこ大戦争" },
  { makerName: "京楽", type: ExhibitType.SLOT, name: "S仮面ライダー" },
  { makerName: "北電子", type: ExhibitType.PACHINKO, name: "Pファンキージャグラー" },
  { makerName: "北電子", type: ExhibitType.PACHINKO, name: "Pゴーゴージャグラー" },
  { makerName: "北電子", type: ExhibitType.PACHINKO, name: "Pマイジャグラー" },
  { makerName: "北電子", type: ExhibitType.SLOT, name: "SアイムジャグラーEX" },
  { makerName: "北電子", type: ExhibitType.SLOT, name: "Sゴーゴージャグラー3" },
  { makerName: "北電子", type: ExhibitType.SLOT, name: "Sファンキージャグラー2" },
];

const LISTINGS: ListingSeed[] = [
  {
    id: "listing_dev_phone_ready",
    sellerUserId: "dev_user_1",
    status: ExhibitStatus.PUBLISHED,
    isVisible: true,
    type: ExhibitType.PACHINKO,
    kind: "P",
    maker: "メーカーA",
    machineName: "モデルA-1",
    quantity: 3,
    unitPriceExclTax: 120000,
    isNegotiable: false,
    removalStatus: RemovalStatus.SCHEDULED,
    removalDate: new Date("2024-12-15"),
    hasNailSheet: true,
    hasManual: true,
    pickupAvailable: true,
    storageLocation: "東京湾岸倉庫",
    storageLocationId: "machine_storage_dev_user_1_1",
    storageLocationSnapshot: findStorageLocationSnapshot("machine_storage_dev_user_1_1"),
    shippingFeeCount: 1,
    handlingFeeCount: 1,
    allowPartial: false,
    note: "即日出荷可。オンライン問い合わせ可能なサンプル。",
    createdAt: now,
  },
  {
    id: "listing_dev_bundle",
    sellerUserId: "dev_user_1",
    status: ExhibitStatus.PUBLISHED,
    isVisible: true,
    type: ExhibitType.SLOT,
    kind: "S",
    maker: "メーカーB",
    machineName: "モデルB-2",
    quantity: 2,
    unitPriceExclTax: 95000,
    isNegotiable: false,
    removalStatus: RemovalStatus.SCHEDULED,
    removalDate: new Date("2024-11-01"),
    hasNailSheet: false,
    hasManual: true,
    pickupAvailable: false,
    storageLocation: "埼玉メンテ倉庫",
    storageLocationId: "machine_storage_dev_user_1_2",
    storageLocationSnapshot: findStorageLocationSnapshot("machine_storage_dev_user_1_2"),
    shippingFeeCount: 2,
    handlingFeeCount: 1,
    allowPartial: true,
    note: "バラ売り可。電話ナビの承認サンプル。",
    createdAt: now,
  },
  {
    id: "listing_dev_negotiable",
    sellerUserId: "dev_user_1",
    status: ExhibitStatus.PUBLISHED,
    isVisible: true,
    type: ExhibitType.SLOT,
    kind: "S",
    maker: "メーカーC",
    machineName: "モデルC-応相談",
    quantity: 1,
    unitPriceExclTax: null,
    isNegotiable: true,
    removalStatus: RemovalStatus.REMOVED,
    removalDate: null,
    hasNailSheet: false,
    hasManual: false,
    pickupAvailable: true,
    storageLocation: "東京湾岸倉庫",
    storageLocationId: "machine_storage_dev_user_1_1",
    storageLocationSnapshot: findStorageLocationSnapshot("machine_storage_dev_user_1_1"),
    shippingFeeCount: 1,
    handlingFeeCount: 1,
    allowPartial: false,
    note: "応相談のためオンライン問い合わせ不可サンプル。",
    createdAt: now,
  },
  {
    id: "listing_dev_comparison_buyer",
    sellerUserId: "dev_user_2",
    status: ExhibitStatus.PUBLISHED,
    isVisible: true,
    type: ExhibitType.PACHINKO,
    kind: "P",
    maker: "メーカーD",
    machineName: "モデルD-比較用",
    quantity: 4,
    unitPriceExclTax: 88000,
    isNegotiable: false,
    removalStatus: RemovalStatus.SCHEDULED,
    removalDate: new Date("2024-10-20"),
    hasNailSheet: true,
    hasManual: false,
    pickupAvailable: true,
    storageLocation: "福岡出庫センター",
    storageLocationId: "machine_storage_dev_user_2_1",
    storageLocationSnapshot: findStorageLocationSnapshot("machine_storage_dev_user_2_1"),
    shippingFeeCount: 1,
    handlingFeeCount: 1,
    allowPartial: true,
    note: "オンライン問い合わせの送信先サンプル。",
    createdAt: now,
  },
  {
    id: "listing_dev_sold_showcase",
    sellerUserId: "dev_user_4",
    status: ExhibitStatus.SOLD,
    isVisible: true,
    type: ExhibitType.PACHINKO,
    kind: "P",
    maker: "メーカーE",
    machineName: "モデルE-成約済み",
    quantity: 1,
    unitPriceExclTax: 80000,
    isNegotiable: false,
    removalStatus: RemovalStatus.SCHEDULED,
    removalDate: new Date("2025-01-10"),
    hasNailSheet: true,
    hasManual: true,
    pickupAvailable: false,
    storageLocation: "札幌北倉庫",
    storageLocationId: "machine_storage_dev_user_4_1",
    storageLocationSnapshot: findStorageLocationSnapshot("machine_storage_dev_user_4_1"),
    shippingFeeCount: 2,
    handlingFeeCount: 2,
    allowPartial: true,
    note: "成約済み表示のサンプル。",
    createdAt: now,
  },
];

const BUYER_SHIPPING_ADDRESSES: BuyerShippingAddressSeed[] = [
  {
    id: "shipping_dev_user_2_main",
    ownerUserId: "dev_user_2",
    label: "大阪本社",
    companyName: "株式会社かきくけこ",
    postalCode: "530-0001",
    prefecture: "大阪府",
    city: "大阪市北区",
    addressLine: "梅田1-2-3",
    tel: "06-9876-5432",
    contactName: "佐藤 花子",
  },
  {
    id: "shipping_dev_user_3_main",
    ownerUserId: "dev_user_3",
    label: "福岡支社",
    companyName: "株式会社さしすせそ",
    postalCode: "810-0001",
    prefecture: "福岡県",
    city: "福岡市中央区",
    addressLine: "天神2-4-5",
    tel: "092-123-4567",
    contactName: "鈴木 次郎",
  },
];

const DEV_USER_IDS = USERS.map((user) => user.id);

const toIsoString = (value: Date | null | undefined): string | null => {
  if (!value) return null;
  return value.toISOString();
};

const buildListingSnapshot = (listing: ListingSeed) => ({
  listingId: listing.id,
  status: listing.status,
  isVisible: listing.isVisible,
  type: listing.type,
  kind: listing.kind,
  maker: listing.maker,
  machineName: listing.machineName,
  title: listing.machineName,
  description: listing.note,
  unitPriceExclTax: listing.isNegotiable ? null : listing.unitPriceExclTax,
  quantity: listing.quantity,
  isNegotiable: listing.isNegotiable,
  removalStatus: listing.removalStatus,
  removalDate: toIsoString(listing.removalDate),
  hasNailSheet: listing.hasNailSheet,
  hasManual: listing.hasManual,
  pickupAvailable: listing.pickupAvailable,
  storageLocation: listing.storageLocation,
  storageLocationId: listing.storageLocationId,
  allowPartialSale: listing.allowPartial,
  allowPartial: listing.allowPartial,
  storageLocationSnapshot: listing.storageLocationSnapshot,
  shippingCount: listing.shippingFeeCount,
  shippingFeeCount: listing.shippingFeeCount,
  handlingFeeCount: listing.handlingFeeCount,
  flags: {
    hasKugiSheet: listing.hasNailSheet,
    hasManual: listing.hasManual,
    pickupAvailable: listing.pickupAvailable,
  },
  createdAt: toIsoString(listing.createdAt ?? now) ?? now.toISOString(),
  updatedAt: toIsoString(listing.updatedAt ?? listing.createdAt ?? now) ?? now.toISOString(),
  note: listing.note,
});

const buildPhoneAgreementPayload = (
  listing: ListingSeed,
  ownerUserId: string,
  buyerUserId: string,
  options?: Partial<{
    quantity: number;
    shippingFee: number;
    handlingFee: number;
    taxRate: number;
    memo: string | null;
    handler: string | null;
  }>
) => {
  const createdAt = new Date().toISOString();
  return {
    id: listing.id,
    ownerUserId,
    status: "sent_to_buyer",
    productId: listing.id,
    buyerId: buyerUserId,
    buyerPending: false,
    buyerCompanyName: USERS.find((user) => user.id === buyerUserId)?.companyName ?? null,
    buyerContactName: options?.handler ?? "購買担当A",
    buyerAddress: `${listing.storageLocation} 経由搬入予定`,
    buyerTel: "080-0000-0000",
    conditions: {
      unitPrice: listing.unitPriceExclTax ?? 0,
      quantity: options?.quantity ?? 1,
      shippingFee: options?.shippingFee ?? 8000,
      handlingFee: options?.handlingFee ?? 0,
      taxRate: options?.taxRate ?? 0.1,
      machineShipmentDate: listing.removalDate ? toIsoString(listing.removalDate) ?? undefined : undefined,
      paymentDue: "2024-12-20",
      memo: options?.memo ?? null,
      handler: options?.handler ?? "営業担当A",
      productName: listing.machineName,
      makerName: listing.maker,
      location: listing.storageLocation,
    },
    createdAt,
    updatedAt: createdAt,
  } satisfies Prisma.JsonObject;
};

const buildTradePayload = (
  listing: ListingSeed,
  sellerUserId: string,
  buyerUserId: string,
  overrides?: Partial<{
    quantity: number;
    shippingFee: number;
    handlingFee: number;
    status: DealingStatus;
  }>
) => {
  const shipmentDate = "2024-12-05";
  return {
    buyerCompanyName: USERS.find((user) => user.id === buyerUserId)?.companyName ?? "",
    sellerCompanyName: USERS.find((user) => user.id === sellerUserId)?.companyName ?? "",
    buyerContactName: "現場担当B",
    buyerAddress: "福岡県福岡市中央区1-2-3",
    buyerTel: "090-1234-5678",
    buyerPending: false,
    buyerContacts: [
      { personName: "現場担当B", tel: "090-1234-5678" },
      { personName: "経理担当", tel: "090-0000-9999" },
    ],
    buyerShippingAddress: {
      companyName: USERS.find((user) => user.id === buyerUserId)?.companyName ?? "",
      address: "福岡県福岡市中央区天神2-4-5",
      tel: "092-123-4567",
      personName: "配送窓口",
    },
    conditions: {
      unitPrice: listing.unitPriceExclTax ?? 0,
      quantity: overrides?.quantity ?? 2,
      shippingFee: overrides?.shippingFee ?? 15000,
      handlingFee: overrides?.handlingFee ?? 5000,
      taxRate: 0.1,
      machineShipmentDate: shipmentDate,
      documentShipmentType: "メール送付",
      paymentDue: "2024-12-20",
      cardboardFee: { label: "梱包費", amount: 3000 },
      memo: "発注書受領済み",
      productName: listing.machineName,
      makerName: listing.maker,
      location: listing.storageLocation,
    },
    listingSnapshot: buildListingSnapshot(listing),
  } satisfies Prisma.JsonObject;
};

async function clearExistingData() {
  console.log("Clearing existing dev data...");
  await prisma.message.deleteMany({ where: { senderUserId: { in: DEV_USER_IDS } } });
  await prisma.dealing.deleteMany({
    where: { OR: [{ sellerUserId: { in: DEV_USER_IDS } }, { buyerUserId: { in: DEV_USER_IDS } }] },
  });
  await prisma.navi.deleteMany({ where: { ownerUserId: { in: DEV_USER_IDS } } });
  await prisma.exhibit.deleteMany({ where: { sellerUserId: { in: DEV_USER_IDS } } });
  await prisma.storageLocation.deleteMany({ where: { ownerUserId: { in: DEV_USER_IDS } } });
  try {
    await prisma.buyerShippingAddress.deleteMany({ where: { ownerUserId: { in: DEV_USER_IDS } } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      console.warn("BuyerShippingAddress table not found. Skipping deleteMany.");
    } else {
      throw error;
    }
  }
}

async function seedUsers() {
  console.log(`Seeding ${USERS.length} users...`);
  for (const user of USERS) {
    await prisma.user.upsert({ where: { id: user.id }, update: user, create: user });
  }
}

async function seedStorageLocations() {
  const locations = [...STORAGE_LOCATIONS, ...DEV_TEST_STORAGE_LOCATIONS];

  for (const location of locations) {
    const { address, ...rest } = location;

    await prisma.storageLocation.upsert({
      where: {
        name_ownerUserId: { name: rest.name, ownerUserId: rest.ownerUserId },
      },
      update: {},
      create: {
        ...rest,
        addressLine: location.addressLine ?? address ?? null,
      },
    });
  }
}

async function seedMakersAndModels() {
  const makerMap = new Map<string, string>();

  for (const maker of MAKERS) {
    const created = await prisma.maker.upsert({
      where: { name: maker.name },
      update: {},
      create: { name: maker.name },
    });
    makerMap.set(maker.name, created.id);
  }

  for (const model of MACHINE_MODELS) {
    const makerId = makerMap.get(model.makerName);
    if (!makerId) {
      throw new Error(`Maker not found for model seed: ${model.makerName}`);
    }

    await prisma.machineModel.upsert({
      where: {
        makerId_type_name: {
          makerId,
          type: model.type,
          name: model.name,
        },
      },
      update: {},
      create: {
        makerId,
        type: model.type,
        name: model.name,
      },
    });
  }

  console.log(`Seeded ${MAKERS.length} makers and ${MACHINE_MODELS.length} machine models.`);
}

async function seedListings() {
  const createdListings = [] as ListingSeed[];
  for (const listing of LISTINGS) {
    const created = await prisma.exhibit.create({
      data: {
        ...listing,
        createdAt: listing.createdAt ?? now,
        updatedAt: listing.updatedAt ?? listing.createdAt ?? now,
      },
    });
    createdListings.push({ ...listing, createdAt: created.createdAt, updatedAt: created.updatedAt });
  }
  console.log(`Seeded ${createdListings.length} listings.`);
  return createdListings;
}

async function seedBuyerShippingAddresses() {
  try {
    for (const address of BUYER_SHIPPING_ADDRESSES) {
      await prisma.buyerShippingAddress.create({ data: { ...address, isActive: true } });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      console.warn("BuyerShippingAddress table not found. Skipping seed.");
    } else {
      throw error;
    }
  }
}

async function seedNavis(listings: ListingSeed[]) {
  const listingMap = new Map(listings.map((listing) => [listing.id, listing]));

  const phoneListing = listingMap.get("listing_dev_phone_ready");
  const bundleListing = listingMap.get("listing_dev_bundle");
  const comparisonListing = listingMap.get("listing_dev_comparison_buyer");

  if (!phoneListing || !bundleListing || !comparisonListing) {
    throw new Error("Required listings are missing for seeding navis");
  }

  const phonePayload = buildPhoneAgreementPayload(phoneListing, "dev_user_1", "dev_user_2", {
    quantity: 1,
    shippingFee: 9000,
    memo: "電話ヒアリング済み、承認待ち",
  });

  const phoneNavi = await prisma.navi.create({
    data: {
      status: NaviStatus.SENT,
      naviType: NaviType.PHONE_AGREEMENT,
      ownerUserId: "dev_user_1",
      buyerUserId: "dev_user_2",
      listingId: phoneListing.id,
      listingSnapshot: buildListingSnapshot(phoneListing),
      payload: phonePayload,
    },
  });

  const inquiryPayload = {
    inquiryType: "ONLINE_INQUIRY",
    id: comparisonListing.id,
    ownerUserId: comparisonListing.sellerUserId,
    status: "sent_to_buyer",
    productId: comparisonListing.id,
    buyerId: "dev_user_1",
    buyerCompanyName: USERS.find((user) => user.id === "dev_user_1")?.companyName ?? null,
    buyerContactName: "調達担当C",
    buyerAddress: "東京都千代田区丸の内1-1-1",
    buyerPending: false,
    conditions: {
      quantity: 2,
      unitPrice: comparisonListing.unitPriceExclTax ?? 0,
      shippingFee: 0,
      handlingFee: 0,
      taxRate: 0.1,
      memo: "オンライン問い合わせのサンプル",
      productName: comparisonListing.machineName,
      makerName: comparisonListing.maker,
      location: comparisonListing.storageLocation,
      machineShipmentDate: "2024-12-01",
      paymentDue: "2024-12-20",
    },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  } satisfies Prisma.JsonObject;

  const onlineInquiryNavi = await prisma.navi.create({
    data: {
      status: NaviStatus.SENT,
      naviType: NaviType.ONLINE_INQUIRY,
      ownerUserId: comparisonListing.sellerUserId,
      buyerUserId: "dev_user_1",
      listingId: comparisonListing.id,
      listingSnapshot: buildListingSnapshot(comparisonListing),
      payload: inquiryPayload,
    },
  });

  const onlineInquiryParticipants = {
    sellerUserId: comparisonListing.sellerUserId,
    buyerUserId: "dev_user_1",
  };

  const resolveReceiverUserId = (
    senderUserId: string,
    participants: { sellerUserId: string; buyerUserId: string }
  ) => {
    if (senderUserId === participants.sellerUserId) {
      return participants.buyerUserId;
    }
    if (senderUserId === participants.buyerUserId) {
      return participants.sellerUserId;
    }
    return null;
  };

  const onlineInquiryMessages = [
    {
      naviId: onlineInquiryNavi.id,
      senderUserId: "dev_user_1",
      senderRole: MessageSenderRole.buyer,
      body: "商品の状態を確認したいです。発送希望日は12/1です。",
    },
    {
      naviId: onlineInquiryNavi.id,
      senderUserId: comparisonListing.sellerUserId,
      senderRole: MessageSenderRole.seller,
      body: "在庫ございます。送料込みの見積りをお送りします。",
    },
    {
      naviId: onlineInquiryNavi.id,
      senderUserId: "dev_user_1",
      senderRole: MessageSenderRole.buyer,
      body: "ありがとうございます。支払条件は通常通りで問題ありません。",
    },
    {
      naviId: onlineInquiryNavi.id,
      senderUserId: comparisonListing.sellerUserId,
      senderRole: MessageSenderRole.seller,
      body: "承知しました。発送準備を進めます。",
    },
  ].map((message) => ({
    ...message,
    receiverUserId: resolveReceiverUserId(message.senderUserId, onlineInquiryParticipants),
  }));

  const validOnlineInquiryMessages = onlineInquiryMessages.filter((message) => {
    if (!message.receiverUserId) {
      console.warn("Skipping message without receiverUserId", message);
      return false;
    }
    return true;
  });

  if (validOnlineInquiryMessages.length > 0) {
    await prisma.message.createMany({
      data: validOnlineInquiryMessages,
    });
  }

  const soldBundleListing = { ...bundleListing, status: ExhibitStatus.SOLD };

  const approvedPayload = buildPhoneAgreementPayload(soldBundleListing, "dev_user_1", "dev_user_3", {
    quantity: 2,
    shippingFee: 12000,
    handlingFee: 5000,
    memo: "承認済みでTrade生成済みサンプル",
    handler: "田中 担当",
  });

  const approvedNavi = await prisma.navi.create({
    data: {
      status: NaviStatus.APPROVED,
      naviType: NaviType.PHONE_AGREEMENT,
      ownerUserId: "dev_user_1",
      buyerUserId: "dev_user_3",
      listingId: bundleListing.id,
      listingSnapshot: buildListingSnapshot(soldBundleListing),
      payload: approvedPayload,
    },
  });

  const trade = await prisma.dealing.create({
    data: {
      sellerUserId: "dev_user_1",
      buyerUserId: "dev_user_3",
      status: DealingStatus.IN_PROGRESS,
      payload: buildTradePayload(soldBundleListing, "dev_user_1", "dev_user_3"),
      naviId: approvedNavi.id,
    },
  });

  await prisma.exhibit.update({
    where: { id: bundleListing.id },
    data: { status: ExhibitStatus.SOLD, isVisible: true },
  });

  return { navis: [phoneNavi, onlineInquiryNavi, approvedNavi], trades: [trade] };
}

async function main() {
  const seedMode = process.env.SEED_MODE;

  if (!seedMode || !ALLOWED_SEED_MODES.includes(seedMode as (typeof ALLOWED_SEED_MODES)[number])) {
    console.log(
      `Skipping user seeding. Set SEED_MODE to one of ${ALLOWED_SEED_MODES.join(", ")} (current: ${
        seedMode ?? "undefined"
      }).`
    );
    return;
  }

  console.log(`Running seed for mode: ${seedMode}`);
  await clearExistingData();
  await seedUsers();
  await seedStorageLocations();
  await seedMakersAndModels();
  await seedBuyerShippingAddresses();
  const listings = await seedListings();
  const { navis, trades } = await seedNavis(listings);

  console.log(`Navi created: ${navis.length}`);
  console.log(`Trades created: ${trades.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
