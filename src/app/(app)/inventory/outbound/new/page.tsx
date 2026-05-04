import { redirect } from "next/navigation";

import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { Button } from "@/components/ui/button";
import { createOutboundSchedule, getInventoryFormMasters } from "@/features/inventory/server";

export default async function NewOutboundPage() {
  const masters = await getInventoryFormMasters();
  async function action(formData: FormData) {"use server"; await createOutboundSchedule(formData); redirect('/inventory/outbound'); }
  return <div className="mx-auto max-w-4xl px-4 py-8 md:px-6"><InventoryTabs /><h1 className="text-2xl font-bold">発送予定を登録</h1><form action={action} className="mt-4 grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2">
    <label>発送予定日<input required name="expectedDate" type="date" className="mt-1 w-full rounded border p-2"/></label>
    <label>販売先<input name="buyerName" className="mt-1 w-full rounded border p-2"/></label>
    <label>種別<select name="itemType" className="mt-1 w-full rounded border p-2"><option>パチンコ</option><option>パチスロ</option></select></label>
    <label>メーカー<input name="makerNameSnapshot" className="mt-1 w-full rounded border p-2"/></label>
    <label>機種名<input required name="modelNameSnapshot" className="mt-1 w-full rounded border p-2"/></label>
    <label>枠色<input name="frameColor" className="mt-1 w-full rounded border p-2"/></label>
    <label>台数<input required min={1} name="quantity" type="number" className="mt-1 w-full rounded border p-2"/></label>
    <label>出庫元<select name="originLocationId" className="mt-1 w-full rounded border p-2"><option value="">未選択</option>{masters.storageLocations.map((l)=> <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
    <label>発送方法<select name="shippingMethod" className="mt-1 w-full rounded border p-2"><option>元払い</option><option>着払い</option><option>チャーター便</option><option>その他</option></select></label>
    <label>ステータス<select name="status" className="mt-1 w-full rounded border p-2"><option>未発送</option><option>ピッキング中</option><option>発送準備中</option><option>発送済</option><option>納品済</option><option>取消</option></select></label>
    <label>紐付け在庫（任意）<select name="inventoryItemId" className="mt-1 w-full rounded border p-2"><option value="">未選択</option></select></label>
    <label className="sm:col-span-2">備考<textarea name="note" className="mt-1 w-full rounded border p-2"/></label>
    <div className="sm:col-span-2"><Button type="submit">登録する</Button></div>
  </form></div>;
}
