import { redirect } from "next/navigation";
import { createStocktakeSession } from "@/features/inventory/server";

export default function NewStocktakePage(){
  return <main className="mx-auto max-w-3xl p-4"><h1 className="text-xl font-bold mb-3">棚卸作成</h1><form action={async (fd)=>{"use server"; const s=await createStocktakeSession(fd); redirect(`/inventory/stocktakes/${s.id}`);}} className="space-y-3">
    <input name="name" placeholder="棚卸名" className="w-full border p-2" required/>
    <input name="targetWarehouseId" placeholder="対象倉庫ID(任意)" className="w-full border p-2"/>
    <input name="targetStorageLocationId" placeholder="対象保管先ID(任意)" className="w-full border p-2"/>
    <textarea name="memo" placeholder="メモ" className="w-full border p-2"/>
    <button className="border px-3 py-1">作成</button>
  </form></main>
}
