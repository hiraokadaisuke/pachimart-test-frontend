import { redirect } from "next/navigation";

import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { Button } from "@/components/ui/button";
import { getInventoryFormMasters, createInboundSchedule } from "@/features/inventory/server";

export default async function NewInboundPage() {
  const masters = await getInventoryFormMasters();
  async function action(formData: FormData) {"use server"; await createInboundSchedule(formData); redirect('/inventory/inbound'); }
  return <div className="mx-auto max-w-4xl px-4 py-8 md:px-6"><InventoryTabs /><h1 className="text-2xl font-bold">入庫予定を登録</h1><form action={action} className="mt-4 grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2">{[['expectedDate','入庫予定日','date'],['supplierName','仕入先','text'],['itemType','種別','select'],['makerNameSnapshot','メーカー','text'],['modelNameSnapshot','機種名','text'],['frameColor','枠色','text'],['quantity','台数','number'],['status','ステータス','select']].map(()=>null)}
    <label>入庫予定日<input required name="expectedDate" type="date" className="mt-1 w-full rounded border p-2"/></label>
    <label>仕入先<input name="supplierName" className="mt-1 w-full rounded border p-2"/></label>
    <label>種別<select name="itemType" className="mt-1 w-full rounded border p-2"><option>パチンコ</option><option>パチスロ</option></select></label>
    <label>メーカー<input name="makerNameSnapshot" className="mt-1 w-full rounded border p-2"/></label>
    <label>機種名<input required name="modelNameSnapshot" className="mt-1 w-full rounded border p-2"/></label>
    <label>枠色<input name="frameColor" className="mt-1 w-full rounded border p-2"/></label>
    <label>台数<input required min={1} name="quantity" type="number" className="mt-1 w-full rounded border p-2"/></label>
    <label>入庫先<select name="destinationLocationId" className="mt-1 w-full rounded border p-2"><option value="">未選択</option>{masters.storageLocations.map((l)=> <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
    <label>ステータス<select name="status" className="mt-1 w-full rounded border p-2"><option>未入庫</option><option>入庫待ち</option><option>一部入庫</option><option>入庫済</option><option>取消</option></select></label>
    <label>紐付け在庫（任意）<select name="inventoryItemId" className="mt-1 w-full rounded border p-2"><option value="">未選択</option></select></label>
    <label className="sm:col-span-2">備考<textarea name="note" className="mt-1 w-full rounded border p-2"/></label>
    <div className="sm:col-span-2"><Button type="submit">登録する</Button></div>
  </form></div>;
}
