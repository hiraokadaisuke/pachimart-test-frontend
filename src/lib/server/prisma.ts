import {
  ListingStatus,
  Prisma,
  PrismaClient,
  RemovalStatus,
  NaviStatus,
  NaviType,
  TradeStatus,
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
  senderRole: "buyer" | "seller";
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

type InMemoryPrisma = {
  navi: {
    findMany: () => Promise<InMemoryNavi[]>;
    create: ({ data }: { data: Partial<InMemoryNavi> }) => Promise<InMemoryNavi>;
    findUnique: ({ where }: { where: { id?: number | null } }) => Promise<InMemoryNavi | null>;
    update: ({ where, data }: { where: { id?: number | null }; data: Partial<InMemoryNavi> }) => Promise<InMemoryNavi>;
  };
  trade: {
    findMany: ({ where }?: { where?: { status?: TradeStatus } }) => Promise<(InMemoryTrade & {
      navi: InMemoryNavi | null;
      sellerUser: { id: string; companyName: string } | null;
      buyerUser: { id: string; companyName: string } | null;
    })[]>;
    findUnique: ({ where }: { where: { id?: number | null; naviId?: number | null } }) => Promise<
      | (InMemoryTrade & {
          navi: InMemoryNavi | null;
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
          navi: InMemoryNavi | null;
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
    findMany: (args?: {
      where?: { sellerUserId?: string; status?: ListingStatus | { in: ListingStatus[] }; isVisible?: boolean };
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

  const navis: InMemoryNavi[] = [];
  const trades: InMemoryTrade[] = [];
  const messages: InMemoryMessage[] = [];
  const listings: InMemoryListing[] = [];
  const storageLocations: InMemoryStorageLocation[] = [];
  const buyerShippingAddresses: InMemoryBuyerShippingAddress[] = [];
  let naviSeq = 1;
  let tradeSeq = 1;
  let messageSeq = 1;
  let listingSeq = 1;
  let storageLocationSeq = 1;
  let buyerShippingAddressSeq = 1;

  const now = () => new Date();

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
      findUnique: async ({
        where,
        include,
      }: {
        where: { id?: string | null };
        include?: { storageLocationRecord?: boolean };
      }) => {
        const id = where.id ?? null;
        if (!id) return null;

        const found = listings.find((listing) => listing.id === id) ?? null;
        if (!found) return null;

        const storageLocationRecord = include?.storageLocationRecord
          ? storageLocations.find((location) => location.id === found.storageLocationId) ?? null
          : undefined;

        return { ...found, storageLocationRecord };
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
          storageLocationId: String(data.storageLocationId ?? ""),
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
          storageLocationId: String(
            data.storageLocationId === undefined ? listings[idx].storageLocationId : data.storageLocationId
          ),
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
