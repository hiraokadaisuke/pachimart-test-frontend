import Link from "next/link";
import { notFound } from "next/navigation";
import { createStocktakeScan, getStocktakeSessionById } from "@/features/inventory/server";
import { prismaClient as prisma } from "@/features/inventory/server";

export default async function ScanPage({params}:{params:Promise<{id:string}>}){const {id}=await params; const s=await getStocktakeSessionById(id); if(!s) return notFound();
  const session = s;
  async function action(fd:FormData){"use server"; await createStocktakeScan({ownerUserId:session.ownerUserId,sessionId:id,scannedDisplayCode:String(fd.get('displayCode')??''),scannedRawQr:String(fd.get('rawQr')??''),targetStorageLocationId:session.targetStorageLocationId,memo:String(fd.get('memo')??'')||null});}
  const recent = await prisma.inventoryStocktakeScan.findMany({where:{sessionId:id},orderBy:{createdAt:'desc'},take:10});
return <main className="mx-auto max-w-xl p-4"><h1 className="text-lg font-bold">棚卸スキャン</h1><form action={action} className="space-y-2"><input name="displayCode" className="w-full border p-3" placeholder="displayCode"/><input name="rawQr" className="w-full border p-3" placeholder="rawQr"/><input name="memo" className="w-full border p-3" placeholder="memo"/><button className="w-full bg-slate-900 text-white p-3">照合して保存</button></form><Link href={`/inventory/stocktakes/${id}`} className="underline">戻る</Link><ul className="mt-3 text-sm">{recent.map((r:any)=><li key={r.id} className="border-b py-1">{r.matchStatus} / {r.scannedDisplayCode ?? r.scannedRawQr}</li>)}</ul></main>}
