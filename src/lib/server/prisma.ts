import { Prisma, PrismaClient, TradeNaviStatus, TradeStatus } from "@prisma/client";

import { DEV_USERS } from "@/lib/dev-user/users";

type InMemoryTradeNavi = {
  id: number;
  status: TradeNaviStatus;
  ownerUserId: string;
  buyerUserId: string | null;
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
  let tradeNaviSeq = 1;
  let tradeSeq = 1;
  let messageSeq = 1;

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
          ownerUserId: String(data.ownerUserId ?? ""),
          buyerUserId: (data.buyerUserId as string | null) ?? null,
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
          buyerUserId: (data.buyerUserId as string | null | undefined) ?? tradeNavis[idx].buyerUserId,
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
