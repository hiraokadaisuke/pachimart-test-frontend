import { ListingStatus, PrismaClient, RemovalStatus } from "@prisma/client";

const prisma = new PrismaClient();

const ALLOWED_SEED_MODES = ["preview", "dev"] as const;

const USERS = [
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

const LISTINGS = [
  {
    id: "listing_dev_1",
    sellerUserId: "dev_user_1",
    status: ListingStatus.PUBLISHED,
    isVisible: true,
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
    storageLocationSnapshot: {
      id: "machine_storage_dev_user_1_1",
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
    shippingFeeCount: 1,
    handlingFeeCount: 1,
    allowPartial: false,
    note: "即日出荷可",
  },
  {
    id: "listing_dev_2",
    sellerUserId: "dev_user_1",
    status: ListingStatus.DRAFT,
    isVisible: true,
    kind: "S",
    maker: "メーカーB",
    machineName: "モデルB-2",
    quantity: 2,
    unitPriceExclTax: 90000,
    isNegotiable: false,
    removalStatus: RemovalStatus.SCHEDULED,
    removalDate: new Date("2024-11-01"),
    hasNailSheet: false,
    hasManual: true,
    pickupAvailable: false,
    storageLocation: "埼玉メンテ倉庫",
    storageLocationId: "machine_storage_dev_user_1_2",
    storageLocationSnapshot: {
      id: "machine_storage_dev_user_1_2",
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
    shippingFeeCount: 2,
    handlingFeeCount: 1,
    allowPartial: true,
    note: "点検済み",
  },
  {
    id: "listing_dev_3",
    sellerUserId: "dev_user_2",
    status: ListingStatus.PUBLISHED,
    isVisible: true,
    kind: "P",
    maker: "メーカーC",
    machineName: "モデルC-3",
    quantity: 5,
    unitPriceExclTax: 150000,
    isNegotiable: false,
    removalStatus: RemovalStatus.SCHEDULED,
    removalDate: new Date("2024-10-20"),
    hasNailSheet: true,
    hasManual: false,
    pickupAvailable: true,
    storageLocation: "福岡出庫センター",
    storageLocationId: "machine_storage_dev_user_2_1",
    storageLocationSnapshot: {
      id: "machine_storage_dev_user_2_1",
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
    shippingFeeCount: 1,
    handlingFeeCount: 2,
    allowPartial: true,
    note: null,
  },
  {
    id: "listing_dev_4",
    sellerUserId: "dev_user_3",
    status: ListingStatus.PUBLISHED,
    isVisible: true,
    kind: "S",
    maker: "メーカーD",
    machineName: "モデルD-4",
    quantity: 1,
    unitPriceExclTax: null,
    isNegotiable: true,
    removalStatus: RemovalStatus.REMOVED,
    removalDate: null,
    hasNailSheet: false,
    hasManual: false,
    pickupAvailable: true,
    storageLocation: "名古屋サービス倉庫",
    storageLocationId: "machine_storage_dev_user_3_1",
    storageLocationSnapshot: {
      id: "machine_storage_dev_user_3_1",
      name: "名古屋サービス倉庫",
      postalCode: "450-0002",
      prefecture: "愛知県",
      city: "名古屋市中村区",
      addressLine: "名駅3-5-7",
      handlingFeePerUnit: 4800,
      shippingFeesByRegion: {
        hokkaido: 18500,
        tohokuNorth: 15000,
        tohokuSouth: 14000,
        kanto: 10000,
        chubu: 7000,
        kinki: 9000,
        chugoku: 12000,
        shikoku: 13000,
        kitakyushu: 14000,
        minamikyushu: 15000,
        okinawa: 22500,
      },
    },
    shippingFeeCount: 1,
    handlingFeeCount: 1,
    allowPartial: false,
    note: "応相談価格",
  },
  {
    id: "listing_dev_5",
    sellerUserId: "dev_user_4",
    status: ListingStatus.SOLD,
    isVisible: false,
    kind: "P",
    maker: "メーカーE",
    machineName: "モデルE-5",
    quantity: 4,
    unitPriceExclTax: 80000,
    isNegotiable: false,
    removalStatus: RemovalStatus.SCHEDULED,
    removalDate: new Date("2025-01-10"),
    hasNailSheet: true,
    hasManual: true,
    pickupAvailable: false,
    storageLocation: "札幌北倉庫",
    storageLocationId: "machine_storage_dev_user_4_1",
    storageLocationSnapshot: {
      id: "machine_storage_dev_user_4_1",
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
    shippingFeeCount: 2,
    handlingFeeCount: 2,
    allowPartial: true,
    note: "取引済み",
  },
];

const STORAGE_LOCATIONS = [
  {
    id: "location_dev_user_1_1",
    ownerUserId: "dev_user_1",
    name: "東京倉庫A",
    address: "東京都江東区青海2-7-4",
    prefecture: "東京都",
    city: "江東区",
  },
  {
    id: "location_dev_user_1_2",
    ownerUserId: "dev_user_1",
    name: "大阪保管庫",
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
    id: "location_dev_user_2_2",
    ownerUserId: "dev_user_2",
    name: "博多センター",
    address: "福岡県福岡市博多区博多駅前1-2-3",
    prefecture: "福岡県",
    city: "福岡市博多区",
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
    id: "location_dev_user_3_2",
    ownerUserId: "dev_user_3",
    name: "栄ストック",
    address: "愛知県名古屋市中区栄2-3-4",
    prefecture: "愛知県",
    city: "名古屋市中区",
  },
  {
    id: "location_dev_user_4_1",
    ownerUserId: "dev_user_4",
    name: "札幌ヤード",
    address: "北海道札幌市中央区大通西1-1-1",
    prefecture: "北海道",
    city: "札幌市中央区",
  },
  {
    id: "location_dev_user_4_2",
    ownerUserId: "dev_user_4",
    name: "苫小牧倉庫",
    address: "北海道苫小牧市若草町4-5-6",
    prefecture: "北海道",
    city: "苫小牧市",
  },
  {
    id: "location_dev_user_5_1",
    ownerUserId: "dev_user_5",
    name: "札幌プレビュー",
    address: "北海道札幌市中央区大通西1-1-1",
    prefecture: "北海道",
    city: "札幌市中央区",
  },
  {
    id: "location_dev_user_5_2",
    ownerUserId: "dev_user_5",
    name: "小樽ストック",
    address: "北海道小樽市稲穂1-2-3",
    prefecture: "北海道",
    city: "小樽市",
  },
];

const MACHINE_STORAGE_LOCATIONS = [
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
    isActive: true,
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
    isActive: true,
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
    isActive: true,
  },
  {
    id: "machine_storage_dev_user_3_1",
    ownerUserId: "dev_user_3",
    name: "名古屋サービス倉庫",
    postalCode: "450-0002",
    prefecture: "愛知県",
    city: "名古屋市中村区",
    addressLine: "名駅3-5-7",
    handlingFeePerUnit: 4800,
    shippingFeesByRegion: {
      hokkaido: 18500,
      tohokuNorth: 15000,
      tohokuSouth: 14000,
      kanto: 10000,
      chubu: 7000,
      kinki: 9000,
      chugoku: 12000,
      shikoku: 13000,
      kitakyushu: 14000,
      minamikyushu: 15000,
      okinawa: 22500,
    },
    isActive: true,
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
    isActive: true,
  },
  {
    id: "machine_storage_dev_user_5_1",
    ownerUserId: "dev_user_5",
    name: "小樽物流倉庫",
    postalCode: "047-0032",
    prefecture: "北海道",
    city: "小樽市",
    addressLine: "稲穂1-2-3",
    handlingFeePerUnit: 5100,
    shippingFeesByRegion: {
      hokkaido: 6500,
      tohokuNorth: 14500,
      tohokuSouth: 13500,
      kanto: 16500,
      chubu: 17500,
      kinki: 18500,
      chugoku: 19500,
      shikoku: 20000,
      kitakyushu: 20500,
      minamikyushu: 21500,
      okinawa: 24500,
    },
    isActive: true,
  },
];

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

  console.log(`Seeding ${USERS.length} users (mode: ${seedMode})...`);
  for (const user of USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    });
    console.log(`Upserted user ${user.id}`);
  }
  console.log("User seeding completed.");

  console.log(`Seeding ${STORAGE_LOCATIONS.length} storage locations (mode: ${seedMode})...`);
  for (const location of STORAGE_LOCATIONS) {
    await prisma.storageLocation.upsert({
      where: { id: location.id },
      update: location,
      create: location,
    });
    console.log(`Upserted storage location ${location.id}`);
  }
  console.log("Storage location seeding completed.");

  console.log(
    `Seeding ${MACHINE_STORAGE_LOCATIONS.length} machine storage locations (mode: ${seedMode})...`
  );
  for (const location of MACHINE_STORAGE_LOCATIONS) {
    await prisma.machineStorageLocation.upsert({
      where: { id: location.id },
      update: location,
      create: location,
    });
    console.log(`Upserted machine storage location ${location.id}`);
  }
  console.log("Machine storage location seeding completed.");

  console.log(`Seeding ${LISTINGS.length} listings (mode: ${seedMode})...`);
  for (const listing of LISTINGS) {
    await prisma.listing.upsert({
      where: { id: listing.id },
      update: listing,
      create: listing,
    });
    console.log(`Upserted listing ${listing.id}`);
  }
  console.log("Listing seeding completed.");
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
