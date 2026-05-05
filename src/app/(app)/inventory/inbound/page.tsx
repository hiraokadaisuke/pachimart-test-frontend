import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventorySummaryCard } from "@/components/inventory-demo/InventoryDemoPrimitives";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { formatQuantity, inboundStatusLabel, inventoryItemTypeLabel } from "@/features/inventory/labels";
import { getAutoCreatedInboundInfo } from "@/features/inventory/inbound-auto";
import {
  cancelCompletedInboundSchedule,
  cancelInboundSchedule,
  completeInboundSchedule,
  getInboundScheduleSummary,
  getInboundSchedules,
} from "@/features/inventory/server";

export default async function InboundSchedulesPage() {
  const [schedules, summary] = await Promise.all([getInboundSchedules(), getInboundScheduleSummary()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <InventoryTabs />
      <h1 className="text-2xl font-bold">入庫予定</h1>
      <div className="mt-4">
        <Link href="/inventory/inbound/new" className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800">
          入庫予定を登録
        </Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <InventorySummaryCard label="入庫予定件数" value={`${schedules.length}件`} />
        <InventorySummaryCard label="入庫待ち" value={`${summary.ARRIVAL_WAITING?.count ?? 0}件`} />
        <InventorySummaryCard label="一部入庫" value={`${summary.PARTIALLY_RECEIVED?.count ?? 0}件`} />
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-[980px] w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["入庫予定ID", "入庫予定日", "取引先", "種別", "メーカー", "機種名", "台数", "入庫先", "ステータス", "操作"].map((h) => (
                <th key={h} className="px-3 py-2 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => {
              const autoCreated = getAutoCreatedInboundInfo({ sourceType: s.sourceType, sourceId: s.sourceId, note: s.note });
              const destinationMissing = !s.destinationLocationId;
              return <tr key={s.id} className="border-t">
                <td className="px-3 py-2">{s.id}</td>
                <td className="px-3 py-2">{s.expectedDate.toISOString().slice(0, 10)}</td>
                <td className="px-3 py-2">{s.supplierName ?? "-"}</td>
                <td className="px-3 py-2">{inventoryItemTypeLabel(s.itemType)}</td>
                <td className="px-3 py-2">{s.makerNameSnapshot ?? "-"}</td>
                <td className="px-3 py-2">{s.modelNameSnapshot}</td>
                <td className="px-3 py-2">{formatQuantity(s.quantity)}</td>
                <td className="px-3 py-2">
                  <div className="space-y-1">
                    <span>{s.destinationLocation?.name ?? "-"}</span>
                    {destinationMissing ? (
                      <div>
                        <Badge variant="outline" className="border-red-400 text-red-700">入庫先未設定</Badge>
                      </div>
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="space-y-1">
                    <InventoryStatusBadge status={inboundStatusLabel(s.status)} />
                    {autoCreated.isAutoCreated ? (
                      <div className="space-y-1">
                        <Badge variant="default">パチマート購入から自動作成</Badge>
                        {autoCreated.sourceType ? <p className="text-[11px] text-slate-600">Source: {autoCreated.sourceType} / Source ID: {autoCreated.sourceId ?? "-"}</p> : null}
                        {autoCreated.dealingId ? <p className="text-[11px] text-slate-600">Dealing ID: {autoCreated.dealingId}</p> : null}
                        {autoCreated.isLegacyNoteBased ? <p className="text-[11px] text-amber-700">旧形式(note判定)</p> : null}
                      </div>
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {s.status === "RECEIVED" ? (
                    <div className="flex items-center gap-2">
                      <form action={async () => {"use server"; await cancelCompletedInboundSchedule(s.id); redirect("/inventory/inbound");}}>
                        <Button type="submit" variant="outline">入庫済みを取消</Button>
                      </form>
                      <span className="text-xs text-amber-700">在庫を減算します</span>
                    </div>
                  ) : s.status === "CANCELED" ? (
                    <span className="text-xs font-medium text-slate-500">取消済</span>
                  ) : (
                    <div className="flex gap-2">
                      <Link href={`/inventory/inbound/${s.id}/edit`} className="text-xs underline">編集</Link>
                      {destinationMissing ? <span className="text-xs text-red-700">入庫先未設定のため完了できません</span> : null}
                      <form action={async () => {"use server"; await cancelInboundSchedule(s.id); redirect("/inventory/inbound");}}>
                        <Button type="submit" variant="outline">取消する</Button>
                      </form>
                      <form action={async () => {"use server"; await completeInboundSchedule(s.id); redirect("/inventory/inbound");}}>
                        <Button type="submit" disabled={destinationMissing} title={destinationMissing ? "入庫先を設定してください" : undefined}>入庫完了</Button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
