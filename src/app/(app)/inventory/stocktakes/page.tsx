import Link from "next/link";
import { getStocktakeSessions } from "@/features/inventory/server";

export default async function StocktakeListPage() {
  const sessions = await getStocktakeSessions();
  return <main className="mx-auto max-w-6xl p-4"><div className="mb-3 flex justify-between"><h1 className="text-xl font-bold">棚卸一覧</h1><Link className="border px-3 py-1" href="/inventory/stocktakes/new">新規作成</Link></div>
  <table className="w-full border text-sm"><thead><tr className="bg-slate-100"><th>棚卸名</th><th>ステータス</th><th>対象</th><th>開始</th><th>完了</th><th>スキャン</th><th>一致</th><th>差異</th><th></th></tr></thead><tbody>
    {sessions.map((s)=><tr key={s.id} className="border-t"><td>{s.name}</td><td>{s.status}</td><td>{s.targetStorageLocation?.name ?? s.targetWarehouse?.name ?? '-'}</td><td>{s.startedAt?.toLocaleDateString() ?? '-'}</td><td>{s.completedAt?.toLocaleDateString() ?? '-'}</td><td>{s.scans.length}</td><td>{s.scans.filter(x=>x.matchStatus==='MATCHED'||x.matchStatus==='QR_MATCHED').length}</td><td>{s.scans.filter(x=>x.matchStatus!=='MATCHED'&&x.matchStatus!=='QR_MATCHED').length}</td><td><Link className="underline" href={`/inventory/stocktakes/${s.id}`}>詳細</Link></td></tr>)}
  </tbody></table></main>;
}
