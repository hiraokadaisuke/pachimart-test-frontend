import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventorySummaryCard } from "@/components/inventory-demo/InventoryDemoPrimitives";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { formatQuantity, inboundStatusLabel, inventoryItemTypeLabel } from "@/features/inventory/labels";
import { cancelInboundSchedule, completeInboundSchedule, getInboundScheduleSummary, getInboundSchedules } from "@/features/inventory/server";

export default async function InboundSchedulesPage() {
  const [schedules, summary] = await Promise.all([getInboundSchedules(), getInboundScheduleSummary()]);
  return <div className="mx-auto max-w-6xl px-4 py-8 md:px-6"><InventoryTabs /><h1 className="text-2xl font-bold">入庫予定</h1>
    <div className="mt-4"><Link href="/inventory/inbound/new" className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800">入庫予定を登録</Link></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3"><InventorySummaryCard label="入庫予定件数" value={`${schedules.length}件`} /><InventorySummaryCard label="入庫待ち" value={`${summary.ARRIVAL_WAITING?.count ?? 0}件`} /><InventorySummaryCard label="一部入庫" value={`${summary.PARTIALLY_RECEIVED?.count ?? 0}件`} /></div>
    <div className="mt-4 overflow-x-auto rounded-lg border bg-white"><table className="min-w-[980px] w-full text-sm"><thead className="bg-slate-50"><tr>{["入庫予定ID","入庫予定日","取引先","種別","メーカー","機種名","台数","入庫先","ステータス","操作"].map((h)=><th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead><tbody>{schedules.map((s)=>{const isDone=s.status==="RECEIVED"||s.status==="CANCELED"; return <tr key={s.id} className="border-t"><td className="px-3 py-2">{s.id}</td><td className="px-3 py-2">{s.expectedDate.toISOString().slice(0,10)}</td><td className="px-3 py-2">{s.supplierName??"-"}</td><td className="px-3 py-2">{inventoryItemTypeLabel(s.itemType)}</td><td className="px-3 py-2">{s.makerNameSnapshot??"-"}</td><td className="px-3 py-2">{s.modelNameSnapshot}</td><td className="px-3 py-2">{formatQuantity(s.quantity)}</td><td className="px-3 py-2">{s.destinationLocation?.name??"-"}</td><td className="px-3 py-2"><InventoryStatusBadge status={inboundStatusLabel(s.status)} /></td><td className="px-3 py-2">{s.status==="RECEIVED"?<span className="text-xs font-medium text-slate-500">入庫済</span>:s.status==="CANCELED"?<span className="text-xs font-medium text-slate-500">取消済</span>:<div className="flex gap-2"><Link href={`/inventory/inbound/${s.id}/edit`} className="text-xs underline">編集</Link><form action={async()=>{"use server";await cancelInboundSchedule(s.id);redirect('/inventory/inbound')}}><Button type="submit" variant="outline">取消する</Button></form><form action={async()=>{"use server";await completeInboundSchedule(s.id);redirect('/inventory/inbound')}}><Button type="submit">入庫完了</Button></form></div>}</td></tr>})}</tbody></table></div></div>;
}
