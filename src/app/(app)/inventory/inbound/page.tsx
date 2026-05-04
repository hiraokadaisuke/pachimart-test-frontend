import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { Button } from "@/components/ui/button";
import { formatQuantity, inboundSchedules } from "@/features/inventory/mock";

export default function InboundPage() {
  return <div className="mx-auto max-w-6xl px-4 py-8 md:px-6"><InventoryTabs /><h1 className="text-2xl font-bold">入庫予定一覧</h1><p className="mt-2 text-slate-600">購入・仕入が確定した物件を、入庫予定として管理します。入庫完了後は在庫物件として反映されます。</p>
  <div className="mt-4 overflow-x-auto rounded-lg border bg-white"><table className="min-w-[980px] w-full text-sm"><thead className="bg-slate-50"><tr>{["入庫予定ID","入庫予定日","取引先","種別","メーカー","機種名","台数","入庫先","ステータス","操作"].map(h=><th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead><tbody>{inboundSchedules.map((s)=><tr key={s.id} className="border-t"><td className="px-3 py-2">{s.id}</td><td className="px-3 py-2">{s.expectedDate}</td><td className="px-3 py-2">{s.supplier}</td><td className="px-3 py-2">{s.type}</td><td className="px-3 py-2">{s.manufacturer}</td><td className="px-3 py-2">{s.modelName}</td><td className="px-3 py-2">{formatQuantity(s.quantity)}</td><td className="px-3 py-2">{s.destination}</td><td className="px-3 py-2"><InventoryStatusBadge status={s.status} /></td><td className="px-3 py-2"><Button disabled size="sm">入庫完了</Button></td></tr>)}</tbody></table></div></div>;
}
