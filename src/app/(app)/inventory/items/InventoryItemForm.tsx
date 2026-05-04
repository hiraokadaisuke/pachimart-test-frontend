import type { InventoryItem, MachineModel, Maker, StorageLocation } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const itemTypes = ["パチンコ", "パチスロ"];
const ownershipTypes = ["在庫", "設置", "非在庫"];
const inventoryStatuses = ["在庫中", "商談中", "引当済", "発送予定", "売却済", "設置中", "非在庫"];
const listingStatuses = ["未出品", "出品中", "商談中", "成約済", "停止中", "終了"];

export function InventoryItemForm({
  action,
  makers,
  machineModels,
  storageLocations,
  item,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  makers: Maker[];
  machineModels: (MachineModel & { maker: Maker })[];
  storageLocations: StorageLocation[];
  item?: InventoryItem & { maker: Maker | null; machineModel: MachineModel | null; storageLocation: StorageLocation | null };
  submitLabel: string;
}) {
  return <form action={action} className="mx-auto max-w-5xl space-y-4 px-4 py-8 md:px-6">
    <h1 className="text-2xl font-bold">{item ? "在庫情報の編集" : "在庫の新規登録"}</h1>

    <Card><CardHeader><CardTitle className="text-base">基本情報</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-1 text-sm">種別<Select name="itemType" defaultValue={item ? (item.itemType === "PACHINKO" ? "パチンコ" : "パチスロ") : "パチンコ"}>{itemTypes.map((v) => <option key={v}>{v}</option>)}</Select></label>
      <label className="grid gap-1 text-sm">枠色<Input name="frameColor" defaultValue={item?.frameColor ?? ""} /></label>
      <label className="grid gap-1 text-sm">メーカー(マスタ)<Select name="makerId" defaultValue={item?.makerId ?? ""}><option value="">未選択</option>{makers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select></label>
      <label className="grid gap-1 text-sm">メーカー名(自由入力)<Input name="makerNameSnapshot" defaultValue={item?.makerNameSnapshot ?? ""} /></label>
      <label className="grid gap-1 text-sm">機種名(マスタ)<Select name="machineModelId" defaultValue={item?.machineModelId ?? ""}><option value="">未選択</option>{machineModels.map((m) => <option key={m.id} value={m.id}>{m.name}（{m.maker.name}）</option>)}</Select></label>
      <label className="grid gap-1 text-sm">機種名(必須)<Input required name="modelNameSnapshot" defaultValue={item?.modelNameSnapshot ?? ""} /></label>
    </CardContent></Card>

    <Card><CardHeader><CardTitle className="text-base">保管・ステータス</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-1 text-sm">台数<Input type="number" min={1} required name="quantityOnHand" defaultValue={item?.quantityOnHand ?? 1} /></label>
      <label className="grid gap-1 text-sm">保管場所<Select name="storageLocationId" defaultValue={item?.storageLocationId ?? ""}><option value="">未選択</option>{storageLocations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></label>
      <label className="grid gap-1 text-sm">所有区分<Select name="ownershipType" defaultValue={item ? (item.ownershipType === "STOCK" ? "在庫" : item.ownershipType === "INSTALLED" ? "設置" : "非在庫") : "在庫"}>{ownershipTypes.map((v) => <option key={v}>{v}</option>)}</Select></label>
      <label className="grid gap-1 text-sm">在庫ステータス<Select name="inventoryStatus" defaultValue={item ? ({ IN_STOCK: "在庫中", NEGOTIATING: "商談中", RESERVED: "引当済", OUTBOUND_SCHEDULED: "発送予定", SOLD: "売却済", INSTALLED: "設置中", NON_STOCK: "非在庫" }[item.inventoryStatus] ?? "在庫中") : "在庫中"}>{inventoryStatuses.map((v) => <option key={v}>{v}</option>)}</Select></label>
      <label className="grid gap-1 text-sm">出品状態<Select name="listingStatus" defaultValue={item ? ({ NOT_LISTED: "未出品", LISTED: "出品中", NEGOTIATING: "商談中", CONTRACTED: "成約済", SUSPENDED: "停止中", CLOSED: "終了" }[item.listingStatus] ?? "未出品") : "未出品"}>{listingStatuses.map((v) => <option key={v}>{v}</option>)}</Select></label>
    </CardContent></Card>

    <Card><CardHeader><CardTitle className="text-base">金額情報</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-1 text-sm">仕入単価<Input type="number" min={0} name="purchaseUnitPrice" defaultValue={item?.purchaseUnitPrice ?? ""} /></label>
      <label className="grid gap-1 text-sm">販売予定単価<Input type="number" min={0} name="plannedSaleUnitPrice" defaultValue={item?.plannedSaleUnitPrice ?? ""} /></label>
    </CardContent></Card>

    <Card><CardHeader><CardTitle className="text-base">備考</CardTitle></CardHeader><CardContent>
      <textarea name="note" defaultValue={item?.note ?? ""} className="min-h-24 w-full rounded-md border p-2 text-sm" />
    </CardContent></Card>

    <div className="flex gap-3"><Button type="submit">{submitLabel}</Button></div>
  </form>;
}
