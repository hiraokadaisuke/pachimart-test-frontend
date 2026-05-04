import Link from "next/link";

import { InventoryPlannedBadge, InventorySectionCard, InventorySummaryCard } from "@/components/inventory-demo/InventoryDemoPrimitives";
import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { Button } from "@/components/ui/button";
import { formatQuantity, inboundStatusLabel, inventoryItemTypeLabel } from "@/features/inventory/labels";
import { getInboundScheduleSummary, getInboundSchedules } from "@/features/inventory/server";

export default async function InboundPage() {
  const [schedules, summary] = await Promise.all([getInboundSchedules(), getInboundScheduleSummary()]);
  return <div className="mx-auto max-w-6xl px-4 py-8 md:px-6"><InventoryTabs /><h1 className="text-2xl font-bold">入庫予定一覧</h1>
    <InventorySectionCard title="この画面の役割" className="mt-4" description="パチマートで購入した物件を入庫予定へ反映し、在庫化までの倉庫業務を管理します。">
      <p className="text-sm text-slate-700">購入伝票と入庫予定をつなぐことで、Excelへの二重入力を減らす想定です。</p>
    </InventorySectionCard>
    <div className="mt-4"><Link href="/inventory/inbound/new" className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800">入庫予定を登録</Link></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3"><InventorySummaryCard label="入庫予定件数" value={`${schedules.length}件`} /><InventorySummaryCard label="入庫待ち" value={`${summary.ARRIVAL_WAITING?.count ?? 0}件`} /><InventorySummaryCard label="一部入庫" value={`${summary.PARTIALLY_RECEIVED?.count ?? 0}件`} /></div>
    <div className="mt-4 overflow-x-auto rounded-lg border bg-white"><table className="min-w-[980px] w-full text-sm"><thead className="bg-slate-50"><tr>{["入庫予定ID", "入庫予定日", "取引先", "種別", "メーカー", "機種名", "台数", "入庫先", "ステータス", "操作"].map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead><tbody>{schedules.map((s) => <tr key={s.id} className="border-t"><td className="px-3 py-2">{s.id}</td><td className="px-3 py-2">{s.expectedDate.toISOString().slice(0, 10)}</td><td className="px-3 py-2">{s.supplierName ?? "-"}</td><td className="px-3 py-2">{inventoryItemTypeLabel(s.itemType)}</td><td className="px-3 py-2">{s.makerNameSnapshot ?? "-"}</td><td className="px-3 py-2">{s.modelNameSnapshot}</td><td className="px-3 py-2">{formatQuantity(s.quantity)}</td><td className="px-3 py-2">{s.destinationLocation?.name ?? "-"}</td><td className="px-3 py-2"><InventoryStatusBadge status={inboundStatusLabel(s.status)} /></td><td className="px-3 py-2"><div className="flex items-center gap-2"><Button disabled>入庫完了</Button><InventoryPlannedBadge label="STEP2-Dで実装予定" /></div></td></tr>)}</tbody></table></div></div>;
}
