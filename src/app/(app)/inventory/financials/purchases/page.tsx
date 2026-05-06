import { cookies } from "next/headers";
import Link from "next/link";
import { DEV_USERS } from "@/lib/dev-user/users";
import { prisma } from "@/lib/server/prisma";
import { parsePagination } from "@/features/inventory/financials";

export default async function PurchasesPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const ownerUserId = (await cookies()).get("dev_user_id")?.value ?? DEV_USERS.A.id;
  const { page, pageSize, skip, take } = parsePagination(searchParams);
  const where = { ownerUserId };
  const [rows, totalCount] = await Promise.all([
    prisma.purchaseRecord.findMany({ where, include: { inventoryItem: { include: { maker: true, machineModel: true } } }, orderBy: { purchaseDate: "desc" }, skip, take }),
    prisma.purchaseRecord.count({ where }),
  ]);
  return <div className="mx-auto max-w-6xl px-4 py-8 text-sm"><h1 className="text-2xl font-bold mb-3">仕入一覧</h1><Link href="/inventory/financials/purchases.csv" className="underline text-blue-600">CSV出力</Link><table className="w-full mt-3 border text-xs"><thead><tr>{["仕入日","在庫","メーカー","台数","仕入合計","支払","取引ID","作成種別","取消"].map(h=><th key={h} className="border p-1">{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id}><td className="border p-1">{r.purchaseDate.toISOString().slice(0,10)}</td><td className="border p-1"><Link className="underline" href={`/inventory/items/${r.inventoryItemId}`}>{r.inventoryItem.modelNameSnapshot}</Link></td><td className="border p-1">{r.inventoryItem.maker?.name ?? r.inventoryItem.makerNameSnapshot ?? "-"}</td><td className="border p-1">{r.quantity}</td><td className="border p-1">{r.totalCost}</td><td className="border p-1">{r.paymentStatus}</td><td className="border p-1">{r.dealingId ?? "-"}</td><td className="border p-1">{(r.memo ?? "").includes("AUTO") ? "自動" : "手動"}</td><td className="border p-1">{r.paymentStatus === "CANCELED" ? "取消" : "-"}</td></tr>)}</tbody></table><div className="mt-3 flex gap-3"><span>{totalCount}件</span>{page>1&&<Link className="underline" href={`?page=${page-1}&pageSize=${pageSize}`}>Prev</Link>}{skip+take<totalCount&&<Link className="underline" href={`?page=${page+1}&pageSize=${pageSize}`}>Next</Link>}</div></div>;
}
