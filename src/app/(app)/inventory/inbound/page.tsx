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

type FilterType = "all" | "destination-missing";

function isDestinationMissingOpenSchedule(schedule: { destinationLocationId: string | null; status: string }) {
  return schedule.destinationLocationId === null && schedule.status !== "RECEIVED" && schedule.status !== "CANCELED";
}

export default async function InboundSchedulesPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const [schedules, summary, params] = await Promise.all([getInboundSchedules(), getInboundScheduleSummary(), searchParams]);
  const filter: FilterType = params?.filter === "destination-missing" ? "destination-missing" : "all";

  const destinationMissingCount = schedules.filter((schedule: (typeof schedules)[number]) => isDestinationMissingOpenSchedule(schedule)).length;
  const filteredSchedules =
    filter === "destination-missing"
      ? schedules.filter((schedule: (typeof schedules)[number]) => isDestinationMissingOpenSchedule(schedule))
      : schedules;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <InventoryTabs />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">入庫予定</h1>
        <p className="text-sm text-slate-700">未設定：{destinationMissingCount}件 / 全体：{schedules.length}件</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href="/inventory/inbound"
          className={`rounded-md border px-3 py-1.5 text-sm ${
            filter === "all" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          全て
        </Link>
        <Link
          href="/inventory/inbound?filter=destination-missing"
          className={`rounded-md border px-3 py-1.5 text-sm ${
            filter === "destination-missing"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          入庫先未設定のみ（{destinationMissingCount}）
        </Link>
      </div>
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
            {filteredSchedules.map((s: (typeof filteredSchedules)[number]) => {
              const autoCreated = getAutoCreatedInboundInfo({ sourceType: s.sourceType, sourceId: s.sourceId, note: s.note });
              const destinationMissing = !s.destinationLocationId;
              const isOpenSchedule = s.status !== "RECEIVED" && s.status !== "CANCELED";
              const needsDestinationSetup = destinationMissing && isOpenSchedule;
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
                      <div className="space-y-1">
                        <Badge variant="outline" className="border-red-400 text-red-700">入庫先未設定</Badge>
                        {needsDestinationSetup ? (
                          <div>
                            <Link href={`/inventory/inbound/${s.id}/edit`} className="text-xs text-blue-700 underline underline-offset-2 hover:text-blue-800">
                              入庫先を設定する
                            </Link>
                          </div>
                        ) : null}
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
                      {needsDestinationSetup ? <span className="text-xs text-red-700">入庫先未設定のため完了できません</span> : null}
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
