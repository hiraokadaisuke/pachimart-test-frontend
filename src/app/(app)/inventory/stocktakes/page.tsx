import Link from "next/link";
import { getStocktakeSessions } from "@/features/inventory/server";

const badge = (status: string) =>
  ({ DRAFT: "bg-slate-100 text-slate-700", IN_PROGRESS: "bg-sky-100 text-sky-700", COMPLETED: "bg-emerald-100 text-emerald-700", CANCELED: "bg-rose-100 text-rose-700" }[status] ?? "bg-slate-100 text-slate-700");

export default async function StocktakeListPage() {
  const sessions = await getStocktakeSessions();
  return (
    <main className="mx-auto max-w-[1680px] px-3 py-3 md:px-5">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-lg font-bold">棚卸一覧</h1>
        <Link className="rounded-sm border border-emerald-700 bg-emerald-700 px-3 py-1 text-xs font-semibold text-white" href="/inventory/stocktakes/new">新規作成</Link>
      </div>
      <div className="overflow-x-auto rounded border border-slate-300 bg-white">
        <table className="w-full min-w-[1100px] text-xs">
          <thead className="bg-slate-100">
            <tr>
              {["棚卸名", "ステータス", "対象", "開始", "完了", "スキャン", "差異", "未スキャン", "操作"].map((h) => <th key={h} className="border-r border-slate-200 px-2 py-1.5 text-left font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => <tr key={s.id} className="border-t border-slate-200 hover:bg-slate-50"><td className="px-2 py-1">{s.name}</td><td className="px-2 py-1"><span className={`rounded px-1.5 py-0.5 text-[11px] ${badge(s.status)}`}>{s.status}</span></td><td className="px-2 py-1">{s.targetStorageLocation?.name ?? s.targetWarehouse?.name ?? '-'}</td><td className="px-2 py-1">{s.startedAt?.toLocaleString() ?? '-'}</td><td className="px-2 py-1">{s.completedAt?.toLocaleString() ?? '-'}</td><td className="px-2 py-1 text-right">{s.summary.totalScans}</td><td className="px-2 py-1 text-right">{s.summary.notFoundCount+s.summary.duplicateCount+s.summary.wrongLocationCount+s.summary.manualReviewCount}</td><td className="px-2 py-1 text-right">{s.summary.expectedNotScannedCount}</td><td className="px-2 py-1 text-[11px]"><div className="flex gap-2"><Link className="underline" href={`/inventory/stocktakes/${s.id}`}>詳細</Link><Link className="underline" href={`/inventory/stocktakes/${s.id}/scan`}>スキャン</Link><Link className="underline" href={`/inventory/stocktakes/${s.id}/diffs`}>差異</Link></div></td></tr>)}
          </tbody>
        </table>
      </div>
    </main>
  );
}
