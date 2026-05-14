import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { formatQuantity, outboundStatusLabel, shippingMethodLabel } from "@/features/inventory/labels";
import { cancelCompletedOutboundSchedule, cancelOutboundSchedule, completeOutboundSchedule, getOutboundScheduleById } from "@/features/inventory/server";

export default async function OutboundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const schedule = await getOutboundScheduleById(id);
  if (!schedule) notFound();

  const sourceLabel = schedule.sourceId?.startsWith("S-V-") || schedule.sourceId?.startsWith("S-H-") || schedule.note?.includes("販売伝票連携") ? "販売伝票由来" : schedule.sourceType ?? "MANUAL";
  const unit = schedule.inventoryUnits[0] ?? null;

  return <div className="mx-auto max-w-5xl px-4 py-6 space-y-4"><InventoryTabs /><h1 className="text-2xl font-bold">出庫予定詳細</h1>
    <div className="rounded border bg-white p-4 text-sm grid gap-2 md:grid-cols-2">
      <p>予定日: {schedule.expectedDate.toISOString().slice(0,10)}</p><p>ステータス: {outboundStatusLabel(schedule.status)}</p>
      <p>販売先/買主: {schedule.buyerName ?? "-"}</p><p>発送方法: {shippingMethodLabel(schedule.shippingMethod)}</p>
      <p>発送先: {schedule.buyerName ?? "-"}</p><p>運送会社: -</p>
      <p>sourceType/sourceId: {schedule.sourceType ?? "-"} / {schedule.sourceId ?? "-"}（{sourceLabel}）</p><p>dedupeKey: {schedule.dedupeKey ?? "-"}</p>
    </div>
    <div className="rounded border bg-white p-4 text-sm grid gap-2 md:grid-cols-2">
      <p>InventoryItem: {schedule.inventoryItemId ?? "-"}</p><p>機種名: {schedule.modelNameSnapshot}</p>
      <p>台数: {formatQuantity(schedule.quantity)}</p><p>保管先: {schedule.originLocation?.name ??  "-"}</p>
    </div>
    <div className="rounded border bg-white p-4 text-sm space-y-1">
      <h2 className="font-semibold">対象Unit</h2>
      <p>displayCode: {unit?.displayCode ?? "-"}</p><p>rawQr: {unit?.rawQr ?? "-"}</p><p>status: {unit?.status ?? "-"}</p><p>codeType: {unit?.codeType ?? "-"}</p><p>memo: {unit?.memo ?? "-"}</p><p>storageLocationName: { "-"}</p>
    </div>
    <div className="flex flex-wrap gap-2">
      <Link href={`/inventory/outbound/${schedule.id}/work`} className="underline text-sm">出庫作業へ</Link>
      <form action={async ()=>{"use server"; await completeOutboundSchedule(schedule.id); redirect(`/inventory/outbound/${schedule.id}/work`);}}><Button type="submit" disabled={!schedule.inventoryItemId}>出庫完了</Button></form>
      <form action={async ()=>{"use server"; if (["SHIPPED","DELIVERED"].includes(schedule.status)) { await cancelCompletedOutboundSchedule(schedule.id);} else { await cancelOutboundSchedule(schedule.id);} redirect('/inventory/outbound');}}><Button type="submit" variant="outline">取消</Button></form>
      <Link href="/inventory/outbound" className="underline text-sm">一覧へ戻る</Link>
    </div>
  </div>;
}
