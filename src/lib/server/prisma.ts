import {
  ExhibitStatus,
  ExhibitType,
  Prisma,
  PrismaClient,
  RemovalStatus,
  NaviStatus,
  NaviType,
  DealingStatus,
  OnlineInquiryStatus,
  LedgerEntryCategory,
  LedgerEntryKind,
  LedgerEntrySource,
} from "@prisma/client";

import { DEV_USERS } from "@/lib/dev-user/users";

type InMemoryNavi = {
  id: number;
  status: NaviStatus;
  naviType: NaviType;
  ownerUserId: string;
  buyerUserId: string | null;
  listingId: string | null;
  listingSnapshot: Prisma.JsonValue | null;
  payload: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryTrade = {
  id: number;
  sellerUserId: string;
  buyerUserId: string;
  status: DealingStatus;
  paymentAt: Date | null;
  completedAt: Date | null;
  canceledAt: Date | null;
  payload: Prisma.JsonValue | null;
  naviId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryMessage = {
  id: number;
  naviId: number;
  senderUserId: string;
  senderRole: "buyer" | "seller";
  body: string;
  createdAt: Date;
};

type InMemoryOnlineInquiry = {
  id: string;
  listingId: string;
  buyerUserId: string;
  sellerUserId: string;
  body: string;
  buyerMemo: string | null;
  makerName: string | null;
  productName: string | null;
  unitPriceExclTax: number;
  quantity: number;
  taxRate: number;
  shippingFee: number;
  handlingFee: number;
  shippingAddress: string | null;
  contactPerson: string | null;
  desiredShipDate: string | null;
  desiredPaymentDate: string | null;
  status: OnlineInquiryStatus;
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryListing = {
  id: string;
  sellerUserId: string;
  status: ExhibitStatus;
  isVisible: boolean;
  type: ExhibitType;
  kind: string;
  maker: string | null;
  machineName: string | null;
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
  storageLocationSnapshot: Prisma.JsonValue | null;
  shippingFeeCount: number;
  handlingFeeCount: number;
  allowPartial: boolean;
  note: string | null;
  storageLocationRecord?: InMemoryStorageLocation | null;
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryStorageLocation = {
  id: string;
  ownerUserId: string;
  name: string;
  address: string | null;
  postalCode: string | null;
  prefecture: string | null;
  city: string | null;
  addressLine: string | null;
  handlingFeePerUnit: number | null;
  shippingFeesByRegion: Prisma.JsonValue | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryWarehouse = {
  id: string;
  ownerUserId: string;
  name: string;
  address: string | null;
  category: "self" | "other";
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryBuyerShippingAddress = {
  id: string;
  ownerUserId: string;
  label: string | null;
  companyName: string | null;
  postalCode: string | null;
  prefecture: string | null;
  city: string | null;
  addressLine: string | null;
  tel: string | null;
  contactName: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryMaker = {
  id: string;
  name: string;
};

type InMemoryLedgerEntry = {
  id: string;
  userId: string;
  tradeId: number | null;
  category: LedgerEntryCategory;
  kind: LedgerEntryKind;
  amountYen: number;
  occurredAt: Date;
  counterpartyName?: string | null;
  makerName?: string | null;
  itemName?: string | null;
  memo?: string | null;
  balanceAfterYen?: number | null;
  breakdown?: Prisma.JsonValue | null;
  createdByUserId: string;
  source: LedgerEntrySource;
  tradeStatusAtCreation?: DealingStatus | null;
  dedupeKey: string;
};

type InMemoryMachineModel = {
  id: string;
  makerId: string;
  type: ExhibitType;
  name: string;
};

type InMemoryPrisma = {
  navi: {
    findMany: () => Promise<InMemoryNavi[]>;
    create: ({ data }: { data: Partial<InMemoryNavi> }) => Promise<InMemoryNavi>;
    findUnique: ({ where }: { where: { id?: number | null } }) => Promise<InMemoryNavi | null>;
    update: ({ where, data }: { where: { id?: number | null }; data: Partial<InMemoryNavi> }) => Promise<InMemoryNavi>;
  };
  onlineInquiry: {
    findMany: ({
      where,
      orderBy,
    }?: {
      where?: { buyerUserId?: string | null; sellerUserId?: string | null };
      orderBy?: { updatedAt?: "asc" | "desc"; createdAt?: "asc" | "desc" }[];
    }) => Promise<InMemoryOnlineInquiry[]>;
    findUnique: ({ where }: { where: { id?: string | null } }) => Promise<InMemoryOnlineInquiry | null>;
    create: ({ data }: { data: Partial<InMemoryOnlineInquiry> }) => Promise<InMemoryOnlineInquiry>;
    update: ({
      where,
      data,
    }: {
      where: { id?: string | null };
      data: Partial<InMemoryOnlineInquiry>;
    }) => Promise<InMemoryOnlineInquiry>;
  };
  dealing: {
    findMany: ({ where }?: { where?: { status?: DealingStatus } }) => Promise<(InMemoryTrade & {
      navi: InMemoryNavi | null;
      sellerUser: { id: string; companyName: string } | null;
      buyerUser: { id: string; companyName: string } | null;
    })[]>;
    create: ({ data }: { data: Partial<InMemoryTrade> }) => Promise<
      InMemoryTrade & {
        navi: InMemoryNavi | null;
        sellerUser: { id: string; companyName: string } | null;
        buyerUser: { id: string; companyName: string } | null;
      }
    >;
    findUnique: ({ where }: { where: { id?: number | null; naviId?: number | null } }) => Promise<
      | (InMemoryTrade & {
          navi: InMemoryNavi | null;
          sellerUser: { id: string; companyName: string } | null;
          buyerUser: { id: string; companyName: string } | null;
        })
      | null
    >;
    update: ({
      where,
      data,
      include,
    }: {
      where: { id?: number | null };
      data: Prisma.DealingUpdateInput;
      include?: { navi?: boolean; sellerUser?: boolean; buyerUser?: boolean };
    }) => Promise<
      InMemoryTrade & {
        navi: InMemoryNavi | null;
        sellerUser: { id: string; companyName: string } | null;
        buyerUser: { id: string; companyName: string } | null;
      }
    >;
    upsert: ({
      where,
      create,
      update,
      select,
    }: {
      where: { id?: number | null; naviId?: number | null };
      create: Partial<InMemoryTrade>;
      update: Partial<InMemoryTrade>;
      select?: { id?: boolean };
    }) => Promise<
      | { id: number }
      | (InMemoryTrade & {
          navi: InMemoryNavi | null;
          sellerUser: { id: string; companyName: string } | null;
          buyerUser: { id: string; companyName: string } | null;
        })
    >;
  };
  user: {
    findMany: ({
      where,
    }?: {
      where?: { id?: { in?: string[] }; devUserId?: { in?: string[] } };
    }) => Promise<{
      id: string;
      devUserId?: string | null;
      companyName: string;
      contactName?: string;
      address?: string;
      tel?: string;
    }[]>;
    findUnique: ({
      where,
    }: {
      where: { id?: string | null; devUserId?: string | null };
    }) => Promise<{
      id: string;
      devUserId?: string | null;
      companyName: string;
      contactName?: string;
      address?: string;
      tel?: string;
    } | null>;
    create: ({
      data,
    }: {
      data: Partial<{
        id: string;
        devUserId?: string | null;
        companyName: string;
        contactName?: string;
        address?: string;
        tel?: string;
      }>;
    }) => Promise<{
      id: string;
      devUserId?: string | null;
      companyName: string;
      contactName?: string;
      address?: string;
      tel?: string;
    }>;
  };
  message: {
    findMany: ({ where, orderBy }?: { where?: { naviId?: number | null }; orderBy?: { createdAt?: "asc" | "desc" } }) =>
      Promise<InMemoryMessage[]>;
    create: ({ data }: { data: Partial<InMemoryMessage> }) => Promise<InMemoryMessage>;
  };
  exhibit: {
    findMany: (args?: {
      where?: { sellerUserId?: string; status?: ExhibitStatus | { in: ExhibitStatus[] }; isVisible?: boolean };
      orderBy?: { updatedAt?: "asc" | "desc" };
    }) => Promise<InMemoryListing[]>;
    findUnique: ({
      where,
      include,
    }: {
      where: { id?: string | null };
      include?: { storageLocationRecord?: boolean };
    }) => Promise<InMemoryListing | null>;
    create: ({ data }: { data: Partial<InMemoryListing> }) => Promise<InMemoryListing>;
    update: ({ where, data }: { where: { id?: string | null }; data: Partial<InMemoryListing> }) => Promise<InMemoryListing>;
  };
  storageLocation: {
    findMany: ({
      where,
      orderBy,
    }: {
      where?: { ownerUserId?: string; isActive?: boolean };
      orderBy?: { updatedAt?: "asc" | "desc" };
    }) => Promise<InMemoryStorageLocation[]>;
    findFirst: ({ where }: { where?: { id?: string | null; ownerUserId?: string; isActive?: boolean } }) =>
      Promise<InMemoryStorageLocation | null>;
    findUnique: ({ where }: { where: { id?: string | null } }) => Promise<InMemoryStorageLocation | null>;
    create: ({ data }: { data: Partial<InMemoryStorageLocation> }) => Promise<InMemoryStorageLocation>;
    update: ({ where, data }: { where: { id?: string | null }; data: Partial<InMemoryStorageLocation> }) =>
      Promise<InMemoryStorageLocation>;
    upsert: ({
      where,
      create,
      update,
    }: {
      where: { id?: string | null };
      create: Partial<InMemoryStorageLocation>;
      update: Partial<InMemoryStorageLocation>;
    }) => Promise<InMemoryStorageLocation>;
  };
  warehouse: {
    findMany: ({
      where,
      orderBy,
    }?: {
      where?: { ownerUserId?: string };
      orderBy?: { createdAt?: "asc" | "desc" } | { name?: "asc" | "desc" };
    }) => Promise<InMemoryWarehouse[]>;
    create: ({ data }: { data: Partial<InMemoryWarehouse> }) => Promise<InMemoryWarehouse>;
  };
  buyerShippingAddress: {
    findMany: ({
      where,
      orderBy,
    }?: {
      where?: { ownerUserId?: string; isActive?: boolean };
      orderBy?: { updatedAt?: "asc" | "desc" };
    }) => Promise<InMemoryBuyerShippingAddress[]>;
    create: ({ data }: { data: Partial<InMemoryBuyerShippingAddress> }) => Promise<InMemoryBuyerShippingAddress>;
  };
  maker: {
    findMany: (args?: {
      where?: { machineModels?: { some?: { type?: ExhibitType } } };
      orderBy?: { name?: "asc" | "desc" };
    }) => Promise<InMemoryMaker[]>;
  };
  machineModel: {
    findMany: (args?: { where?: { type?: ExhibitType }; orderBy?: { name?: "asc" | "desc" } }) =>
      Promise<InMemoryMachineModel[]>;
  };
  ledgerEntry: {
    create: ({ data }: { data: Prisma.LedgerEntryCreateInput }) => Promise<InMemoryLedgerEntry>;
    findMany: ({
      where,
      orderBy,
    }?: {
      where?: { userId?: string };
      orderBy?: { occurredAt?: "asc" | "desc" };
    }) => Promise<InMemoryLedgerEntry[]>;
    findFirst: ({
      where,
    }: {
      where?: {
        userId?: string;
        tradeId?: number | null;
        category?: LedgerEntryCategory;
        kind?: LedgerEntryKind;
      };
    }) => Promise<InMemoryLedgerEntry | null>;
  };
  $transaction: <T>(callback: (client: InMemoryPrisma) => Promise<T> | T) => Promise<T>;
  $queryRaw: (...params: unknown[]) => Promise<void>;
};

const buildInMemoryPrisma = (): InMemoryPrisma => {
  const userDirectory = Object.values(DEV_USERS).reduce<
    Record<
      string,
      { id: string; devUserId?: string | null; companyName: string; contactName?: string; address?: string; tel?: string }
    >
  >((acc, user) => {
    acc[user.id] = {
      id: user.id,
      devUserId: user.id,
      companyName: user.companyName,
      contactName: user.contactName,
      address: user.address,
      tel: user.tel,
    };
    return acc;
  }, {});

  const navis: InMemoryNavi[] = [];
  const trades: InMemoryTrade[] = [];
  const messages: InMemoryMessage[] = [];
  const onlineInquiries: InMemoryOnlineInquiry[] = [];
  const exhibits: InMemoryListing[] = [];
  const storageLocations: InMemoryStorageLocation[] = [];
  const now = () => new Date();
  const warehouses: InMemoryWarehouse[] = [
    {
      id: "warehouse_dev_user_1_tokyo",
      ownerUserId: DEV_USERS.A.id,
      name: "東京第1倉庫",
      address: "東京都千代田区丸の内1-1-1",
      category: "self",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "warehouse_dev_user_1_osaka",
      ownerUserId: DEV_USERS.A.id,
      name: "大阪倉庫",
      address: "大阪府大阪市北区梅田1-2-3",
      category: "self",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "warehouse_dev_user_2_fukuoka",
      ownerUserId: DEV_USERS.B.id,
      name: "福岡倉庫",
      address: "福岡県福岡市中央区天神2-4-5",
      category: "self",
      createdAt: now(),
      updatedAt: now(),
    },
  ];
  const buyerShippingAddresses: InMemoryBuyerShippingAddress[] = [];
  const ledgerEntries: InMemoryLedgerEntry[] = [];
  const makers: InMemoryMaker[] = [
    { id: "maker_sanyo", name: "三洋" },
    { id: "maker_heiwa", name: "平和" },
    { id: "maker_sankyo", name: "三共" },
    { id: "maker_sammy", name: "サミー" },
    { id: "maker_olympia", name: "オリンピア" },
    { id: "maker_kyoraku", name: "京楽" },
    { id: "maker_kitadenshi", name: "北電子" },
    { id: "maker_universal", name: "ユニバーサル" },
  ];
  const machineModels: InMemoryMachineModel[] = [
    { id: "model_sanyo_p_1", makerId: "maker_sanyo", type: ExhibitType.PACHINKO, name: "P海物語5" },
    { id: "model_sanyo_s_1", makerId: "maker_sanyo", type: ExhibitType.SLOT, name: "Sスーパー海物語" },
    { id: "model_heiwa_p_1", makerId: "maker_heiwa", type: ExhibitType.PACHINKO, name: "Pルパン三世2000カラット" },
    { id: "model_heiwa_s_1", makerId: "maker_heiwa", type: ExhibitType.SLOT, name: "Sルパン三世Lupin the Last" },
    { id: "model_sankyo_p_1", makerId: "maker_sankyo", type: ExhibitType.PACHINKO, name: "Pフィーバーからくりサーカス" },
    { id: "model_sankyo_s_1", makerId: "maker_sankyo", type: ExhibitType.SLOT, name: "Sからくりサーカス" },
    { id: "model_sammy_p_1", makerId: "maker_sammy", type: ExhibitType.PACHINKO, name: "P北斗の拳9" },
    { id: "model_sammy_s_1", makerId: "maker_sammy", type: ExhibitType.SLOT, name: "S北斗の拳" },
    {
      id: "model_olympia_p_premium",
      makerId: "maker_olympia",
      type: ExhibitType.PACHINKO,
      name: "Pプレミアムうまい棒",
    },
    {
      id: "model_olympia_s_lupin",
      makerId: "maker_olympia",
      type: ExhibitType.SLOT,
      name: "Sルパン三世ルパン The First",
    },
    { id: "model_kyoraku_p_nogizaka", makerId: "maker_kyoraku", type: ExhibitType.PACHINKO, name: "P乃木坂46" },
    { id: "model_kyoraku_s_nogizaka", makerId: "maker_kyoraku", type: ExhibitType.SLOT, name: "S乃木坂46" },
    { id: "model_kitadenshi_s_aim", makerId: "maker_kitadenshi", type: ExhibitType.SLOT, name: "SアイムジャグラーEX" },
    { id: "model_universal_s_basilisk", makerId: "maker_universal", type: ExhibitType.SLOT, name: "Sバジリスク絆2" },
    { id: "model_universal_p_madomagi", makerId: "maker_universal", type: ExhibitType.PACHINKO, name: "P魔法少女まどか☆マギカ" },
  ];
  let naviSeq = 1;
  let tradeSeq = 1;
  let messageSeq = 1;
  let onlineInquirySeq = 1;
  let exhibitSeq = 1;
  let storageLocationSeq = 1;
  let buyerShippingAddressSeq = 1;

  const attachRelations = (trade: InMemoryTrade) => ({
    ...trade,
    navi: trade.naviId ? navis.find((navi) => navi.id === trade.naviId) ?? null : null,
    sellerUser: userDirectory[trade.sellerUserId] ?? null,
    buyerUser: userDirectory[trade.buyerUserId] ?? null,
  });

  const upsertTrade = (
    where: { id?: number | null; naviId?: number | null },
    create: Partial<InMemoryTrade>,
    update: Partial<InMemoryTrade>
  ) => {
    const targetIdx = trades.findIndex(
      (trade) =>
        ((where.id !== undefined && where.id !== null && trade.id === where.id) ||
          (where.naviId !== undefined && trade.naviId === where.naviId))
    );

    if (targetIdx >= 0) {
      trades[targetIdx] = {
        ...trades[targetIdx],
        ...update,
        updatedAt: now(),
      } as InMemoryTrade;
      return trades[targetIdx];
    }

    const record: InMemoryTrade = {
      id: tradeSeq++,
      sellerUserId: String(create.sellerUserId ?? ""),
      buyerUserId: String(create.buyerUserId ?? ""),
      status: (create.status as DealingStatus) ?? DealingStatus.PAYMENT_REQUIRED,
      paymentAt: (create as { paymentAt?: Date | null }).paymentAt ?? null,
      completedAt: (create as { completedAt?: Date | null }).completedAt ?? null,
      canceledAt: (create as { canceledAt?: Date | null }).canceledAt ?? null,
      payload: (create.payload as Prisma.JsonValue | null) ?? null,
      naviId: (create.naviId as number | null) ?? null,
      createdAt: now(),
      updatedAt: now(),
    };

    trades.push(record);
    return record;
  };

  return {
    navi: {
      findMany: async () => [...navis].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      create: async ({ data }: { data: Partial<InMemoryNavi> }) => {
        const record: InMemoryNavi = {
          id: naviSeq++,
          status: (data.status as NaviStatus) ?? NaviStatus.DRAFT,
          naviType: (data.naviType as NaviType) ?? NaviType.PHONE_AGREEMENT,
          ownerUserId: String(data.ownerUserId ?? ""),
          buyerUserId: (data.buyerUserId as string | null) ?? null,
          listingId: (data.listingId as string | null | undefined) ?? null,
          listingSnapshot: (data.listingSnapshot as Prisma.JsonValue | null | undefined) ?? null,
          payload: (data.payload as Prisma.JsonValue | null) ?? null,
          createdAt: now(),
          updatedAt: now(),
        };

        navis.push(record);
        return record;
      },
      findUnique: async ({ where }: { where: { id?: number | null } }) => {
        const id = Number(where.id ?? 0);
        const found = navis.find((trade) => trade.id === id);
        return found ?? null;
      },
      update: async ({ where, data }: { where: { id?: number | null }; data: Partial<InMemoryNavi> }) => {
        const id = Number(where.id ?? 0);
        const idx = navis.findIndex((trade) => trade.id === id);

        if (idx < 0) {
          throw new Error("Trade not found");
        }

        const updated: InMemoryNavi = {
          ...navis[idx],
          ...data,
          status: (data.status as NaviStatus | undefined) ?? navis[idx].status,
          naviType: (data.naviType as NaviType | undefined) ?? navis[idx].naviType,
          buyerUserId: (data.buyerUserId as string | null | undefined) ?? navis[idx].buyerUserId,
          listingId: (data.listingId as string | null | undefined) ?? navis[idx].listingId,
          listingSnapshot:
            (data.listingSnapshot as Prisma.JsonValue | null | undefined) ?? navis[idx].listingSnapshot,
          payload: (data.payload as Prisma.JsonValue | null | undefined) ?? navis[idx].payload,
          updatedAt: now(),
        };

        navis[idx] = updated;
        return updated;
      },
    },
    onlineInquiry: {
      findMany: async ({ where, orderBy } = {}) => {
        const filtered = onlineInquiries.filter((inquiry) => {
          if (where?.buyerUserId && inquiry.buyerUserId !== where.buyerUserId) return false;
          if (where?.sellerUserId && inquiry.sellerUserId !== where.sellerUserId) return false;
          return true;
        });

        const sorters = orderBy?.length
          ? orderBy
          : ([{ updatedAt: "desc" }, { createdAt: "desc" }] as {
              updatedAt?: "asc" | "desc";
              createdAt?: "asc" | "desc";
            }[]);

        const sorted = [...filtered].sort((a, b) => {
          for (const order of sorters) {
            if (order.updatedAt) {
              const diff = a.updatedAt.getTime() - b.updatedAt.getTime();
              if (diff !== 0) return order.updatedAt === "desc" ? -diff : diff;
            }
            if (order.createdAt) {
              const diff = a.createdAt.getTime() - b.createdAt.getTime();
              if (diff !== 0) return order.createdAt === "desc" ? -diff : diff;
            }
          }
          return 0;
        });

        return sorted.map((record) => ({ ...record }));
      },
      findUnique: async ({ where }: { where: { id?: string | null } }) => {
        const id = where.id ?? "";
        const found = onlineInquiries.find((inquiry) => inquiry.id === id);
        return found ? { ...found } : null;
      },
      create: async ({ data }: { data: Partial<InMemoryOnlineInquiry> }) => {
        const nowDate = now();
        const record: InMemoryOnlineInquiry = {
          id: String(data.id ?? `online_inquiry_${onlineInquirySeq++}`),
          listingId: String(data.listingId ?? ""),
          buyerUserId: String(data.buyerUserId ?? ""),
          sellerUserId: String(data.sellerUserId ?? ""),
          body: String(data.body ?? ""),
          buyerMemo: (data.buyerMemo as string | null | undefined) ?? null,
          makerName: (data.makerName as string | null | undefined) ?? null,
          productName: (data.productName as string | null | undefined) ?? null,
          unitPriceExclTax: Number.isFinite(Number(data.unitPriceExclTax))
            ? Number(data.unitPriceExclTax)
            : 0,
          quantity: Number.isFinite(Number(data.quantity)) ? Number(data.quantity) : 0,
          taxRate: Number.isFinite(Number(data.taxRate)) ? Number(data.taxRate) : 0.1,
          shippingFee: Number.isFinite(Number(data.shippingFee)) ? Number(data.shippingFee) : 0,
          handlingFee: Number.isFinite(Number(data.handlingFee)) ? Number(data.handlingFee) : 0,
          shippingAddress: (data.shippingAddress as string | null | undefined) ?? null,
          contactPerson: (data.contactPerson as string | null | undefined) ?? null,
          desiredShipDate: (data.desiredShipDate as string | null | undefined) ?? null,
          desiredPaymentDate: (data.desiredPaymentDate as string | null | undefined) ?? null,
          status:
            (data.status as OnlineInquiryStatus | undefined) ??
            OnlineInquiryStatus.INQUIRY_RESPONSE_REQUIRED,
          createdAt: nowDate,
          updatedAt: nowDate,
        };

        onlineInquiries.push(record);
        return { ...record };
      },
      update: async ({ where, data }: { where: { id?: string | null }; data: Partial<InMemoryOnlineInquiry> }) => {
        const id = where.id ?? "";
        const idx = onlineInquiries.findIndex((inquiry) => inquiry.id === id);

        if (idx < 0) {
          throw new Error("Online inquiry not found");
        }

        const updated: InMemoryOnlineInquiry = {
          ...onlineInquiries[idx],
          ...data,
          buyerMemo: (data.buyerMemo as string | null | undefined) ?? onlineInquiries[idx].buyerMemo,
          makerName: (data.makerName as string | null | undefined) ?? onlineInquiries[idx].makerName,
          productName:
            (data.productName as string | null | undefined) ?? onlineInquiries[idx].productName,
          unitPriceExclTax: Number.isFinite(Number(data.unitPriceExclTax))
            ? Number(data.unitPriceExclTax)
            : onlineInquiries[idx].unitPriceExclTax,
          taxRate: Number.isFinite(Number(data.taxRate))
            ? Number(data.taxRate)
            : onlineInquiries[idx].taxRate,
          shippingFee: Number.isFinite(Number(data.shippingFee))
            ? Number(data.shippingFee)
            : onlineInquiries[idx].shippingFee,
          handlingFee: Number.isFinite(Number(data.handlingFee))
            ? Number(data.handlingFee)
            : onlineInquiries[idx].handlingFee,
          status:
            (data.status as OnlineInquiryStatus | undefined) ?? onlineInquiries[idx].status,
          updatedAt: now(),
        };

        onlineInquiries[idx] = updated;
        return { ...updated };
      },
    },
    dealing: {
      findMany: async ({ where }: { where?: { status?: DealingStatus } } = {}) => {
        const filtered = trades.filter((trade) => (where?.status ? trade.status === where.status : true));
        return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map(attachRelations);
      },
      create: async ({ data }: { data: Partial<InMemoryTrade> }) => {
        const record = upsertTrade({ id: null, naviId: data.naviId as number | null | undefined }, data, {});
        return attachRelations(record);
      },
      findUnique: async ({ where }: { where: { id?: number | null; naviId?: number | null } }) => {
        const id = Number(where.id ?? 0);
        const naviId = where.naviId ?? null;
        const found = trades.find((trade) => trade.id === id || (naviId !== null && trade.naviId === naviId));
        return found ? attachRelations(found) : null;
      },
      update: async ({ where, data }) => {
        const id = Number(where.id ?? 0);
        const idx = trades.findIndex((trade) => trade.id === id);

        if (idx < 0) {
          throw new Error("Trade not found");
        }

        const resolveUpdateValue = <T>(value: unknown): T | undefined => {
          if (value && typeof value === "object" && "set" in (value as Record<string, unknown>)) {
            return (value as { set?: T }).set;
          }

          return value as T | undefined;
        };

        const updated: InMemoryTrade = {
          ...trades[idx],
          status: resolveUpdateValue<DealingStatus>(data.status) ?? trades[idx].status,
          paymentAt: resolveUpdateValue<Date | null>(data.paymentAt) ?? trades[idx].paymentAt,
          completedAt: resolveUpdateValue<Date | null>(data.completedAt) ?? trades[idx].completedAt,
          canceledAt: resolveUpdateValue<Date | null>(data.canceledAt) ?? trades[idx].canceledAt,
          payload: resolveUpdateValue<Prisma.JsonValue | null>(data.payload) ?? trades[idx].payload,
          updatedAt: now(),
        };

        trades[idx] = updated;
        return attachRelations(updated);
      },
      upsert: async ({
        where,
        create,
        update,
        select,
      }: {
        where: { id?: number | null; naviId?: number | null };
        create: Partial<InMemoryTrade>;
        update: Partial<InMemoryTrade>;
        select?: { id?: boolean };
      }) => {
        const record = upsertTrade(where, create, update);
        const result = attachRelations(record);

        if (select?.id) {
          return { id: result.id };
        }

        return result;
      },
    },
    user: {
      findMany: async ({ where } = {}) => {
        const ids = where?.id?.in ?? null;
        const devUserIds = where?.devUserId?.in ?? null;
        const records = (() => {
          if (ids) {
            return ids.map((id) => userDirectory[id]).filter(Boolean);
          }
          if (devUserIds) {
            return Object.values(userDirectory).filter((user) => user.devUserId && devUserIds.includes(user.devUserId));
          }
          return Object.values(userDirectory);
        })();
        return records.map((user) => ({ ...user }));
      },
      findUnique: async ({ where }: { where: { id?: string | null; devUserId?: string | null } }) => {
        const id = where.id ?? "";
        if (id) {
          const found = userDirectory[id];
          if (found) return { ...found };
        }

        const devUserId = where.devUserId ?? "";
        if (!devUserId) return null;
        const found = Object.values(userDirectory).find((user) => user.devUserId === devUserId);
        return found ? { ...found } : null;
      },
      create: async ({
        data,
      }: {
        data: Partial<{
          id: string;
          devUserId?: string | null;
          companyName: string;
          contactName?: string;
          address?: string;
          tel?: string;
        }>;
      }) => {
        const id = String(data.id ?? "");
        if (!id) {
          throw new Error("User id is required");
        }

        const record = {
          id,
          devUserId: data.devUserId ?? undefined,
          companyName: String(data.companyName ?? ""),
          contactName: data.contactName ?? undefined,
          address: data.address ?? undefined,
          tel: data.tel ?? undefined,
        };

        userDirectory[id] = record;
        return { ...record };
      },
    },
    message: {
      findMany: async ({
        where,
        orderBy,
      }: { where?: { naviId?: number | null }; orderBy?: { createdAt?: "asc" | "desc" } } = {}) => {
        const filtered = messages.filter((message) =>
          where?.naviId ? message.naviId === where.naviId : true
        );
        const sorted = filtered.sort((a, b) => {
          const order = orderBy?.createdAt === "desc" ? -1 : 1;
          return (a.createdAt.getTime() - b.createdAt.getTime()) * order;
        });
        return [...sorted];
      },
      create: async ({ data }: { data: Partial<InMemoryMessage> }) => {
        const record: InMemoryMessage = {
          id: messageSeq++,
          naviId: Number(data.naviId ?? 0),
          senderUserId: String(data.senderUserId ?? ""),
          senderRole: (data.senderRole as "buyer" | "seller" | undefined) ?? "buyer",
          body: String(data.body ?? ""),
          createdAt: now(),
        };

        messages.push(record);
        return record;
      },
    },
    exhibit: {
      findMany: async ({
        where,
        orderBy,
      }: {
        where?: { sellerUserId?: string; status?: ExhibitStatus | { in: ExhibitStatus[] }; isVisible?: boolean };
        orderBy?: { updatedAt?: "asc" | "desc" };
      } = {}) => {
        const filtered = exhibits.filter((exhibit) => {
          const matchesSeller = where?.sellerUserId ? exhibit.sellerUserId === where.sellerUserId : true;
          const matchesStatus = (() => {
            if (!where?.status) return true;
            if (typeof where.status === "object" && "in" in where.status) {
              return where.status.in?.includes(exhibit.status) ?? false;
            }
            return exhibit.status === where.status;
          })();
          const matchesVisibility =
            where?.isVisible === undefined ? true : exhibit.isVisible === where.isVisible;
          return matchesSeller && matchesStatus && matchesVisibility;
        });

        const sorted = filtered.sort((a, b) => {
          const order = orderBy?.updatedAt === "asc" ? 1 : -1;
          return (a.updatedAt.getTime() - b.updatedAt.getTime()) * order;
        });

        return sorted.map((exhibit) => ({ ...exhibit }));
      },
      findUnique: async ({
        where,
        include,
      }: {
        where: { id?: string | null };
        include?: { storageLocationRecord?: boolean };
      }) => {
        const id = where.id ?? null;
        if (!id) return null;

        const found = exhibits.find((exhibit) => exhibit.id === id) ?? null;
        if (!found) return null;

        const storageLocationRecord = include?.storageLocationRecord
          ? storageLocations.find((location) => location.id === found.storageLocationId) ?? null
          : undefined;

        return { ...found, storageLocationRecord };
      },
      create: async ({ data }: { data: Partial<InMemoryListing> }) => {
        const nowDate = now();
        const record: InMemoryListing = {
          id: data.id ?? `listing_${exhibitSeq++}`,
          sellerUserId: String(data.sellerUserId ?? ""),
          status: (data.status as ExhibitStatus | undefined) ?? ExhibitStatus.DRAFT,
          isVisible: (data.isVisible as boolean | undefined) ?? true,
          type: (data.type as ExhibitType | undefined) ?? ExhibitType.PACHINKO,
          kind: String(data.kind ?? ""),
          maker: (data.maker as string | null | undefined) ?? null,
          machineName: (data.machineName as string | null | undefined) ?? null,
          quantity: Number.isFinite(Number(data.quantity)) ? Number(data.quantity) : 0,
          unitPriceExclTax: data.unitPriceExclTax === null || data.unitPriceExclTax === undefined
            ? null
            : Number(data.unitPriceExclTax),
          isNegotiable: Boolean(data.isNegotiable),
          removalStatus: (data.removalStatus as RemovalStatus | undefined) ?? RemovalStatus.SCHEDULED,
          removalDate:
            data.removalDate === undefined || data.removalDate === null
              ? null
              : new Date(data.removalDate as Date),
          hasNailSheet: Boolean(data.hasNailSheet),
          hasManual: Boolean(data.hasManual),
          pickupAvailable: Boolean(data.pickupAvailable),
          storageLocation: String(data.storageLocation ?? ""),
          storageLocationId: String(data.storageLocationId ?? ""),
          storageLocationSnapshot: (data.storageLocationSnapshot as Prisma.JsonValue | null | undefined) ?? null,
          shippingFeeCount: Number.isFinite(Number(data.shippingFeeCount)) ? Number(data.shippingFeeCount) : 0,
          handlingFeeCount: Number.isFinite(Number(data.handlingFeeCount)) ? Number(data.handlingFeeCount) : 0,
          allowPartial: Boolean(data.allowPartial),
          note: (data.note as string | null | undefined) ?? null,
          createdAt: nowDate,
          updatedAt: nowDate,
        };

        exhibits.push(record);
        return { ...record };
      },
      update: async ({ where, data }: { where: { id?: string | null }; data: Partial<InMemoryListing> }) => {
        const id = where.id ?? null;
        if (!id) {
          throw new Error("Listing id is required");
        }

        const idx = exhibits.findIndex((exhibit) => exhibit.id === id);
        if (idx < 0) {
          throw new Error("Listing not found");
        }

        const updated: InMemoryListing = {
          ...exhibits[idx],
          ...data,
          status: (data.status as ExhibitStatus | undefined) ?? exhibits[idx].status,
          isVisible: (data.isVisible as boolean | undefined) ?? exhibits[idx].isVisible,
          type: (data.type as ExhibitType | undefined) ?? exhibits[idx].type,
          kind: (data.kind as string | undefined) ?? exhibits[idx].kind,
          maker: (data.maker as string | null | undefined) ?? exhibits[idx].maker,
          machineName: (data.machineName as string | null | undefined) ?? exhibits[idx].machineName,
          quantity: Number.isFinite(Number(data.quantity)) ? Number(data.quantity) : exhibits[idx].quantity,
          unitPriceExclTax:
            data.unitPriceExclTax === undefined
              ? exhibits[idx].unitPriceExclTax
              : data.unitPriceExclTax === null
                ? null
                : Number(data.unitPriceExclTax),
          isNegotiable: (data.isNegotiable as boolean | undefined) ?? exhibits[idx].isNegotiable,
          removalStatus: (data.removalStatus as RemovalStatus | undefined) ?? exhibits[idx].removalStatus,
          removalDate:
            data.removalDate === undefined
              ? exhibits[idx].removalDate
              : data.removalDate === null
                ? null
                : new Date(data.removalDate as Date),
          hasNailSheet: (data.hasNailSheet as boolean | undefined) ?? exhibits[idx].hasNailSheet,
          hasManual: (data.hasManual as boolean | undefined) ?? exhibits[idx].hasManual,
          pickupAvailable: (data.pickupAvailable as boolean | undefined) ?? exhibits[idx].pickupAvailable,
          storageLocation: (data.storageLocation as string | undefined) ?? exhibits[idx].storageLocation,
          storageLocationId: String(
            data.storageLocationId === undefined ? exhibits[idx].storageLocationId : data.storageLocationId
          ),
          storageLocationSnapshot:
            (data.storageLocationSnapshot as Prisma.JsonValue | null | undefined) ??
            exhibits[idx].storageLocationSnapshot,
          shippingFeeCount: Number.isFinite(Number(data.shippingFeeCount))
            ? Number(data.shippingFeeCount)
            : exhibits[idx].shippingFeeCount,
          handlingFeeCount: Number.isFinite(Number(data.handlingFeeCount))
            ? Number(data.handlingFeeCount)
            : exhibits[idx].handlingFeeCount,
          allowPartial: (data.allowPartial as boolean | undefined) ?? exhibits[idx].allowPartial,
          note: (data.note as string | null | undefined) ?? exhibits[idx].note,
          updatedAt: now(),
        };

        exhibits[idx] = updated;
        return { ...updated };
      },
    },
    storageLocation: {
      findMany: async ({
        where,
        orderBy,
      }: {
        where?: { ownerUserId?: string; isActive?: boolean };
        orderBy?: { updatedAt?: "asc" | "desc" };
      } = {}) => {
        const filtered = storageLocations.filter((location) => {
          const matchesOwner = where?.ownerUserId ? location.ownerUserId === where.ownerUserId : true;
          const matchesActive = where?.isActive === undefined ? true : location.isActive === where.isActive;
          return matchesOwner && matchesActive;
        });
        const sorted = filtered.sort((a, b) => {
          const order = orderBy?.updatedAt === "asc" ? 1 : -1;
          return (a.updatedAt.getTime() - b.updatedAt.getTime()) * order;
        });
        return sorted.map((location) => ({ ...location }));
      },
      findFirst: async ({ where = {} }: { where?: { id?: string | null; ownerUserId?: string; isActive?: boolean } } = {}) => {
        const filtered = storageLocations.filter((location) => {
          const matchesId = where.id ? location.id === where.id : true;
          const matchesOwner = where.ownerUserId ? location.ownerUserId === where.ownerUserId : true;
          const matchesActive = where.isActive === undefined ? true : location.isActive === where.isActive;
          return matchesId && matchesOwner && matchesActive;
        });

        const found = filtered[0] ?? null;
        return found ? { ...found } : null;
      },
      findUnique: async ({ where }: { where: { id?: string | null } }) => {
        const id = where.id ?? null;
        if (!id) return null;

        const found = storageLocations.find((location) => location.id === id) ?? null;
        return found ? { ...found } : null;
      },
      create: async ({ data }: { data: Partial<InMemoryStorageLocation> }) => {
        const nowDate = now();
        const record: InMemoryStorageLocation = {
          id: String(data.id ?? `storage_location_${storageLocationSeq++}`),
          ownerUserId: String(data.ownerUserId ?? ""),
          name: String(data.name ?? ""),
          address: (data.address as string | null | undefined) ?? null,
          postalCode: (data.postalCode as string | null | undefined) ?? null,
          prefecture: (data.prefecture as string | null | undefined) ?? null,
          city: (data.city as string | null | undefined) ?? null,
          addressLine: (data.addressLine as string | null | undefined) ?? null,
          handlingFeePerUnit:
            data.handlingFeePerUnit === undefined
              ? null
              : data.handlingFeePerUnit === null
                ? null
                : Number(data.handlingFeePerUnit),
          shippingFeesByRegion: (data.shippingFeesByRegion as Prisma.JsonValue | null | undefined) ?? null,
          isActive: typeof data.isActive === "boolean" ? data.isActive : true,
          createdAt: nowDate,
          updatedAt: nowDate,
        };

        storageLocations.push(record);
        return { ...record };
      },
      update: async ({ where, data }: { where: { id?: string | null }; data: Partial<InMemoryStorageLocation> }) => {
        const id = where.id ?? null;
        if (!id) {
          throw new Error("Storage location id is required");
        }

        const idx = storageLocations.findIndex((location) => location.id === id);
        if (idx < 0) {
          throw new Error("Storage location not found");
        }

        const updated: InMemoryStorageLocation = {
          ...storageLocations[idx],
          ...data,
          name: String(data.name ?? storageLocations[idx].name),
          address: (data.address as string | null | undefined) ?? storageLocations[idx].address,
          postalCode: (data.postalCode as string | null | undefined) ?? storageLocations[idx].postalCode,
          prefecture: (data.prefecture as string | null | undefined) ?? storageLocations[idx].prefecture,
          city: (data.city as string | null | undefined) ?? storageLocations[idx].city,
          addressLine: (data.addressLine as string | null | undefined) ?? storageLocations[idx].addressLine,
          handlingFeePerUnit:
            data.handlingFeePerUnit === undefined
              ? storageLocations[idx].handlingFeePerUnit
              : data.handlingFeePerUnit === null
                ? null
                : Number(data.handlingFeePerUnit),
          shippingFeesByRegion:
            (data.shippingFeesByRegion as Prisma.JsonValue | null | undefined) ??
            storageLocations[idx].shippingFeesByRegion,
          isActive: typeof data.isActive === "boolean" ? data.isActive : storageLocations[idx].isActive,
          updatedAt: now(),
        };

        storageLocations[idx] = updated;
        return { ...updated };
      },
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { id?: string | null };
        create: Partial<InMemoryStorageLocation>;
        update: Partial<InMemoryStorageLocation>;
      }) => {
        const id = where.id ?? null;
        if (id) {
          const idx = storageLocations.findIndex((location) => location.id === id);
          if (idx >= 0) {
            const updated: InMemoryStorageLocation = {
              ...storageLocations[idx],
              ...update,
              name: String(update.name ?? storageLocations[idx].name),
              address: (update.address as string | null | undefined) ?? storageLocations[idx].address,
              postalCode: (update.postalCode as string | null | undefined) ?? storageLocations[idx].postalCode,
              prefecture:
                (update.prefecture as string | null | undefined) ?? storageLocations[idx].prefecture,
              city: (update.city as string | null | undefined) ?? storageLocations[idx].city,
              addressLine:
                (update.addressLine as string | null | undefined) ?? storageLocations[idx].addressLine,
              handlingFeePerUnit:
                update.handlingFeePerUnit === undefined
                  ? storageLocations[idx].handlingFeePerUnit
                  : update.handlingFeePerUnit === null
                    ? null
                    : Number(update.handlingFeePerUnit),
              shippingFeesByRegion:
                (update.shippingFeesByRegion as Prisma.JsonValue | null | undefined) ??
                storageLocations[idx].shippingFeesByRegion,
              isActive: typeof update.isActive === "boolean" ? update.isActive : storageLocations[idx].isActive,
              updatedAt: now(),
            };
            storageLocations[idx] = updated;
            return { ...updated };
          }
        }

        const record: InMemoryStorageLocation = {
          id: String(create.id ?? `storage_location_${storageLocationSeq++}`),
          ownerUserId: String(create.ownerUserId ?? ""),
          name: String(create.name ?? ""),
          address: (create.address as string | null | undefined) ?? null,
          postalCode: (create.postalCode as string | null | undefined) ?? null,
          prefecture: (create.prefecture as string | null | undefined) ?? null,
          city: (create.city as string | null | undefined) ?? null,
          addressLine: (create.addressLine as string | null | undefined) ?? null,
          handlingFeePerUnit:
            create.handlingFeePerUnit === undefined
              ? null
              : create.handlingFeePerUnit === null
                ? null
                : Number(create.handlingFeePerUnit),
          shippingFeesByRegion: (create.shippingFeesByRegion as Prisma.JsonValue | null | undefined) ?? null,
          isActive: typeof create.isActive === "boolean" ? create.isActive : true,
          createdAt: now(),
          updatedAt: now(),
        };

        storageLocations.push(record);
        return { ...record };
      },
    },
    warehouse: {
      findMany: async ({ where, orderBy } = {}) => {
        const filtered = warehouses.filter((warehouse) =>
          where?.ownerUserId ? warehouse.ownerUserId === where.ownerUserId : true
        );
        const sorted = [...filtered].sort((a, b) => {
          if (orderBy && "name" in orderBy) {
            const order = orderBy.name === "desc" ? -1 : 1;
            return a.name.localeCompare(b.name, "ja") * order;
          }
          if (orderBy && "createdAt" in orderBy) {
            const order = orderBy.createdAt === "desc" ? -1 : 1;
            return (a.createdAt.getTime() - b.createdAt.getTime()) * order;
          }
          return a.createdAt.getTime() - b.createdAt.getTime();
        });
        return sorted.map((warehouse) => ({ ...warehouse }));
      },
      create: async ({ data }: { data: Partial<InMemoryWarehouse> }) => {
        const nowDate = now();
        const record: InMemoryWarehouse = {
          id: String(data.id ?? `warehouse_${warehouses.length + 1}`),
          ownerUserId: String(data.ownerUserId ?? ""),
          name: String(data.name ?? ""),
          address: (data.address as string | null | undefined) ?? null,
          category: (data.category as "self" | "other" | undefined) ?? "self",
          createdAt: nowDate,
          updatedAt: nowDate,
        };
        warehouses.push(record);
        return { ...record };
      },
    },
    buyerShippingAddress: {
      findMany: async ({
        where,
        orderBy,
      }: {
        where?: { ownerUserId?: string; isActive?: boolean };
        orderBy?: { updatedAt?: "asc" | "desc" };
      } = {}) => {
        const filtered = buyerShippingAddresses.filter((address) => {
          const matchesOwner = where?.ownerUserId ? address.ownerUserId === where.ownerUserId : true;
          const matchesActive =
            where?.isActive === undefined ? true : address.isActive === where.isActive;
          return matchesOwner && matchesActive;
        });
        const sorted = filtered.sort((a, b) => {
          const order = orderBy?.updatedAt === "asc" ? 1 : -1;
          return (a.updatedAt.getTime() - b.updatedAt.getTime()) * order;
        });
        return sorted.map((address) => ({ ...address }));
      },
      create: async ({ data }: { data: Partial<InMemoryBuyerShippingAddress> }) => {
        const nowDate = now();
        const record: InMemoryBuyerShippingAddress = {
          id: data.id ?? `buyer_shipping_address_${buyerShippingAddressSeq++}`,
          ownerUserId: String(data.ownerUserId ?? ""),
          label: (data.label as string | null | undefined) ?? null,
          companyName: (data.companyName as string | null | undefined) ?? null,
          postalCode: (data.postalCode as string | null | undefined) ?? null,
          prefecture: (data.prefecture as string | null | undefined) ?? null,
          city: (data.city as string | null | undefined) ?? null,
          addressLine: (data.addressLine as string | null | undefined) ?? null,
          tel: (data.tel as string | null | undefined) ?? null,
          contactName: (data.contactName as string | null | undefined) ?? null,
          isActive: typeof data.isActive === "boolean" ? data.isActive : true,
          createdAt: nowDate,
          updatedAt: nowDate,
        };

        buyerShippingAddresses.push(record);
        return { ...record };
      },
    },
    maker: {
      findMany: async ({ where, orderBy } = {}) => {
        const filtered = makers.filter((maker) => {
          if (!where?.machineModels?.some?.type) return true;
          const type = where.machineModels.some.type;
          return machineModels.some((model) => model.makerId === maker.id && model.type === type);
        });
        const sorted = [...filtered].sort((a, b) => {
          if (orderBy?.name === "asc") return a.name.localeCompare(b.name, "ja");
          return b.name.localeCompare(a.name, "ja");
        });
        return sorted.map((maker) => ({ ...maker }));
      },
    },
    machineModel: {
      findMany: async ({ where, orderBy } = {}) => {
        const filtered = where?.type
          ? machineModels.filter((model) => model.type === where.type)
          : [...machineModels];
        const sorted = [...filtered].sort((a, b) => {
          if (orderBy?.name === "desc") return b.name.localeCompare(a.name, "ja");
          return a.name.localeCompare(b.name, "ja");
        });
        return sorted.map((model) => ({ ...model }));
      },
    },
    ledgerEntry: {
      create: async ({ data }) => {
        const record: InMemoryLedgerEntry = {
          id: data.id ?? `ledger_${ledgerEntries.length + 1}`,
          userId: String(data.userId ?? ""),
          tradeId: (data.tradeId as number | null | undefined) ?? null,
          category: (data.category as LedgerEntryCategory | undefined) ?? LedgerEntryCategory.PURCHASE,
          kind: (data.kind as LedgerEntryKind | undefined) ?? LedgerEntryKind.PLANNED,
          amountYen: Math.trunc(Number(data.amountYen ?? 0)),
          occurredAt: data.occurredAt instanceof Date ? data.occurredAt : new Date(),
          counterpartyName: (data.counterpartyName as string | null | undefined) ?? null,
          makerName: (data.makerName as string | null | undefined) ?? null,
          itemName: (data.itemName as string | null | undefined) ?? null,
          memo: (data.memo as string | null | undefined) ?? null,
          balanceAfterYen: (data.balanceAfterYen as number | null | undefined) ?? null,
          breakdown: (data.breakdown as Prisma.JsonValue | null | undefined) ?? null,
          createdByUserId: String((data as any).createdByUserId ?? data.userId ?? ""),
          source: (data as any).source ?? LedgerEntrySource.TRADE_STATUS_TRANSITION,
          tradeStatusAtCreation: (data as any).tradeStatusAtCreation ?? null,
          dedupeKey: String((data as any).dedupeKey ?? `ledger_${ledgerEntries.length + 1}`),
        };

        ledgerEntries.push(record);
        return { ...record };
      },
      findMany: async ({ where, orderBy } = {}) => {
        const filtered = ledgerEntries.filter((entry) => {
          if (where?.userId && entry.userId !== where.userId) return false;
          return true;
        });

        const sorted = [...filtered].sort((a, b) => {
          const order = orderBy?.occurredAt === "asc" ? 1 : -1;
          return (a.occurredAt.getTime() - b.occurredAt.getTime()) * order;
        });

        return sorted.map((entry) => ({ ...entry }));
      },
      findFirst: async ({ where } = {}) => {
        const match = ledgerEntries.find((entry) => {
          if (where?.userId && entry.userId !== where.userId) return false;
          if (where?.tradeId !== undefined && entry.tradeId !== where.tradeId) return false;
          if (where?.category && entry.category !== where.category) return false;
          if (where?.kind && entry.kind !== where.kind) return false;
          return true;
        });

        return match ? { ...match } : null;
      },
    },
    $transaction: async <T>(callback: (client: ReturnType<typeof buildInMemoryPrisma>) => Promise<T> | T): Promise<T> =>
      callback(inMemoryPrisma),
    $queryRaw: async () => {
      return Promise.resolve();
    },
  };
};

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const inMemoryPrisma = buildInMemoryPrisma();

export type InMemoryPrismaClient = typeof inMemoryPrisma;

// In production we must rely on the real database; the in-memory variant only exists for local
// preview/sandboxes where APP_DATABASE_URL is intentionally absent. The runtime switch keeps a
// single source of truth in DB-backed environments.
export const prisma: PrismaClient | typeof inMemoryPrisma =
  process.env.APP_DATABASE_URL
    ? globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      })
    : inMemoryPrisma;

if (process.env.NODE_ENV !== "production" && prisma instanceof PrismaClient) {
  globalForPrisma.prisma = prisma;
}
