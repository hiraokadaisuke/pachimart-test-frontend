import { Button } from "@/components/ui/button";
import type { InboundSchedule, InventoryItem, StorageLocation } from "@prisma/client";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  storageLocations: StorageLocation[];
  inventoryItems: Pick<InventoryItem, "id" | "modelNameSnapshot">[];
  initial?: InboundSchedule;
  readOnly?: boolean;
  submitLabel: string;
};

export function InboundScheduleForm({ action, storageLocations, inventoryItems, initial, readOnly = false, submitLabel }: Props) {
  return (
    <form action={action} className="mt-4 grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2">
      <label>入庫予定日<input required disabled={readOnly} defaultValue={initial?.expectedDate.toISOString().slice(0, 10)} name="expectedDate" type="date" className="mt-1 w-full rounded border p-2"/></label>
      <label>仕入先<input disabled={readOnly} defaultValue={initial?.supplierName ?? ""} name="supplierName" className="mt-1 w-full rounded border p-2"/></label>
      <label>種別<select disabled={readOnly} defaultValue={initial ? (initial.itemType === "PACHINKO" ? "パチンコ" : "パチスロ") : "パチンコ"} name="itemType" className="mt-1 w-full rounded border p-2"><option>パチンコ</option><option>パチスロ</option></select></label>
      <label>メーカー<input disabled={readOnly} defaultValue={initial?.makerNameSnapshot ?? ""} name="makerNameSnapshot" className="mt-1 w-full rounded border p-2"/></label>
      <label>機種名<input required disabled={readOnly} defaultValue={initial?.modelNameSnapshot ?? ""} name="modelNameSnapshot" className="mt-1 w-full rounded border p-2"/></label>
      <label>枠色<input disabled={readOnly} defaultValue={initial?.frameColor ?? ""} name="frameColor" className="mt-1 w-full rounded border p-2"/></label>
      <label>台数<input required min={1} disabled={readOnly} defaultValue={initial?.quantity ?? 1} name="quantity" type="number" className="mt-1 w-full rounded border p-2"/></label>
      <label>入庫先<select disabled={readOnly} defaultValue={initial?.destinationLocationId ?? ""} name="destinationLocationId" className="mt-1 w-full rounded border p-2"><option value="">未選択</option>{storageLocations.map((l)=> <option key={l.id} value={l.id}>{l.name}</option>)}</select><p className="mt-1 text-xs text-slate-500">未設定のまま保存できますが、入庫完了時には設定が必要です。</p></label>
      <label>ステータス<select disabled={readOnly} defaultValue={initial ? ({ PLANNED:"未入庫", ARRIVAL_WAITING:"入庫待ち", PARTIALLY_RECEIVED:"一部入庫", RECEIVED:"入庫済", CANCELED:"取消" }[initial.status]) : "未入庫"} name="status" className="mt-1 w-full rounded border p-2"><option>未入庫</option><option>入庫待ち</option><option>一部入庫</option><option>入庫済</option><option>取消</option></select></label>
      <label>紐付け在庫（任意）<select disabled={readOnly} defaultValue={initial?.inventoryItemId ?? ""} name="inventoryItemId" className="mt-1 w-full rounded border p-2"><option value="">未選択</option>{inventoryItems.map((i)=><option key={i.id} value={i.id}>{i.modelNameSnapshot} ({i.id})</option>)}</select></label>
      <label className="sm:col-span-2">備考<textarea disabled={readOnly} defaultValue={initial?.note ?? ""} name="note" className="mt-1 w-full rounded border p-2"/></label>
      <div className="sm:col-span-2">{readOnly ? <Button type="button" disabled>保存不可</Button> : <Button type="submit">{submitLabel}</Button>}</div>
    </form>
  );
}
