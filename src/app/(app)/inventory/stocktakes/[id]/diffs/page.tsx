import { notFound } from "next/navigation";
import { getStocktakeSessionById } from "@/features/inventory/server";

const sections = ["NOT_FOUND","DUPLICATE_SCAN","WRONG_LOCATION","QR_MATCHED","MANUAL_REVIEW"] as const;

export default async function Diffs({params}:{params:Promise<{id:string}>}){const {id}=await params; const s=await getStocktakeSessionById(id); if(!s) return notFound();
  const by=(k:string)=>s.scans.filter(x=>x.matchStatus===k);
  const diffCount = s.summary.notFoundCount+s.summary.duplicateCount+s.summary.wrongLocationCount+s.summary.manualReviewCount;
  return <main className="mx-auto max-w-7xl p-4"><h1 className="text-xl font-bold">差異一覧</h1><p className="mb-2 text-sm">在庫調整は次フェーズです。今回は照合結果の確認のみ行います。</p>
  {diffCount===0 && s.summary.expectedNotScannedCount===0 ? <p>差異はありません</p> : null}
  {sections.map((k)=><section key={k} className="mb-4"><h2 className="font-semibold">{k} <span className="text-xs">({by(k).length})</span></h2><table className="w-full border text-xs"><thead><tr><th>読取番号</th><th>rawQr</th><th>判定</th><th>紐づきUnit</th><th>機種名</th><th>現在保管先</th><th>対象保管先</th><th>日時</th><th>メモ</th></tr></thead><tbody>{by(k).map(x=><tr key={x.id} className="border-t"><td>{x.scannedDisplayCode ?? '-'}</td><td>{x.scannedRawQr ?? '-'}</td><td>{x.matchStatus}</td><td>{x.inventoryUnit?.displayCode ?? '-'}</td><td>{x.inventoryUnit?.inventoryItem.modelNameSnapshot ?? '-'}</td><td>{x.inventoryUnit?.storageLocationId ?? '-'}</td><td>{s.targetStorageLocation?.name ?? s.targetWarehouse?.name ?? '-'}</td><td>{x.scannedAt.toLocaleString()}</td><td>{x.memo ?? '-'}</td></tr>)}</tbody></table></section>)}
  <section><h2 className="font-semibold">想定在庫だが未スキャン ({s.summary.expectedNotScannedCount})</h2><table className="w-full border text-xs"><thead><tr><th>Unit</th><th>rawQr</th><th>機種</th><th>現在保管先</th></tr></thead><tbody>{s.summary.expectedNotScannedUnits.map(u=><tr key={u.id} className="border-t"><td>{u.displayCode ?? '-'}</td><td>{u.rawQr ?? '-'}</td><td>{u.inventoryItem.modelNameSnapshot}</td><td>{u.storageLocationId ?? '-'}</td></tr>)}</tbody></table></section>
  </main>
}
