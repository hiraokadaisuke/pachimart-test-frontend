import { InventoryPlannedBadge, InventorySectionCard, InventorySummaryCard } from "@/components/inventory-demo/InventoryDemoPrimitives";
import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { Button } from "@/components/ui/button";
import { formatQuantity, outboundSchedules } from "@/features/inventory/mock";

export default function OutboundPage() {
  const preparing = outboundSchedules.filter((s) => s.status === "発送準備中").length;
  const notShipped = outboundSchedules.filter((s) => s.status === "未発送").length;
  return <div className="mx-auto max-w-6xl px-4 py-8 md:px-6"><InventoryTabs /><h1 className="text-2xl font-bold">発送予定一覧</h1>
    <InventorySectionCard title="この画面の役割" className="mt-4" description="販売・成約後の発送を管理し、在庫反映と利益管理につなげる画面です。">
      <p className="text-sm text-slate-700">販売伝票と発送予定を連携し、出庫元や発送方法を一元管理します。</p>
    </InventorySectionCard>
    <div className="mt-4 grid gap-3 sm:grid-cols-3"><InventorySummaryCard label="発送予定件数" value={`${outboundSchedules.length}件`} /><InventorySummaryCard label="発送準備中" value={`${preparing}件`} /><InventorySummaryCard label="未発送" value={`${notShipped}件`} /></div>
    <div className="mt-4 overflow-x-auto rounded-lg border bg-white"><table className="min-w-[1100px] w-full text-sm"><thead className="bg-slate-50"><tr>{["発送予定ID", "発送予定日", "販売先", "種別", "メーカー", "機種名", "台数", "出庫元", "発送方法", "ステータス", "操作"].map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead><tbody>{outboundSchedules.map((s) => <tr key={s.id} className="border-t"><td className="px-3 py-2">{s.id}</td><td className="px-3 py-2">{s.expectedDate}</td><td className="px-3 py-2">{s.buyer}</td><td className="px-3 py-2">{s.type}</td><td className="px-3 py-2">{s.manufacturer}</td><td className="px-3 py-2">{s.modelName}</td><td className="px-3 py-2">{formatQuantity(s.quantity)}</td><td className="px-3 py-2">{s.origin}</td><td className="px-3 py-2">{s.shippingMethod}</td><td className="px-3 py-2"><InventoryStatusBadge status={s.status} /></td><td className="px-3 py-2"><div className="flex items-center gap-2"><Button disabled>発送完了</Button><InventoryPlannedBadge label="STEP2以降で実装予定" /></div></td></tr>)}</tbody></table></div></div>;
}
