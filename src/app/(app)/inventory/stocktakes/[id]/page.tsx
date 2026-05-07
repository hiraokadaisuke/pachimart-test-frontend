import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelStocktakeSession, completeStocktakeSession, getStocktakeSessionById, startStocktakeSession } from "@/features/inventory/server";

export default async function StocktakeDetail({params}:{params:Promise<{id:string}>}){const {id}=await params; const s=await getStocktakeSessionById(id); if(!s) return notFound();
return <main className="mx-auto max-w-6xl p-4"><h1 className="text-xl font-bold">{s.name}</h1>
<p className="text-sm">status:{s.status} / 開始:{s.startedAt?.toLocaleString() ?? '-'} / 完了:{s.completedAt?.toLocaleString() ?? '-'} / 対象:{s.targetStorageLocation?.name ?? s.targetWarehouse?.name ?? '-'}</p>
<div className="my-2 flex flex-wrap gap-2">
{s.status==='DRAFT'&&<form action={async()=>{"use server";await startStocktakeSession(id);}}><button className="border px-2">棚卸開始</button></form>}
{s.status!=='CANCELED'&&s.status!=='COMPLETED'&&<Link className="border px-2" href={`/inventory/stocktakes/${id}/scan`}>スキャン画面へ</Link>}
<Link className="border px-2" href={`/inventory/stocktakes/${id}/diffs`}>差異一覧へ</Link>
{s.status==='IN_PROGRESS' || s.status==='DRAFT'?<form action={async()=>{"use server";await completeStocktakeSession(id);}}><button className="border px-2">棚卸完了</button></form>:null}
{s.status==='IN_PROGRESS' || s.status==='DRAFT'?<form action={async()=>{"use server";await cancelStocktakeSession(id);}}><button className="border px-2">取消</button></form>:null}
<Link className="border px-2" href={`/inventory/stocktakes`}>一覧へ戻る</Link>
</div>
{s.summary.expectedNotScannedCount>0 && (s.status==='IN_PROGRESS' || s.status==='DRAFT')?<p className="mb-2 text-amber-700">差異があります。調整は別フェーズです。</p>:null}
<div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4"><div>スキャン数:{s.summary.totalScans}</div><div>一致:{s.summary.matchedCount}</div><div>差異:{s.summary.notFoundCount+s.summary.duplicateCount+s.summary.wrongLocationCount+s.summary.manualReviewCount}</div><div>未スキャン想定:{s.summary.expectedNotScannedCount}</div><div>QR補助一致:{s.summary.qrMatchedCount}</div><div>重複読取:{s.summary.duplicateCount}</div><div>保管先違い:{s.summary.wrongLocationCount}</div><div>未登録読取:{s.summary.notFoundCount}</div></div>
</main>}
