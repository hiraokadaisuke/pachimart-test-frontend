import { NextResponse } from "next/server";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { getCurrentUserId } from "@/lib/server/currentUser";

type OutboundCandidate = {
  id: string;
  sourceId: string | null;
  sourceType: string | null;
  note: string | null;
  status: string;
  createdAt: Date;
  buyerName: string | null;
  modelNameSnapshot: string;
};

const DEMO_NOTE_KEYWORDS = ["PM-DEMO", "パチマート成約"];
const PRIORITY_STATUSES = new Set(["PLANNED", "出庫待ち", "未発送"]);

const includesDemoKeyword = (note: string | null) => DEMO_NOTE_KEYWORDS.some((keyword) => note?.includes(keyword));

const isSalesInvoiceDerived = (row: OutboundCandidate) =>
  row.sourceType === "SALES_INVOICE" ||
  row.sourceId?.startsWith("S-") ||
  row.note?.includes("販売伝票") === true;

const buildPriority = (row: OutboundCandidate) => {
  const statusMatched = PRIORITY_STATUSES.has(row.status);
  const demoKeywordMatched = includesDemoKeyword(row.note);
  const salesInvoiceDerived = isSalesInvoiceDerived(row);
  return {
    salesInvoiceDerived,
    demoKeywordMatched,
    statusMatched,
    createdAt: row.createdAt.getTime(),
  };
};

const comparePriority = (a: OutboundCandidate, b: OutboundCandidate) => {
  const pa = buildPriority(a);
  const pb = buildPriority(b);
  if (pa.salesInvoiceDerived !== pb.salesInvoiceDerived) return pa.salesInvoiceDerived ? -1 : 1;
  if (pa.demoKeywordMatched !== pb.demoKeywordMatched) return pa.demoKeywordMatched ? -1 : 1;
  if (pa.statusMatched !== pb.statusMatched) return pa.statusMatched ? -1 : 1;
  return pb.createdAt - pa.createdAt;
};

export async function GET(request: Request) {
  const ownerUserId = getCurrentUserId(request) ?? "dev_user_1";
  const prismaClient = prisma as PrismaClient;

  const schedules = await prismaClient.outboundSchedule.findMany({
    where: { ownerUserId },
    orderBy: [{ createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      sourceId: true,
      sourceType: true,
      note: true,
      status: true,
      createdAt: true,
      buyerName: true,
      modelNameSnapshot: true,
    },
  });

  if (schedules.length === 0) return NextResponse.json({ latestOutbound: null });

  const picked = [...schedules].sort(comparePriority)[0] ?? null;

  return NextResponse.json({
    latestOutbound: picked
      ? {
          id: picked.id,
          sourceId: picked.sourceId,
          buyerName: picked.buyerName,
          modelNameSnapshot: picked.modelNameSnapshot,
          status: picked.status,
        }
      : null,
  });
}
