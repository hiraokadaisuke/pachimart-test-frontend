import { notFound } from "next/navigation";
import { getStocktakeSessionById } from "@/features/inventory/server";
import { prismaClient as prisma } from "@/features/inventory/server";

export default async function Diffs({params}:{params:Promise<{id:string}>}){const {id}=await params; const s=await getStocktakeSessionById(id); if(!s) return notFound();
  const scannedIds=s.scans.map(x=>x.inventoryUnitId).filter(Boolean) as string[];
  const expected= await prisma.inventoryUnit.findMany({where:{ownerUserId:s.ownerUserId,status:{in:['IN_STOCK','RESERVED']},storageLocationId:s.targetStorageLocationId ?? undefined,id:{notIn:scannedIds}},take:200});
  const by=(k:string)=>s.scans.filter(x=>x.matchStatus===k);
  return <main className="mx-auto max-w-5xl p-4"><h1 className="text-xl font-bold">差異一覧</h1><p>未登録:{by('NOT_FOUND').length} 重複:{by('DUPLICATE_SCAN').length} 保管先違い:{by('WRONG_LOCATION').length} QRのみ:{by('QR_MATCHED').length} 未スキャン想定:{expected.length}</p></main>
}
