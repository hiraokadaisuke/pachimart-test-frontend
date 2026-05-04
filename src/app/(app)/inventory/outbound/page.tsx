import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { Button } from "@/components/ui/button";
import { formatQuantity, outboundSchedules } from "@/features/inventory/mock";

export default function OutboundPage() {
  return <div className="mx-auto max-w-6xl px-4 py-8 md:px-6"><InventoryTabs /><h1 className="text-2xl font-bold">発送予定一覧</h1><p className="mt-2 text-slate-600">販売・成約した物件を、発送予定として管理します。発送完了後は在庫数に反映されます。</p>
  <div className="mt-4 overflow-x-auto rounded-lg border bg-white"><table className="min-w-[1100px] w-full text-sm"><thead className="bg-slate-50"><tr>{["発送予定ID","発送予定日","販売先","種別","メーカー","機種名","台数","出庫元","発送方法","ステータス","操作"].map(h=><th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead><tbody>{outboundSchedules.map((s)=><tr key={s.id} className="border-t"><td className="px-3 py-2">{s.id}</td><td className="px-3 py-2">{s.expectedDate}</td><td className="px-3 py-2">{s.buyer}</td><td className="px-3 py-2">{s.type}</td><td className="px-3 py-2">{s.manufacturer}</td><td className="px-3 py-2">{s.modelName}</td><td className="px-3 py-2">{formatQuantity(s.quantity)}</td><td className="px-3 py-2">{s.origin}</td><td className="px-3 py-2">{s.shippingMethod}</td><td className="px-3 py-2"><InventoryStatusBadge status={s.status} /></td><td className="px-3 py-2"><Button disabled size="sm">発送完了</Button></td></tr>)}</tbody></table></div></div>;
}
