import { Button } from "@/components/ui/button";
import type { InventoryItem, OutboundSchedule, StorageLocation } from "@prisma/client";

type Props = { action: (formData: FormData) => void | Promise<void>; storageLocations: StorageLocation[]; inventoryItems: Pick<InventoryItem, "id" | "modelNameSnapshot">[]; initial?: OutboundSchedule; readOnly?: boolean; submitLabel: string;};

export function OutboundScheduleForm({ action, storageLocations, inventoryItems, initial, readOnly=false, submitLabel }: Props) {
  return <form action={action} className="mt-4 grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2">
    <label>発送予定日<input required disabled={readOnly} defaultValue={initial?.expectedDate.toISOString().slice(0,10)} name="expectedDate" type="date" className="mt-1 w-full rounded border p-2"/></label>
    <label>販売先<input disabled={readOnly} defaultValue={initial?.buyerName ?? ""} name="buyerName" className="mt-1 w-full rounded border p-2"/></label>
    <label>種別<select disabled={readOnly} defaultValue={initial ? (initial.itemType === "PACHINKO" ? "パチンコ" : "パチスロ") : "パチンコ"} name="itemType" className="mt-1 w-full rounded border p-2"><option>パチンコ</option><option>パチスロ</option></select></label>
    <label>メーカー<input disabled={readOnly} defaultValue={initial?.makerNameSnapshot ?? ""} name="makerNameSnapshot" className="mt-1 w-full rounded border p-2"/></label>
    <label>機種名<input required disabled={readOnly} defaultValue={initial?.modelNameSnapshot ?? ""} name="modelNameSnapshot" className="mt-1 w-full rounded border p-2"/></label>
    <label>枠色<input disabled={readOnly} defaultValue={initial?.frameColor ?? ""} name="frameColor" className="mt-1 w-full rounded border p-2"/></label>
    <label>台数<input required min={1} disabled={readOnly} defaultValue={initial?.quantity ?? 1} name="quantity" type="number" className="mt-1 w-full rounded border p-2"/></label>
    <label>出庫元<select disabled={readOnly} defaultValue={initial?.originLocationId ?? ""} name="originLocationId" className="mt-1 w-full rounded border p-2"><option value="">未選択</option>{storageLocations.map((l)=> <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
    <label>発送方法<select required disabled={readOnly} defaultValue={initial ? ({PREPAID:"元払い",COLLECT:"着払い",CHARTER:"チャーター便",OTHER:"その他"}[initial.shippingMethod]) : "元払い"} name="shippingMethod" className="mt-1 w-full rounded border p-2"><option>元払い</option><option>着払い</option><option>チャーター便</option><option>その他</option></select></label>
    <label>ステータス<select disabled={readOnly} defaultValue={initial ? ({PLANNED:"未発送",PICKING:"ピッキング中",READY_TO_SHIP:"発送準備中",SHIPPED:"発送済",DELIVERED:"納品済",CANCELED:"取消"}[initial.status]) : "未発送"} name="status" className="mt-1 w-full rounded border p-2"><option>未発送</option><option>ピッキング中</option><option>発送準備中</option><option>発送済</option><option>納品済</option><option>取消</option></select></label>
    <label>紐付け在庫（任意）<select disabled={readOnly} defaultValue={initial?.inventoryItemId ?? ""} name="inventoryItemId" className="mt-1 w-full rounded border p-2"><option value="">未選択</option>{inventoryItems.map((i)=><option key={i.id} value={i.id}>{i.modelNameSnapshot} ({i.id})</option>)}</select></label>
    <label className="sm:col-span-2">備考<textarea disabled={readOnly} defaultValue={initial?.note ?? ""} name="note" className="mt-1 w-full rounded border p-2"/></label>
    <div className="sm:col-span-2">{readOnly ? <Button type="button" disabled>保存不可</Button> : <Button type="submit">{submitLabel}</Button>}</div>
  </form>;
}
