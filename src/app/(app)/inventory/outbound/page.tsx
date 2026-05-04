import Link from "next/link";

import { InventoryPlannedBadge, InventorySectionCard, InventorySummaryCard } from "@/components/inventory-demo/InventoryDemoPrimitives";
import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { Button } from "@/components/ui/button";
import { formatQuantity, inventoryItemTypeLabel, outboundStatusLabel, shippingMethodLabel } from "@/features/inventory/labels";
import { getOutboundScheduleSummary, getOutboundSchedules } from "@/features/inventory/server";

export default async function OutboundPage() {
  const [schedules, summary] = await Promise.all([getOutboundSchedules(), getOutboundScheduleSummary()]);
  return <div className="mx-auto max-w-6xl px-4 py-8 md:px-6"><InventoryTabs /><h1 className="text-2xl font-bold">発送予定一覧</h1>
    <InventorySectionCard title="この画面の役割" className="mt-4" description="販売・成約後の発送を管理し、在庫反映と利益管理につなげる画面です。">
      <p className="text-sm text-slate-700">販売伝票と発送予定を連携し、出庫元や発送方法を一元管理します。</p>
    </InventorySectionCard>
    <div className="mt-4"><Link href="/inventory/outbound/new" className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800">発送予定を登録</Link></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3"><InventorySummaryCard label="発送予定件数" value={`${schedules.length}件`} /><InventorySummaryCard label="発送準備中" value={`${summary.READY_TO_SHIP?.count ?? 0}件`} /><InventorySummaryCard label="未発送" value={`${summary.PLANNED?.count ?? 0}件`} /></div>
    <div className="mt-4 overflow-x-auto rounded-lg border bg-white"><table className="min-w-[1100px] w-full text-sm"><thead className="bg-slate-50"><tr>{["発送予定ID", "発送予定日", "販売先", "種別", "メーカー", "機種名", "台数", "出庫元", "発送方法", "ステータス", "操作"].map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead><tbody>{schedules.map((s) => <tr key={s.id} className="border-t"><td className="px-3 py-2">{s.id}</td><td className="px-3 py-2">{s.expectedDate.toISOString().slice(0, 10)}</td><td className="px-3 py-2">{s.buyerName ?? "-"}</td><td className="px-3 py-2">{inventoryItemTypeLabel(s.itemType)}</td><td className="px-3 py-2">{s.makerNameSnapshot ?? "-"}</td><td className="px-3 py-2">{s.modelNameSnapshot}</td><td className="px-3 py-2">{formatQuantity(s.quantity)}</td><td className="px-3 py-2">{s.originLocation?.name ?? "-"}</td><td className="px-3 py-2">{shippingMethodLabel(s.shippingMethod)}</td><td className="px-3 py-2"><InventoryStatusBadge status={outboundStatusLabel(s.status)} /></td><td className="px-3 py-2"><div className="flex items-center gap-2"><Button disabled>発送完了</Button><InventoryPlannedBadge label="STEP2-Dで実装予定" /></div></td></tr>)}</tbody></table></div></div>;
}
