import Link from "next/link";
import { getStocktakeSessions } from "@/features/inventory/server";

const badge = (status: string) => ({ DRAFT: "bg-slate-100", IN_PROGRESS: "bg-blue-100", COMPLETED: "bg-emerald-100", CANCELED: "bg-rose-100" }[status] ?? "bg-slate-100");

export default async function StocktakeListPage() {
  const sessions = await getStocktakeSessions();
  return <main className="mx-auto max-w-7xl p-4"><div className="mb-3 flex justify-between"><h1 className="text-xl font-bold">棚卸一覧</h1><Link className="border px-3 py-1" href="/inventory/stocktakes/new">新規作成</Link></div>
  <table className="w-full border text-sm"><thead><tr className="bg-slate-100"><th>棚卸名</th><th>ステータス</th><th>対象</th><th>開始</th><th>完了</th><th>スキャン</th><th>差異</th><th>未スキャン</th><th></th></tr></thead><tbody>
    {sessions.map((s)=><tr key={s.id} className="border-t"><td>{s.name}</td><td><span className={`rounded px-2 py-0.5 text-xs ${badge(s.status)}`}>{s.status}</span></td><td>{s.targetStorageLocation?.name ?? s.targetWarehouse?.name ?? '-'}</td><td>{s.startedAt?.toLocaleString() ?? '-'}</td><td>{s.completedAt?.toLocaleString() ?? '-'}</td><td>{s.summary.totalScans}</td><td>{s.summary.notFoundCount+s.summary.duplicateCount+s.summary.wrongLocationCount+s.summary.manualReviewCount}</td><td>{s.summary.expectedNotScannedCount}</td><td className="space-x-2"><Link className="underline" href={`/inventory/stocktakes/${s.id}`}>詳細</Link><Link className="underline" href={`/inventory/stocktakes/${s.id}/scan`}>スキャン</Link><Link className="underline" href={`/inventory/stocktakes/${s.id}/diffs`}>差異</Link></td></tr>)}
  </tbody></table></main>;
}
