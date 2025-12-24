import {
  ListingStatus,
  Prisma,
  PrismaClient,
  RemovalStatus,
  TradeNaviStatus,
  TradeNaviType,
  TradeStatus,
} from "@prisma/client";

import { DEV_USERS } from "@/lib/dev-user/users";

type InMemoryTradeNavi = {
  id: number;
  status: TradeNaviStatus;
  naviType: TradeNaviType;
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
  status: TradeStatus;
  payload: Prisma.JsonValue | null;
  naviId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryMessage = {
  id: number;
  naviId: number;
  senderUserId: string;
  receiverUserId: string;
  body: string;
  createdAt: Date;
};

type InMemoryListing = {
  id: string;
  sellerUserId: string;
  status: ListingStatus;
  isVisible: boolean;
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
  storageLocationId: string | null;
  storageLocationSnapshot: Prisma.JsonValue | null;
  shippingFeeCount: number;
  handlingFeeCount: number;
  allowPartial: boolean;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryStorageLocation = {
  id: string;
  ownerUserId: string;
  name: string;
  address: string;
  prefecture: string | null;
  city: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryMachineStorageLocation = {
  id: string;
  ownerUserId: string;
  name: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
  handlingFeePerUnit: number;
  shippingFeesByRegion: Prisma.JsonValue;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryPrisma = {
  tradeNavi: {
    findMany: () => Promise<InMemoryTradeNavi[]>;
    create: ({ data }: { data: Partial<InMemoryTradeNavi> }) => Promise<InMemoryTradeNavi>;
    findUnique: ({ where }: { where: { id?: number | null } }) => Promise<InMemoryTradeNavi | null>;
    update: ({ where, data }: { where: { id?: number | null }; data: Partial<InMemoryTradeNavi> }) => Promise<InMemoryTradeNavi>;
  };
  trade: {
    findMany: ({ where }?: { where?: { status?: TradeStatus } }) => Promise<(InMemoryTrade & {
      navi: InMemoryTradeNavi | null;
      sellerUser: { id: string; companyName: string } | null;
      buyerUser: { id: string; companyName: string } | null;
    })[]>;
    findUnique: ({ where }: { where: { id?: number | null; naviId?: number | null } }) => Promise<
      | (InMemoryTrade & {
          navi: InMemoryTradeNavi | null;
          sellerUser: { id: string; companyName: string } | null;
          buyerUser: { id: string; companyName: string } | null;
        })
      | null
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
          navi: InMemoryTradeNavi | null;
          sellerUser: { id: string; companyName: string } | null;
          buyerUser: { id: string; companyName: string } | null;
        })
    >;
  };
  message: {
    findMany: ({ where, orderBy }?: { where?: { naviId?: number | null }; orderBy?: { createdAt?: "asc" | "desc" } }) =>
      Promise<InMemoryMessage[]>;
    create: ({ data }: { data: Partial<InMemoryMessage> }) => Promise<InMemoryMessage>;
  };
  listing: {
    findMany: ({
      where,
      orderBy,
    }?: {
      where?: { sellerUserId?: string; status?: ListingStatus | { in: ListingStatus[] }; isVisible?: boolean };
      orderBy?: { updatedAt?: "asc" | "desc" };
    }) => Promise<InMemoryListing[]>;
    findUnique: ({ where }: { where: { id?: string | null } }) => Promise<InMemoryListing | null>;
    create: ({ data }: { data: Partial<InMemoryListing> }) => Promise<InMemoryListing>;
    update: ({ where, data }: { where: { id?: string | null }; data: Partial<InMemoryListing> }) => Promise<InMemoryListing>;
  };
  storageLocation: {
    findMany: ({
      where,
      orderBy,
    }: {
      where?: { ownerUserId?: string };
      orderBy?: { updatedAt?: "asc" | "desc" };
    }) => Promise<InMemoryStorageLocation[]>;
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
  machineStorageLocation: {
    findMany: ({
      where,
      orderBy,
    }: {
      where?: { ownerUserId?: string; isActive?: boolean };
      orderBy?: { updatedAt?: "asc" | "desc" };
    }) => Promise<InMemoryMachineStorageLocation[]>;
    findUnique: ({ where }: { where: { id?: string | null } }) => Promise<InMemoryMachineStorageLocation | null>;
    create: ({
      data,
    }: {
      data: Partial<InMemoryMachineStorageLocation>;
    }) => Promise<InMemoryMachineStorageLocation>;
    update: ({
      where,
      data,
    }: {
      where: { id?: string | null };
      data: Partial<InMemoryMachineStorageLocation>;
    }) => Promise<InMemoryMachineStorageLocation>;
  };
  $transaction: <T>(callback: (client: InMemoryPrisma) => Promise<T> | T) => Promise<T>;
  $queryRaw: (...params: unknown[]) => Promise<void>;
};

const buildInMemoryPrisma = (): InMemoryPrisma => {
  const userDirectory = Object.values(DEV_USERS).reduce<Record<string, { id: string; companyName: string }>>(
    (acc, user) => {
      acc[user.id] = { id: user.id, companyName: user.companyName };
      return acc;
    },
    {}
  );

  const tradeNavis: InMemoryTradeNavi[] = [];
  const trades: InMemoryTrade[] = [];
  const messages: InMemoryMessage[] = [];
  const listings: InMemoryListing[] = [];
  const storageLocations: InMemoryStorageLocation[] = [];
  const machineStorageLocations: InMemoryMachineStorageLocation[] = [];
  let tradeNaviSeq = 1;
  let tradeSeq = 1;
  let messageSeq = 1;
  let listingSeq = 1;
  let storageLocationSeq = 1;
  let machineStorageLocationSeq = 1;

  const now = () => new Date();

  const attachRelations = (trade: InMemoryTrade) => ({
    ...trade,
    navi: trade.naviId ? tradeNavis.find((navi) => navi.id === trade.naviId) ?? null : null,
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
      status: (create.status as TradeStatus) ?? TradeStatus.IN_PROGRESS,
      payload: (create.payload as Prisma.JsonValue | null) ?? null,
      naviId: (create.naviId as number | null) ?? null,
      createdAt: now(),
      updatedAt: now(),
    };

    trades.push(record);
    return record;
  };

  return {
    tradeNavi: {
      findMany: async () => [...tradeNavis].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      create: async ({ data }: { data: Partial<InMemoryTradeNavi> }) => {
        const record: InMemoryTradeNavi = {
          id: tradeNaviSeq++,
          status: (data.status as TradeNaviStatus) ?? TradeNaviStatus.DRAFT,
          naviType: (data.naviType as TradeNaviType) ?? TradeNaviType.PHONE_AGREEMENT,
          ownerUserId: String(data.ownerUserId ?? ""),
          buyerUserId: (data.buyerUserId as string | null) ?? null,
          listingId: (data.listingId as string | null | undefined) ?? null,
          listingSnapshot: (data.listingSnapshot as Prisma.JsonValue | null | undefined) ?? null,
          payload: (data.payload as Prisma.JsonValue | null) ?? null,
          createdAt: now(),
          updatedAt: now(),
        };

        tradeNavis.push(record);
        return record;
      },
      findUnique: async ({ where }: { where: { id?: number | null } }) => {
        const id = Number(where.id ?? 0);
        const found = tradeNavis.find((trade) => trade.id === id);
        return found ?? null;
      },
      update: async ({ where, data }: { where: { id?: number | null }; data: Partial<InMemoryTradeNavi> }) => {
        const id = Number(where.id ?? 0);
        const idx = tradeNavis.findIndex((trade) => trade.id === id);

        if (idx < 0) {
          throw new Error("Trade not found");
        }

        const updated: InMemoryTradeNavi = {
          ...tradeNavis[idx],
          ...data,
          status: (data.status as TradeNaviStatus | undefined) ?? tradeNavis[idx].status,
          naviType: (data.naviType as TradeNaviType | undefined) ?? tradeNavis[idx].naviType,
          buyerUserId: (data.buyerUserId as string | null | undefined) ?? tradeNavis[idx].buyerUserId,
          listingId: (data.listingId as string | null | undefined) ?? tradeNavis[idx].listingId,
          listingSnapshot:
            (data.listingSnapshot as Prisma.JsonValue | null | undefined) ?? tradeNavis[idx].listingSnapshot,
          payload: (data.payload as Prisma.JsonValue | null | undefined) ?? tradeNavis[idx].payload,
          updatedAt: now(),
        };

        tradeNavis[idx] = updated;
        return updated;
      },
    },
    trade: {
      findMany: async ({ where }: { where?: { status?: TradeStatus } } = {}) => {
        const filtered = trades.filter((trade) => (where?.status ? trade.status === where.status : true));
        return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map(attachRelations);
      },
      findUnique: async ({ where }: { where: { id?: number | null; naviId?: number | null } }) => {
        const id = Number(where.id ?? 0);
        const naviId = where.naviId ?? null;
        const found = trades.find((trade) => trade.id === id || (naviId !== null && trade.naviId === naviId));
        return found ? attachRelations(found) : null;
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
    message: {
      findMany: async ({ where, orderBy }: { where?: { naviId?: number | null }; orderBy?: { createdAt?: "asc" | "desc" } } = {}) => {
        const filtered = messages.filter((message) => (where?.naviId ? message.naviId === where.naviId : true));
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
          receiverUserId: String(data.receiverUserId ?? ""),
          body: String(data.body ?? ""),
          createdAt: now(),
        };

        messages.push(record);
        return record;
      },
    },
    listing: {
      findMany: async ({
        where,
        orderBy,
      }: {
        where?: { sellerUserId?: string; status?: ListingStatus | { in: ListingStatus[] }; isVisible?: boolean };
        orderBy?: { updatedAt?: "asc" | "desc" };
      } = {}) => {
        const filtered = listings.filter((listing) => {
          const matchesSeller = where?.sellerUserId ? listing.sellerUserId === where.sellerUserId : true;
          const matchesStatus = (() => {
            if (!where?.status) return true;
            if (typeof where.status === "object" && "in" in where.status) {
              return where.status.in?.includes(listing.status) ?? false;
            }
            return listing.status === where.status;
          })();
          const matchesVisibility =
            where?.isVisible === undefined ? true : listing.isVisible === where.isVisible;
          return matchesSeller && matchesStatus && matchesVisibility;
        });

        const sorted = filtered.sort((a, b) => {
          const order = orderBy?.updatedAt === "asc" ? 1 : -1;
          return (a.updatedAt.getTime() - b.updatedAt.getTime()) * order;
        });

        return sorted.map((listing) => ({ ...listing }));
      },
      findUnique: async ({ where }: { where: { id?: string | null } }) => {
        const id = where.id ?? null;
        if (!id) return null;

        const found = listings.find((listing) => listing.id === id) ?? null;
        return found ? { ...found } : null;
      },
      create: async ({ data }: { data: Partial<InMemoryListing> }) => {
        const nowDate = now();
        const record: InMemoryListing = {
          id: data.id ?? `listing_${listingSeq++}`,
          sellerUserId: String(data.sellerUserId ?? ""),
          status: (data.status as ListingStatus | undefined) ?? ListingStatus.DRAFT,
          isVisible: (data.isVisible as boolean | undefined) ?? true,
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
          storageLocationId: (data.storageLocationId as string | null | undefined) ?? null,
          storageLocationSnapshot: (data.storageLocationSnapshot as Prisma.JsonValue | null | undefined) ?? null,
          shippingFeeCount: Number.isFinite(Number(data.shippingFeeCount)) ? Number(data.shippingFeeCount) : 0,
          handlingFeeCount: Number.isFinite(Number(data.handlingFeeCount)) ? Number(data.handlingFeeCount) : 0,
          allowPartial: Boolean(data.allowPartial),
          note: (data.note as string | null | undefined) ?? null,
          createdAt: nowDate,
          updatedAt: nowDate,
        };

        listings.push(record);
        return { ...record };
      },
      update: async ({ where, data }: { where: { id?: string | null }; data: Partial<InMemoryListing> }) => {
        const id = where.id ?? null;
        if (!id) {
          throw new Error("Listing id is required");
        }

        const idx = listings.findIndex((listing) => listing.id === id);
        if (idx < 0) {
          throw new Error("Listing not found");
        }

        const updated: InMemoryListing = {
          ...listings[idx],
          ...data,
          status: (data.status as ListingStatus | undefined) ?? listings[idx].status,
          isVisible: (data.isVisible as boolean | undefined) ?? listings[idx].isVisible,
          kind: (data.kind as string | undefined) ?? listings[idx].kind,
          maker: (data.maker as string | null | undefined) ?? listings[idx].maker,
          machineName: (data.machineName as string | null | undefined) ?? listings[idx].machineName,
          quantity: Number.isFinite(Number(data.quantity)) ? Number(data.quantity) : listings[idx].quantity,
          unitPriceExclTax:
            data.unitPriceExclTax === undefined
              ? listings[idx].unitPriceExclTax
              : data.unitPriceExclTax === null
                ? null
                : Number(data.unitPriceExclTax),
          isNegotiable: (data.isNegotiable as boolean | undefined) ?? listings[idx].isNegotiable,
          removalStatus: (data.removalStatus as RemovalStatus | undefined) ?? listings[idx].removalStatus,
          removalDate:
            data.removalDate === undefined
              ? listings[idx].removalDate
              : data.removalDate === null
                ? null
                : new Date(data.removalDate as Date),
          hasNailSheet: (data.hasNailSheet as boolean | undefined) ?? listings[idx].hasNailSheet,
          hasManual: (data.hasManual as boolean | undefined) ?? listings[idx].hasManual,
          pickupAvailable: (data.pickupAvailable as boolean | undefined) ?? listings[idx].pickupAvailable,
          storageLocation: (data.storageLocation as string | undefined) ?? listings[idx].storageLocation,
          storageLocationId:
            (data.storageLocationId as string | null | undefined) ?? listings[idx].storageLocationId,
          storageLocationSnapshot:
            (data.storageLocationSnapshot as Prisma.JsonValue | null | undefined) ??
            listings[idx].storageLocationSnapshot,
          shippingFeeCount: Number.isFinite(Number(data.shippingFeeCount))
            ? Number(data.shippingFeeCount)
            : listings[idx].shippingFeeCount,
          handlingFeeCount: Number.isFinite(Number(data.handlingFeeCount))
            ? Number(data.handlingFeeCount)
            : listings[idx].handlingFeeCount,
          allowPartial: (data.allowPartial as boolean | undefined) ?? listings[idx].allowPartial,
          note: (data.note as string | null | undefined) ?? listings[idx].note,
          updatedAt: now(),
        };

        listings[idx] = updated;
        return { ...updated };
      },
    },
    storageLocation: {
      findMany: async ({
        where,
        orderBy,
      }: {
        where?: { ownerUserId?: string };
        orderBy?: { updatedAt?: "asc" | "desc" };
      } = {}) => {
        const filtered = storageLocations.filter((location) =>
          where?.ownerUserId ? location.ownerUserId === where.ownerUserId : true
        );
        const sorted = filtered.sort((a, b) => {
          const order = orderBy?.updatedAt === "asc" ? 1 : -1;
          return (a.updatedAt.getTime() - b.updatedAt.getTime()) * order;
        });
        return sorted.map((location) => ({ ...location }));
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
              address: String(update.address ?? storageLocations[idx].address),
              prefecture:
                (update.prefecture as string | null | undefined) ?? storageLocations[idx].prefecture,
              city: (update.city as string | null | undefined) ?? storageLocations[idx].city,
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
          address: String(create.address ?? ""),
          prefecture: (create.prefecture as string | null | undefined) ?? null,
          city: (create.city as string | null | undefined) ?? null,
          createdAt: now(),
          updatedAt: now(),
        };

        storageLocations.push(record);
        return { ...record };
      },
    },
    machineStorageLocation: {
      findMany: async ({
        where,
        orderBy,
      }: {
        where?: { ownerUserId?: string; isActive?: boolean };
        orderBy?: { updatedAt?: "asc" | "desc" };
      } = {}) => {
        const filtered = machineStorageLocations.filter((location) => {
          const matchesOwner = where?.ownerUserId ? location.ownerUserId === where.ownerUserId : true;
          const matchesActive =
            where?.isActive === undefined ? true : location.isActive === where.isActive;
          return matchesOwner && matchesActive;
        });
        const sorted = filtered.sort((a, b) => {
          const order = orderBy?.updatedAt === "asc" ? 1 : -1;
          return (a.updatedAt.getTime() - b.updatedAt.getTime()) * order;
        });
        return sorted.map((location) => ({ ...location }));
      },
      findUnique: async ({ where }: { where: { id?: string | null } }) => {
        const id = where.id ?? null;
        if (!id) return null;
        const found = machineStorageLocations.find((location) => location.id === id) ?? null;
        return found ? { ...found } : null;
      },
      create: async ({ data }: { data: Partial<InMemoryMachineStorageLocation> }) => {
        const nowDate = now();
        const record: InMemoryMachineStorageLocation = {
          id: String(data.id ?? `machine_storage_location_${machineStorageLocationSeq++}`),
          ownerUserId: String(data.ownerUserId ?? ""),
          name: String(data.name ?? ""),
          postalCode: String(data.postalCode ?? ""),
          prefecture: String(data.prefecture ?? ""),
          city: String(data.city ?? ""),
          addressLine: String(data.addressLine ?? ""),
          handlingFeePerUnit: Number.isFinite(Number(data.handlingFeePerUnit))
            ? Number(data.handlingFeePerUnit)
            : 0,
          shippingFeesByRegion: (data.shippingFeesByRegion as Prisma.JsonValue | undefined) ?? {},
          isActive: Boolean(data.isActive ?? true),
          createdAt: nowDate,
          updatedAt: nowDate,
        };

        machineStorageLocations.push(record);
        return { ...record };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id?: string | null };
        data: Partial<InMemoryMachineStorageLocation>;
      }) => {
        const id = where.id ?? null;
        if (!id) {
          throw new Error("Machine storage location id is required");
        }

        const idx = machineStorageLocations.findIndex((location) => location.id === id);
        if (idx < 0) {
          throw new Error("Machine storage location not found");
        }

        const updated: InMemoryMachineStorageLocation = {
          ...machineStorageLocations[idx],
          ...data,
          name: String(data.name ?? machineStorageLocations[idx].name),
          postalCode: String(data.postalCode ?? machineStorageLocations[idx].postalCode),
          prefecture: String(data.prefecture ?? machineStorageLocations[idx].prefecture),
          city: String(data.city ?? machineStorageLocations[idx].city),
          addressLine: String(data.addressLine ?? machineStorageLocations[idx].addressLine),
          handlingFeePerUnit: Number.isFinite(Number(data.handlingFeePerUnit))
            ? Number(data.handlingFeePerUnit)
            : machineStorageLocations[idx].handlingFeePerUnit,
          shippingFeesByRegion:
            (data.shippingFeesByRegion as Prisma.JsonValue | undefined) ??
            machineStorageLocations[idx].shippingFeesByRegion,
          isActive: typeof data.isActive === "boolean" ? data.isActive : machineStorageLocations[idx].isActive,
          updatedAt: now(),
        };

        machineStorageLocations[idx] = updated;
        return { ...updated };
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

export const prisma: PrismaClient | typeof inMemoryPrisma =
  process.env.PRISMA_DATABASE_URL
    ? globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      })
    : inMemoryPrisma;

if (process.env.NODE_ENV !== "production" && prisma instanceof PrismaClient) {
  globalForPrisma.prisma = prisma;
}
