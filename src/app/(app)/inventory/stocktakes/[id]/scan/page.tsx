import Link from "next/link";
import { notFound } from "next/navigation";
import { createStocktakeScan, getStocktakeSessionById } from "@/features/inventory/server";

const labels: Record<string,string> = { MATCHED:"一致", QR_MATCHED:"QR補助一致・番号確認推奨", NOT_FOUND:"未登録", DUPLICATE_SCAN:"この棚卸で既に読取済", WRONG_LOCATION:"保管先違い", MANUAL_REVIEW:"候補複数・要確認" };

export default async function ScanPage({params}:{params:Promise<{id:string}>}){const {id}=await params; const s=await getStocktakeSessionById(id); if(!s) return notFound();
  const session = s;
  async function action(fd:FormData){"use server"; await createStocktakeScan({ownerUserId:session.ownerUserId,sessionId:id,scannedDisplayCode:String(fd.get('displayCode')??''),scannedRawQr:String(fd.get('rawQr')??''),targetStorageLocationId:session.targetStorageLocationId,memo:String(fd.get('memo')??'')||null});}
  const latest = s.scans[0];
return <main className="mx-auto max-w-md space-y-3 bg-white p-3"><h1 className="text-lg font-bold">棚卸スキャン</h1><p className="text-xs text-slate-600">QR・番号を読み取り、棚卸結果を照合します。</p><form action={action} className="space-y-2 rounded border p-3"><input autoFocus name="displayCode" className="w-full rounded border p-3" placeholder="現物番号 / Unit番号"/><input name="rawQr" className="w-full rounded border p-3" placeholder="QR(補助)"/><input name="memo" className="w-full rounded border p-3" placeholder="メモ"/><button className="w-full rounded bg-emerald-700 p-3 text-white">照合して保存</button></form>
{latest?<div className="rounded border-2 border-emerald-200 bg-emerald-50 p-4"><p className="text-xs">直近結果</p><p className="text-xl font-bold">{labels[latest.matchStatus] ?? latest.matchStatus}</p><p className="text-sm">{latest.scannedDisplayCode ?? latest.scannedRawQr ?? '-'} / {latest.scannedAt.toLocaleString()}</p></div>:<p className="rounded border border-dashed p-3 text-sm text-slate-500">まだスキャン結果はありません。</p>}
<Link href={`/inventory/stocktakes/${id}`} className="text-sm underline">詳細へ戻る</Link><ul className="text-sm">{s.scans.slice(0,10).map((r)=><li key={r.id} className="border-b py-1">{labels[r.matchStatus] ?? r.matchStatus} / {r.scannedDisplayCode ?? r.scannedRawQr}</li>)}</ul></main>}
