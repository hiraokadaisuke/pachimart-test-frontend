import { ListingStatus, PrismaClient } from "@prisma/client";

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
    storageLocation: "東京倉庫A",
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
    storageLocation: "大阪保管庫",
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
    storageLocation: "福岡倉庫",
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
    storageLocation: "名古屋デポ",
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
    storageLocation: "札幌ヤード",
    shippingFeeCount: 2,
    handlingFeeCount: 2,
    allowPartial: true,
    note: "取引済み",
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
