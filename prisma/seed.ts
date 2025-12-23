import { PrismaClient, TradeNaviStatus, TradeStatus, type Prisma } from "@prisma/client";

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

const NAVI_PAYLOADS: Record<number, Prisma.JsonObject> = {
  1001: {
    id: "NAVI-1001",
    ownerUserId: "dev_user_1",
    status: "sent_to_buyer",
    productId: "demo-product-1",
    buyerId: "dev_user_2",
    buyerCompanyName: "株式会社かきくけこ",
    buyerContactName: "佐藤 花子",
    buyerAddress: "大阪府大阪市北区梅田1-2-3 トレードタワー 15F",
    buyerTel: "06-9876-5432",
    conditions: {
      unitPrice: 800000,
      quantity: 1,
      shippingFee: 15000,
      handlingFee: 5000,
      taxRate: 0.1,
      productName: "中古パチンコ機A",
      makerName: "デモメーカー",
      location: "東京倉庫",
      memo: "オンライン問い合わせのサンプル",
    },
    createdAt: "2024-05-01T10:00:00.000Z",
    updatedAt: "2024-05-01T10:00:00.000Z",
  },
  1002: {
    id: "NAVI-1002",
    ownerUserId: "dev_user_1",
    status: "buyer_approved",
    productId: "demo-product-2",
    buyerId: "dev_user_2",
    buyerCompanyName: "株式会社かきくけこ",
    buyerContactName: "佐藤 花子",
    buyerAddress: "大阪府大阪市北区梅田1-2-3 トレードタワー 15F",
    buyerTel: "06-9876-5432",
    conditions: {
      unitPrice: 1200000,
      quantity: 2,
      shippingFee: 30000,
      handlingFee: 10000,
      taxRate: 0.1,
      productName: "中古パチンコ機B",
      makerName: "デモメーカー",
      location: "横浜倉庫",
      machineShipmentDate: "2024-05-10",
    },
    createdAt: "2024-05-02T02:00:00.000Z",
    updatedAt: "2024-05-02T02:00:00.000Z",
  },
};

type TradeNaviSeed = {
  id: number;
  status: TradeNaviStatus;
  ownerUserId: string;
  buyerUserId: string;
  payload: Prisma.JsonObject;
};

const TRADE_NAVIS: TradeNaviSeed[] = [
  {
    id: 1001,
    status: TradeNaviStatus.SENT,
    ownerUserId: "dev_user_1",
    buyerUserId: "dev_user_2",
    payload: NAVI_PAYLOADS[1001],
  },
  {
    id: 1002,
    status: TradeNaviStatus.APPROVED,
    ownerUserId: "dev_user_1",
    buyerUserId: "dev_user_2",
    payload: NAVI_PAYLOADS[1002],
  },
];

const TRADES = [
  {
    id: 2001,
    sellerUserId: "dev_user_1",
    buyerUserId: "dev_user_2",
    status: TradeStatus.IN_PROGRESS,
    payload: NAVI_PAYLOADS[1002],
    naviId: 1002,
    createdAt: new Date("2024-05-02T03:00:00.000Z"),
  },
];

const MESSAGES = [
  {
    id: 3001,
    naviId: 1001,
    senderUserId: "dev_user_1",
    receiverUserId: "dev_user_2",
    body: "条件をまとめました。内容をご確認ください。",
    createdAt: new Date("2024-05-01T11:00:00.000Z"),
  },
  {
    id: 3002,
    naviId: 1001,
    senderUserId: "dev_user_2",
    receiverUserId: "dev_user_1",
    body: "確認しました。少し検討します。",
    createdAt: new Date("2024-05-01T12:00:00.000Z"),
  },
  {
    id: 3003,
    naviId: 1002,
    senderUserId: "dev_user_2",
    receiverUserId: "dev_user_1",
    body: "承認しました。進行をお願いします。",
    createdAt: new Date("2024-05-02T04:00:00.000Z"),
  },
  {
    id: 3004,
    naviId: 1002,
    senderUserId: "dev_user_1",
    receiverUserId: "dev_user_2",
    body: "ありがとうございます。発送準備を進めます。",
    createdAt: new Date("2024-05-02T05:00:00.000Z"),
  },
];

async function main() {
  const seedMode = process.env.SEED_MODE;
  const nodeEnv = process.env.NODE_ENV;
  const isAllowedMode = seedMode && ALLOWED_SEED_MODES.includes(seedMode as (typeof ALLOWED_SEED_MODES)[number]);

  if (nodeEnv === "production" || !isAllowedMode) {
    console.log(
      `Skipping seeding. NODE_ENV=${nodeEnv ?? "undefined"}, SEED_MODE=${seedMode ?? "undefined"}, allowed modes=${ALLOWED_SEED_MODES.join(
        ", "
      )}`
    );
    return;
  }

  console.log(`Seeding users (${USERS.length})...`);
  for (const user of USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    });
    console.log(`Upserted user ${user.id}`);
  }

  console.log(`Seeding trade navis (${TRADE_NAVIS.length})...`);
  for (const navi of TRADE_NAVIS) {
    const naviId = navi.id as unknown as Prisma.TradeNaviWhereUniqueInput["id"];
    await prisma.tradeNavi.upsert({
      where: { id: naviId },
      update: {
        status: navi.status,
        ownerUserId: navi.ownerUserId,
        buyerUserId: navi.buyerUserId,
        payload: navi.payload,
      },
      create: {
        id: naviId,
        status: navi.status,
        ownerUserId: navi.ownerUserId,
        buyerUserId: navi.buyerUserId,
        payload: navi.payload,
      },
    });
    console.log(`Upserted trade navi ${navi.id}`);
  }

  console.log(`Seeding trades (${TRADES.length})...`);
  for (const trade of TRADES) {
    await prisma.trade.upsert({
      where: { naviId: trade.naviId },
      update: {
        sellerUserId: trade.sellerUserId,
        buyerUserId: trade.buyerUserId,
        status: trade.status,
        payload: trade.payload,
      },
      create: {
        id: trade.id,
        sellerUserId: trade.sellerUserId,
        buyerUserId: trade.buyerUserId,
        status: trade.status,
        payload: trade.payload,
        naviId: trade.naviId,
        createdAt: trade.createdAt,
      },
    });
    console.log(`Upserted trade ${trade.id}`);
  }

  console.log(`Seeding messages (${MESSAGES.length})...`);
  for (const message of MESSAGES) {
    await prisma.message.upsert({
      where: { id: message.id },
      update: {
        senderUserId: message.senderUserId,
        receiverUserId: message.receiverUserId,
        body: message.body,
        naviId: message.naviId,
        createdAt: message.createdAt,
      },
      create: message,
    });
    console.log(`Upserted message ${message.id}`);
  }

  console.log("Seeding completed.");
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
