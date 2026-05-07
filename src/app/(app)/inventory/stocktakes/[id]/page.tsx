import Link from "next/link";
import { notFound } from "next/navigation";
import { getStocktakeSessionById } from "@/features/inventory/server";

export default async function StocktakeDetail({params}:{params:Promise<{id:string}>}){const {id}=await params; const s=await getStocktakeSessionById(id); if(!s) return notFound();
const c=(k:string)=>s.scans.filter(x=>x.matchStatus===k).length;
return <main className="mx-auto max-w-6xl p-4"><h1 className="text-xl font-bold">{s.name}</h1><div className="my-2 flex gap-2"><Link className="border px-2" href={`/inventory/stocktakes/${id}/scan`}>スキャン画面へ</Link><Link className="border px-2" href={`/inventory/stocktakes/${id}/diffs`}>差異一覧</Link></div>
<p>status:{s.status} / target:{s.targetStorageLocation?.name ?? '-'}</p><div className="grid grid-cols-3 gap-2 text-sm"><div>スキャン済:{s.scans.length}</div><div>MATCHED:{c('MATCHED')}</div><div>QR_MATCHED:{c('QR_MATCHED')}</div><div>NOT_FOUND:{c('NOT_FOUND')}</div><div>DUPLICATE:{c('DUPLICATE_SCAN')}</div><div>WRONG_LOCATION:{c('WRONG_LOCATION')}</div></div>
<table className="w-full border text-xs mt-3"><thead><tr><th>読取番号</th><th>rawQr</th><th>status</th><th>matchedBy</th><th>Unit</th><th>機種</th><th>保管先</th><th>scannedAt</th></tr></thead><tbody>{s.scans.map(x=><tr key={x.id} className="border-t"><td>{x.scannedDisplayCode}</td><td>{x.scannedRawQr}</td><td>{x.matchStatus}</td><td>{x.matchedBy}</td><td>{x.inventoryUnit?.displayCode ?? '-'}</td><td>{x.inventoryUnit?.inventoryItem.modelNameSnapshot ?? '-'}</td><td>{x.storageLocation?.name ?? '-'}</td><td>{x.scannedAt.toLocaleString()}</td></tr>)}</tbody></table></main>}
